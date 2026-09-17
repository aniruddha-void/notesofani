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
  console.log('--- STARTING RESOURCE DETAIL ACTIONS & FIVE-TYPE TESTS ---');
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

    const testPort = 5097;
    serverInstance = app.listen(testPort);
    console.log(`Test server running on port ${testPort}`);

    testUser = await User.create({
      googleId: 'test_actions_google_' + Date.now(),
      email: `testactions_${Date.now()}@example.com`,
      name: 'Test Actions User',
    });
    userToken = generateToken({ id: testUser._id, role: 'user', email: testUser.email });

    subject = await Subject.create({
      name: 'Action Types Subject ' + Date.now(),
      code: 'ACT' + Math.floor(Math.random() * 1000),
      description: 'Test Actions Subject',
    });

    const uploadsDir = path.join(__dirname, 'uploads/pdf');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const pdfPath = path.join(uploadsDir, `test_pdf_act_${Date.now()}.pdf`);
    const pyqPath = path.join(uploadsDir, `test_pyq_act_${Date.now()}.pdf`);
    fs.writeFileSync(pdfPath, '%PDF-1.4 Mock PDF Content');
    fs.writeFileSync(pyqPath, '%PDF-1.4 Mock PYQ Content');

    const fileUrlPdf = `/uploads/pdf/${path.basename(pdfPath)}`;
    const fileUrlPyq = `/uploads/pdf/${path.basename(pyqPath)}`;

    // 1. PDF Resource
    resPdf = await Resource.create({
      title: 'Advanced Mathematics PDF',
      description: 'PDF Textbook',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlPdf,
      published: true,
    });

    // 2. Video Resource
    resVideo = await Resource.create({
      title: 'Physics Video Lecture',
      description: 'YouTube Video',
      subject: subject._id,
      resourceType: 'Video',
      sourceType: 'external',
      externalUrl: 'https://www.youtube.com/watch?v=sample123',
      published: true,
    });

    // 3. PYQ Resource
    resPyq = await Resource.create({
      title: '2025 Semester Exam PYQ Paper',
      description: 'Previous Year Question Paper',
      subject: subject._id,
      resourceType: 'PYQ',
      sourceType: 'upload',
      fileUrl: fileUrlPyq,
      published: true,
    });

    // 4. Google Drive Resource
    resDrive = await Resource.create({
      title: 'Lab Manuals Google Drive Folder',
      description: 'Shared Drive Material',
      subject: subject._id,
      resourceType: 'Google Drive',
      sourceType: 'external',
      externalUrl: 'https://drive.google.com/drive/folders/samplefolder123',
      published: true,
    });

    // 5. Useful Link Resource
    resLink = await Resource.create({
      title: 'Official Documentation Website',
      description: 'Reference Link',
      subject: subject._id,
      resourceType: 'Useful Link',
      sourceType: 'external',
      externalUrl: 'https://developer.mozilla.org/en-US/',
      published: true,
    });

    // 6. Protected Video Resource
    const hash = await bcrypt.hash('videopass123', 10);
    resProtected = await Resource.create({
      title: 'Exclusive Premium Video Lecture',
      description: 'Password protected video',
      subject: subject._id,
      resourceType: 'Video',
      sourceType: 'external',
      externalUrl: 'https://www.youtube.com/watch?v=secretvideo',
      published: true,
      passwordProtected: true,
      passwordHash: hash,
    });

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

    // TEST 1: PDF Resource API structure
    console.log('\n[TEST 1] Testing PDF Resource payload...');
    const r1 = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resPdf._id}`, method: 'GET' });
    const j1 = JSON.parse(r1.text).data.resource;
    if (j1.resourceType !== 'PDF' || !j1.fileUrl) throw new Error('PDF payload structure invalid');
    console.log('PASS: PDF resource returned resourceType PDF and valid fileUrl.');

    // TEST 2: Video Resource API structure
    console.log('\n[TEST 2] Testing Video Resource payload...');
    const r2 = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resVideo._id}`, method: 'GET' });
    const j2 = JSON.parse(r2.text).data.resource;
    if (j2.resourceType !== 'Video' || j2.externalUrl !== 'https://www.youtube.com/watch?v=sample123') {
      throw new Error('Video payload structure invalid');
    }
    console.log('PASS: Video resource returned resourceType Video and valid externalUrl.');

    // TEST 3: PYQ Resource API structure
    console.log('\n[TEST 3] Testing PYQ Resource payload...');
    const r3 = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resPyq._id}`, method: 'GET' });
    const j3 = JSON.parse(r3.text).data.resource;
    if (j3.resourceType !== 'PYQ' || !j3.fileUrl) throw new Error('PYQ payload structure invalid');
    console.log('PASS: PYQ resource returned resourceType PYQ and valid fileUrl.');

    // TEST 4: Google Drive Resource API structure
    console.log('\n[TEST 4] Testing Google Drive Resource payload...');
    const r4 = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resDrive._id}`, method: 'GET' });
    const j4 = JSON.parse(r4.text).data.resource;
    if (j4.resourceType !== 'Google Drive' || !j4.externalUrl.includes('drive.google.com')) {
      throw new Error('Google Drive payload structure invalid');
    }
    console.log('PASS: Google Drive resource returned resourceType Google Drive and valid externalUrl.');

    // TEST 5: Useful Link Resource API structure
    console.log('\n[TEST 5] Testing Useful Link Resource payload...');
    const r5 = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resLink._id}`, method: 'GET' });
    const j5 = JSON.parse(r5.text).data.resource;
    if (j5.resourceType !== 'Useful Link' || !j5.externalUrl.includes('developer.mozilla.org')) {
      throw new Error('Useful Link payload structure invalid');
    }
    console.log('PASS: Useful Link resource returned resourceType Useful Link and valid externalUrl.');

    // TEST 6: Protected External Resource Security
    console.log('\n[TEST 6] Testing Protected Video Resource security before unlock...');
    const r6 = await makeRequest({ hostname: 'localhost', port: testPort, path: `/api/v1/resources/${resProtected._id}`, method: 'GET' });
    const j6 = JSON.parse(r6.text).data.resource;
    if (j6.isUnlocked !== false || j6.externalUrl !== '') {
      throw new Error('Protected Video exposed externalUrl before password verification!');
    }
    console.log('PASS: Protected Video hides externalUrl prior to password unlock.');

    // TEST 7: Password Unlock for Protected Video
    console.log('\n[TEST 7] Unlocking Protected Video with correct password...');
    const postData = JSON.stringify({ password: 'videopass123' });
    const r7 = await makeRequest(
      {
        hostname: 'localhost',
        port: testPort,
        path: `/api/v1/resources/${resProtected._id}/verify-password`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      postData
    );
    const j7 = JSON.parse(r7.text);
    if (r7.statusCode !== 200 || !j7.data.isUnlocked || j7.data.externalUrl !== 'https://www.youtube.com/watch?v=secretvideo') {
      throw new Error('Failed to unlock protected external video URL!');
    }
    console.log('PASS: Protected video unlocked and externalUrl granted.');

    // TEST 8: Task 1 Regression Check (Download API)
    console.log('\n[TEST 8] Task 1 Regression Check (Download API for PYQ resource)...');
    const r8 = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resPyq._id}/download`,
      method: 'POST',
      headers: { Cookie: `userToken=${userToken}` },
    });
    if (r8.statusCode !== 200 || !r8.headers['content-disposition']?.includes('attachment; filename="2025 Semester Exam PYQ Paper.pdf"')) {
      throw new Error('Task 1 Download API failed for PYQ resource');
    }
    const dlCount = await Download.countDocuments({ user: testUser._id, resource: resPyq._id });
    if (dlCount !== 1) throw new Error('Download record creation failed during PYQ download');
    console.log('PASS: Task 1 Download workflow preserved for PYQ resources.');

    console.log('\n========================================');
    console.log('ALL FIVE-TYPE RESOURCE ACTION TESTS PASSED SUCCESSFULLY!');
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
