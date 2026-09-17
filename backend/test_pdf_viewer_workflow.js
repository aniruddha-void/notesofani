const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const http = require('http');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = require('./src/server');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');
const Download = require('./src/models/Download');
const { generateToken } = require('./src/utils/jwt');

async function runTest() {
  console.log('--- STARTING PDF VIEWER WORKFLOW & SECURITY TESTS ---');
  let testUser = null;
  let subject = null;
  let resourceA = null;
  let resourceB = null;
  let resourceProtected = null;
  let resourceVideo = null;
  let serverInstance = null;
  let userToken = null;

  try {
    await connectDB();

    const testPort = 5098;
    serverInstance = app.listen(testPort);
    console.log(`Test server running on port ${testPort}`);

    testUser = await User.create({
      googleId: 'test_viewer_google_' + Date.now(),
      email: `testviewer_${Date.now()}@example.com`,
      name: 'Test Viewer User',
    });
    userToken = generateToken({ id: testUser._id, role: 'user', email: testUser.email });

    subject = await Subject.create({
      name: 'Computer Engineering ' + Date.now(),
      code: 'CE' + Math.floor(Math.random() * 1000),
      description: 'Test Engineering Subject',
    });

    const uploadsDir = path.join(__dirname, 'uploads/pdf');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const pdfPathA = path.join(uploadsDir, `test_java_view_${Date.now()}.pdf`);
    const pdfPathB = path.join(uploadsDir, `test_devops_view_${Date.now()}.pdf`);
    fs.writeFileSync(pdfPathA, '%PDF-1.4 Mock Java PDF Content');
    fs.writeFileSync(pdfPathB, '%PDF-1.4 Mock DevOps PDF Content');

    const fileUrlA = `/uploads/pdf/${path.basename(pdfPathA)}`;
    const fileUrlB = `/uploads/pdf/${path.basename(pdfPathB)}`;

    resourceA = await Resource.create({
      title: 'Java Programming Guide',
      description: 'Core Java reference PDF',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlA,
      published: true,
    });

    resourceB = await Resource.create({
      title: 'DevOps & CI-CD Handbook',
      description: 'DevOps documentation PDF',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlB,
      published: true,
    });

    const hash = await bcrypt.hash('secret123', 10);
    resourceProtected = await Resource.create({
      title: 'Protected Exam Paper PDF',
      description: 'Protected exam solutions',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlA,
      published: true,
      passwordProtected: true,
      passwordHash: hash,
    });

    resourceVideo = await Resource.create({
      title: 'Java Tutorial Video',
      description: 'Video lesson',
      subject: subject._id,
      resourceType: 'Video',
      sourceType: 'external',
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      published: true,
    });

    console.log(`Resource A (Java): ${resourceA._id}`);
    console.log(`Resource B (DevOps): ${resourceB._id}`);
    console.log(`Resource Protected: ${resourceProtected._id}`);
    console.log(`Resource Video: ${resourceVideo._id}`);

    const makeRequest = (options, postData = null) => {
      const opts = { ...options };
      opts.headers = opts.headers || {};
      if (userToken && !opts.headers['Cookie']) {
        opts.headers['Cookie'] = `userToken=${userToken}`;
      }
      return new Promise((resolve, reject) => {
        const req = http.request(opts, (res) => {
          let data = [];
          res.on('data', (chunk) => data.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: buffer,
              text: buffer.toString('utf8'),
            });
          });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
      });
    };

    console.log('\n[TEST 1] Loading Resource A & Resource B for Viewer...');
    const resA = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resourceA._id}`,
      method: 'GET',
    });
    const jsonA = JSON.parse(resA.text);
    if (jsonA.data.resource._id !== resourceA._id.toString() || jsonA.data.resource.fileUrl !== fileUrlA) {
      throw new Error('Resource A payload invalid or ID mismatch');
    }

    const resB = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resourceB._id}`,
      method: 'GET',
    });
    const jsonB = JSON.parse(resB.text);
    if (jsonB.data.resource._id !== resourceB._id.toString() || jsonB.data.resource.fileUrl !== fileUrlB) {
      throw new Error('Resource B payload invalid or ID mismatch');
    }
    if (jsonA.data.resource._id === jsonB.data.resource._id) {
      throw new Error('Resource A and Resource B returned matching IDs!');
    }
    console.log('PASS: Resource A and Resource B loaded with distinct Resource IDs and file URLs.');

    console.log('\n[TEST 2] Fetching Protected PDF without password...');
    const resProt = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resourceProtected._id}`,
      method: 'GET',
    });
    const jsonProt = JSON.parse(resProt.text);
    if (jsonProt.data.resource.isUnlocked !== false || jsonProt.data.resource.fileUrl !== '') {
      throw new Error('Protected PDF exposed fileUrl without password unlock!');
    }
    if (jsonProt.data.resource.passwordHash) {
      throw new Error('passwordHash exposed in API response!');
    }
    console.log('PASS: Locked PDF correctly hides fileUrl and does not expose passwordHash.');

    console.log('\n[TEST 3] Verifying incorrect password for Protected PDF...');
    const postDataWrong = JSON.stringify({ password: 'wrongpassword' });
    const resWrong = await makeRequest(
      {
        hostname: 'localhost',
        port: testPort,
        path: `/api/v1/resources/${resourceProtected._id}/verify-password`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postDataWrong),
        },
      },
      postDataWrong
    );
    console.log(`Status: ${resWrong.statusCode}`);
    if (resWrong.statusCode !== 401) throw new Error('Expected 401 for incorrect password');
    console.log('PASS: Incorrect password denied with 401.');

    console.log('\n[TEST 4] Verifying correct password for Protected PDF...');
    const postDataCorrect = JSON.stringify({ password: 'secret123' });
    const resCorrect = await makeRequest(
      {
        hostname: 'localhost',
        port: testPort,
        path: `/api/v1/resources/${resourceProtected._id}/verify-password`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postDataCorrect),
        },
      },
      postDataCorrect
    );
    console.log(`Status: ${resCorrect.statusCode}`);
    const jsonCorrect = JSON.parse(resCorrect.text);
    if (resCorrect.statusCode !== 200 || !jsonCorrect.data.isUnlocked || !jsonCorrect.data.fileUrl) {
      throw new Error('Failed to unlock PDF with correct password');
    }
    const setCookie = resCorrect.headers['set-cookie'];
    if (!setCookie || !setCookie.some((c) => c.includes(`res_access_${resourceProtected._id}`))) {
      throw new Error('Access cookie was not set on successful password verification!');
    }
    console.log('PASS: Correct password unlocked PDF & issued resource-scoped HTTP-only cookie.');

    console.log('\n[TEST 5] Downloading PDF from Viewer using Task 1 API...');
    const resDownload = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resourceA._id}/download`,
      method: 'POST',
      headers: { Cookie: `userToken=${userToken}` },
    });
    console.log(`Download Status: ${resDownload.statusCode}`);
    if (resDownload.statusCode !== 200) throw new Error('Download from viewer failed');
    if (!resDownload.headers['content-disposition']?.includes('attachment; filename="Java Programming Guide.pdf"')) {
      throw new Error('Invalid Content-Disposition header in viewer download');
    }

    const downloadRec = await Download.findOne({ user: testUser._id, resource: resourceA._id });
    if (!downloadRec) throw new Error('Download from viewer failed to create Download MongoDB record!');
    console.log('PASS: Viewer download executed Task 1 endpoint & created Download MongoDB record.');

    console.log('\n========================================');
    console.log('ALL PDF VIEWER & SECURITY TESTS PASSED SUCCESSFULLY!');
    console.log('========================================');
  } catch (err) {
    console.error('\nTEST FAILED WITH ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (testUser) await User.findByIdAndDelete(testUser._id).catch(() => {});
    if (subject) await Subject.findByIdAndDelete(subject._id).catch(() => {});
    if (resourceA) await Resource.findByIdAndDelete(resourceA._id).catch(() => {});
    if (resourceB) await Resource.findByIdAndDelete(resourceB._id).catch(() => {});
    if (resourceProtected) await Resource.findByIdAndDelete(resourceProtected._id).catch(() => {});
    if (resourceVideo) await Resource.findByIdAndDelete(resourceVideo._id).catch(() => {});
    if (testUser) await Download.deleteMany({ user: testUser._id }).catch(() => {});

    if (serverInstance) serverInstance.close();
    await mongoose.connection.close();
  }
}

runTest();

