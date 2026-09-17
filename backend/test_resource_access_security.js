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
  console.log('--- STARTING RESOURCE ACCESS SECURITY TESTS ---');
  let testUser = null;
  let subject = null;
  let resPdf = null;
  let resVideo = null;
  let resPyq = null;
  let resDrive = null;
  let resLink = null;
  let resProtected = null;
  let serverInstance = null;
  let userToken = null;

  try {
    await connectDB();

    const testPort = 5095;
    serverInstance = app.listen(testPort);
    console.log(`Test server running on port ${testPort}`);

    testUser = await User.create({
      googleId: 'test_sec_google_' + Date.now(),
      email: `testsec_${Date.now()}@example.com`,
      name: 'Test Security User',
    });
    userToken = generateToken({ id: testUser._id, role: 'user', email: testUser.email });

    subject = await Subject.create({
      name: 'Security Test Subject ' + Date.now(),
      code: 'SEC' + Math.floor(Math.random() * 1000),
      description: 'Security Subject',
    });

    const uploadsDir = path.join(__dirname, 'uploads/pdf');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const pdfPath = path.join(uploadsDir, `test_sec_pdf_${Date.now()}.pdf`);
    fs.writeFileSync(pdfPath, '%PDF-1.4 Security Mock Content');
    const fileUrlPdf = `/uploads/pdf/${path.basename(pdfPath)}`;

    resPdf = await Resource.create({
      title: 'Unprotected PDF Resource',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlPdf,
      published: true,
    });

    resVideo = await Resource.create({
      title: 'Unprotected Video Resource',
      subject: subject._id,
      resourceType: 'Video',
      sourceType: 'external',
      externalUrl: 'https://www.youtube.com/watch?v=sec123',
      published: true,
    });

    resPyq = await Resource.create({
      title: 'Unprotected PYQ Resource',
      subject: subject._id,
      resourceType: 'PYQ',
      sourceType: 'upload',
      fileUrl: fileUrlPdf,
      published: true,
    });

    resDrive = await Resource.create({
      title: 'Unprotected Google Drive Resource',
      subject: subject._id,
      resourceType: 'Google Drive',
      sourceType: 'external',
      externalUrl: 'https://drive.google.com/drive/folders/sec123',
      published: true,
    });

    resLink = await Resource.create({
      title: 'Unprotected Useful Link Resource',
      subject: subject._id,
      resourceType: 'Useful Link',
      sourceType: 'external',
      externalUrl: 'https://example.com/sec-link',
      published: true,
    });

    const hash = await bcrypt.hash('pass12345', 10);
    resProtected = await Resource.create({
      title: 'Protected PDF Resource',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlPdf,
      published: true,
      passwordProtected: true,
      passwordHash: hash,
    });

    const makeRequest = (options, postData = null) => {
      return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = [];
          res.on('data', (c) => data.push(c));
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

    console.log('\n[TEST 1] Logged-out GET /api/v1/resources...');
    const r1 = await makeRequest({ hostname: 'localhost', port: testPort, path: '/api/v1/resources', method: 'GET' });
    const j1 = JSON.parse(r1.text).data.resources;
    const leaked1 = j1.filter((r) => r.fileUrl !== '' || r.externalUrl !== '' || r.isUnlocked !== false);
    if (leaked1.length > 0) {
      throw new Error(`Logged-out GET /resources leaked content URLs for ${leaked1.length} resources!`);
    }
    console.log('PASS: Logged-out resource catalog returns metadata ONLY. No fileUrl or externalUrl exposed.');

    console.log('\n[TEST 2] Logged-out GET /api/v1/resources/:id for Video & PDF...');
    const r2Video = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resVideo._id}`, method: 'GET' });
    const j2Video = JSON.parse(r2Video.text).data.resource;
    if (j2Video.externalUrl !== '' || j2Video.isUnlocked !== false) {
      throw new Error('Logged-out GET /resources/:id leaked externalUrl!');
    }
    console.log('PASS: Logged-out resource detail hides externalUrl and fileUrl.');

    console.log('\n[TEST 3] Logged-out Download Request...');
    const r3 = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resPdf._id}/download`, method: 'POST' });
    if (r3.statusCode !== 401) throw new Error(`Expected 401 for logged-out download, got ${r3.statusCode}`);
    const dlCount = await Download.countDocuments({ user: testUser._id });
    if (dlCount !== 0) throw new Error('Download record created for logged-out request!');
    console.log('PASS: Logged-out download request rejected with 401 and 0 Download records created.');

    console.log('\n[TEST 4] Logged-out Password Unlock Request...');
    const postData4 = JSON.stringify({ password: 'pass12345' });
    const r4 = await makeRequest(
      {
        hostname: 'localhost',
        port: testPort,
        path: `/api/v1/resources/${resProtected._id}/verify-password`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData4) },
      },
      postData4
    );
    if (r4.statusCode !== 401) throw new Error(`Expected 401 for logged-out password verify, got ${r4.statusCode}`);
    console.log('PASS: Logged-out password verification rejected with 401 (Google Login required FIRST).');

    console.log('\n[TEST 5] Logged-in GET /api/v1/resources/:id for Unprotected Video & Drive...');
    const r5Video = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resVideo._id}`,
      method: 'GET',
      headers: { Cookie: `userToken=${userToken}` },
    });
    const j5Video = JSON.parse(r5Video.text).data.resource;
    if (j5Video.isUnlocked !== true || j5Video.externalUrl !== 'https://www.youtube.com/watch?v=sec123') {
      throw new Error('Logged-in request failed to receive unlocked externalUrl');
    }
    console.log('PASS: Logged-in user receives unlocked content URLs for unprotected resources.');

    console.log('\n[TEST 6] Logged-in Password Unlock for Protected Resource (Layer 1 + Layer 2)...');
    const r6Locked = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resProtected._id}`,
      method: 'GET',
      headers: { Cookie: `userToken=${userToken}` },
    });
    const j6Locked = JSON.parse(r6Locked.text).data.resource;
    if (j6Locked.isUnlocked !== false || j6Locked.fileUrl !== '') {
      throw new Error('Protected resource was unlocked before entering password!');
    }

    const postData6 = JSON.stringify({ password: 'pass12345' });
    const r6Unlock = await makeRequest(
      {
        hostname: 'localhost',
        port: testPort,
        path: `/api/v1/resources/${resProtected._id}/verify-password`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData6),
          Cookie: `userToken=${userToken}`,
        },
      },
      postData6
    );
    if (r6Unlock.statusCode !== 200 || !JSON.parse(r6Unlock.text).data.isUnlocked) {
      throw new Error('Logged-in password verification failed for protected resource!');
    }
    console.log('PASS: Two-Layer Security verified (Google Login FIRST, then per-resource password).');

    console.log('\n========================================');
    console.log('ALL RESOURCE ACCESS SECURITY TESTS PASSED SUCCESSFULLY!');
    console.log('========================================');
  } catch (err) {
    console.error('\nTEST FAILED WITH ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (testUser) await User.findByIdAndDelete(testUser._id).catch(() => {});
    if (subject) await Subject.findByIdAndDelete(subject._id).catch(() => {});
    if (resPdf) await Resource.findByIdAndDelete(resPdf._id).catch(() => {});
    if (resVideo) await Resource.findByIdAndDelete(resVideo._id).catch(() => {});
    if (resPyq) await Resource.findByIdAndDelete(resPyq._id).catch(() => {});
    if (resDrive) await Resource.findByIdAndDelete(resDrive._id).catch(() => {});
    if (resLink) await Resource.findByIdAndDelete(resLink._id).catch(() => {});
    if (resProtected) await Resource.findByIdAndDelete(resProtected._id).catch(() => {});
    if (testUser) await Download.deleteMany({ user: testUser._id }).catch(() => {});

    if (serverInstance) serverInstance.close();
    await mongoose.connection.close();
  }
}

runTest();

