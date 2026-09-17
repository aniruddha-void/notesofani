const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const http = require('http');
require('dotenv').config();

const app = require('./src/server');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');
const Download = require('./src/models/Download');
const { generateToken } = require('./src/utils/jwt');

async function runTest() {
  console.log('--- STARTING REAL PDF DOWNLOAD WORKFLOW TESTS ---');
  let testUser = null;
  let subject = null;
  let resourceA = null;
  let resourceB = null;
  let resourceProtected = null;
  let serverInstance = null;
  let userToken = null;
  const StorageFactory = require('./src/services/storage/storageFactory');
  const storageService = StorageFactory.getStorageService();

  try {
    await connectDB();

    // Start ephemeral test server on port 5099
    const testPort = 5099;
    serverInstance = app.listen(testPort);
    console.log(`Test server running on port ${testPort}`);

    // Create test user
    testUser = await User.create({
      googleId: 'test_download_google_' + Date.now(),
      email: `testdownload_${Date.now()}@example.com`,
      name: 'Test Download User',
    });
    userToken = generateToken({ id: testUser._id, role: 'user', email: testUser.email });

    // Create test subject
    subject = await Subject.create({
      name: 'Computer Science ' + Date.now(),
      code: 'CS' + Math.floor(Math.random() * 1000),
      description: 'Test Subject',
    });

    const uploadA = await storageService.uploadFile({
      originalname: `test_java_${Date.now()}.pdf`,
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock Java PDF Content'),
    }, 'pdf');

    const uploadB = await storageService.uploadFile({
      originalname: `test_ds_${Date.now()}.pdf`,
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock Data Structures PDF Content'),
    }, 'pdf');

    const fileUrlA = uploadA.url;
    const fileUrlB = uploadB.url;

    // Create Resource A (Java PDF)
    resourceA = await Resource.create({
      title: 'Java Programming Fundamentals',
      description: 'Complete Java course pdf',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlA,
      published: true,
      downloadsCount: 0,
    });

    // Create Resource B (Data Structures PDF)
    resourceB = await Resource.create({
      title: 'Data Structures and Algorithms',
      description: 'DSA material',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlB,
      published: true,
      downloadsCount: 0,
    });

    // Create Protected Resource
    resourceProtected = await Resource.create({
      title: 'Protected Exam Paper',
      description: 'Password locked pdf',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: fileUrlA,
      published: true,
      passwordProtected: true,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuu', // dummy hash
    });

    console.log(`Resource A ID: ${resourceA._id}`);
    console.log(`Resource B ID: ${resourceB._id}`);
    console.log(`Resource Protected ID: ${resourceProtected._id}`);

    // Helper to send HTTP requests to test server
    const makeRequest = (options, postData = null) => {
      return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
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

    // TEST 1: Download non-existent resource -> Expect 404 & 0 Download records
    console.log('\n[TEST 1] Downloading non-existent resource...');
    const fakeId = new mongoose.Types.ObjectId();
    const res1 = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${fakeId}/download`,
      method: 'POST',
      headers: { Cookie: `userToken=${userToken}` },
    });
    console.log(`Status: ${res1.statusCode}`);
    if (res1.statusCode !== 404) throw new Error('Expected 404 for non-existent resource');
    const downloads1 = await Download.countDocuments({ user: testUser._id });
    if (downloads1 !== 0) throw new Error('Download record was created on 404 failure!');
    console.log('PASS: 404 returned and 0 Download records created.');

    // TEST 2: Download protected resource without password -> Expect 403 & 0 Download records
    console.log('\n[TEST 2] Downloading protected resource without password verification...');
    const res2 = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resourceProtected._id}/download`,
      method: 'POST',
      headers: { Cookie: `userToken=${userToken}` },
    });
    console.log(`Status: ${res2.statusCode}`);
    if (res2.statusCode !== 403) throw new Error('Expected 403 for unauthorized protected download');
    const downloads2 = await Download.countDocuments({ user: testUser._id });
    if (downloads2 !== 0) throw new Error('Download record was created on 403 failure!');
    console.log('PASS: 403 returned and 0 Download records created.');

    // TEST 3: Real download of Resource A -> Expect 200, Content-Disposition header, PDF content, and 1 Download record
    console.log('\n[TEST 3] Downloading Resource A (Java)...');
    const res3 = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resourceA._id}/download`,
      method: 'POST',
      headers: { Cookie: `userToken=${userToken}` },
    });
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Content-Disposition: ${res3.headers['content-disposition']}`);
    if (res3.statusCode !== 200) throw new Error(`Expected 200 OK for Resource A download, got ${res3.statusCode}`);
    if (!res3.headers['content-disposition']?.includes('attachment; filename="Java Programming Fundamentals.pdf"')) {
      throw new Error(`Invalid Content-Disposition header: ${res3.headers['content-disposition']}`);
    }
    if (!res3.text.includes('%PDF-1.4 Mock Java PDF Content')) {
      throw new Error('Downloaded binary content does not match expected file');
    }

    const downloadsAfterA = await Download.find({ user: testUser._id });
    if (downloadsAfterA.length !== 1) throw new Error(`Expected 1 Download record, found ${downloadsAfterA.length}`);
    if (downloadsAfterA[0].resource.toString() !== resourceA._id.toString()) {
      throw new Error(`Download record resource ID mismatch: expected ${resourceA._id}, got ${downloadsAfterA[0].resource}`);
    }
    console.log('PASS: Real binary file served with attachment header & Download record created with exact Resource A ID.');

    // TEST 4: Real download of Resource B -> Expect 200, Content-Disposition header, PDF content, and 2 Download records
    console.log('\n[TEST 4] Downloading Resource B (Data Structures)...');
    const res4 = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resourceB._id}/download`,
      method: 'POST',
      headers: { Cookie: `userToken=${userToken}` },
    });
    console.log(`Status: ${res4.statusCode}`);
    console.log(`Content-Disposition: ${res4.headers['content-disposition']}`);
    if (res4.statusCode !== 200) throw new Error(`Expected 200 OK for Resource B download, got ${res4.statusCode}`);
    if (!res4.headers['content-disposition']?.includes('attachment; filename="Data Structures and Algorithms.pdf"')) {
      throw new Error(`Invalid Content-Disposition header: ${res4.headers['content-disposition']}`);
    }

    const downloadsAfterB = await Download.find({ user: testUser._id }).sort({ downloadedAt: 1 });
    if (downloadsAfterB.length !== 2) throw new Error(`Expected 2 Download records, found ${downloadsAfterB.length}`);
    if (downloadsAfterB[1].resource.toString() !== resourceB._id.toString()) {
      throw new Error(`Download record resource ID mismatch for B: expected ${resourceB._id}, got ${downloadsAfterB[1].resource}`);
    }
    if (downloadsAfterB[0].resource.toString() === downloadsAfterB[1].resource.toString()) {
      throw new Error('Resource A and Resource B downloads ended up pointing to identical resource IDs!');
    }
    console.log('PASS: Resource B served separately with distinct Resource B ID.');

    // TEST 5: Verify Download History API (/api/v1/user/downloads) returns populated records with exact Resource IDs
    console.log('\n[TEST 5] Verifying Download History API (/api/v1/user/downloads)...');
    const resHistory = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/user/downloads`,
      method: 'GET',
      headers: { Cookie: `userToken=${userToken}` },
    });
    const historyJson = JSON.parse(resHistory.text);
    console.log(`History records count: ${historyJson.data.history.length}`);
    if (historyJson.data.history.length !== 2) throw new Error('Download history API did not return 2 records');
    
    const histIds = historyJson.data.history.map((h) => h.resource._id);
    console.log(`History resource IDs: ${histIds.join(', ')}`);
    if (!histIds.includes(resourceA._id.toString()) || !histIds.includes(resourceB._id.toString())) {
      throw new Error('Download history does not contain both Resource A and Resource B IDs');
    }
    console.log('PASS: Download History API populates exact Resource IDs for Re-open navigation.');

    // TEST 6: Verify Student Dashboard API (/api/v1/user/dashboard) reports real downloads count
    console.log('\n[TEST 6] Verifying Student Dashboard API (/api/v1/user/dashboard)...');
    const resDash = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/user/dashboard`,
      method: 'GET',
      headers: { Cookie: `userToken=${userToken}` },
    });
    const dashJson = JSON.parse(resDash.text);
    console.log(`Dashboard downloads count: ${dashJson.data.stats.downloads}`);
    if (dashJson.data.stats.downloads !== 2) {
      throw new Error(`Expected stats.downloads === 2, got ${dashJson.data.stats.downloads}`);
    }
    console.log('PASS: Student Dashboard overview displays real Download collection count.');

    console.log('\n========================================');
    console.log('ALL REAL PDF DOWNLOAD WORKFLOW TESTS PASSED SUCCESSFULLY!');
    console.log('========================================');
  } catch (err) {
    console.error('\nTEST FAILED WITH ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (testUser) await Download.deleteMany({ user: testUser._id }).catch(() => {});
    if (resourceA?.fileUrl) await storageService.deleteFile(resourceA.fileUrl).catch(() => {});
    if (resourceB?.fileUrl) await storageService.deleteFile(resourceB.fileUrl).catch(() => {});
    if (testUser) await User.findByIdAndDelete(testUser._id).catch(() => {});
    if (subject) await Subject.findByIdAndDelete(subject._id).catch(() => {});
    if (resourceA) await Resource.findByIdAndDelete(resourceA._id).catch(() => {});
    if (resourceB) await Resource.findByIdAndDelete(resourceB._id).catch(() => {});
    if (resourceProtected) await Resource.findByIdAndDelete(resourceProtected._id).catch(() => {});

    if (serverInstance) serverInstance.close();
    await mongoose.connection.close();
  }
}

runTest();
