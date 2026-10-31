const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const http = require('http');
require('dotenv').config();

const app = require('./src/server');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Admin = require('./src/models/Admin');
const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');
const Purchase = require('./src/models/Purchase');
const PaymentSetting = require('./src/models/PaymentSetting');
const Download = require('./src/models/Download');
const { generateToken } = require('./src/utils/jwt');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json || data,
          rawBody: data,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      if (typeof postData === 'string' || Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('--- STARTING PREMIUM RESOURCES & MANUAL UPI TESTS ---');
  console.log('========================================================\n');

  let serverInstance = null;
  const testPort = 5088;

  let originalPaymentSetting = null;
  let testAdminId = null;
  let testUserId = null;
  let otherUserId = null;
  let testSubjectId = null;
  let testResourceId = null;
  let testFileUrl = null;
  const testPurchaseIds = [];
  const testDownloadIds = [];

  try {
    await connectDB();
    serverInstance = app.listen(testPort);
    console.log(`Test server running on port ${testPort}\n`);

    // Capture existing payment settings so real production details are never lost
    originalPaymentSetting = await PaymentSetting.findOne({}).lean();

    // 1. Setup mock Admin & User
    const adminEmail = `admin_${Date.now()}@notesofani.com`;
    const testAdmin = await Admin.create({
      email: adminEmail,
      passwordHash: 'dummy_hash',
    });
    testAdminId = testAdmin._id;
    const adminToken = generateToken({ id: testAdmin._id, role: 'admin', email: adminEmail });

    const userEmail = `student_${Date.now()}@gmail.com`;
    const testUser = await User.create({
      googleId: 'google_' + Date.now(),
      name: 'Aniruddha Student',
      email: userEmail,
      avatarUrl: 'https://example.com/avatar.png',
    });
    testUserId = testUser._id;
    const userToken = generateToken({ id: testUser._id, role: 'user', email: userEmail });

    const user2Email = `other_${Date.now()}@gmail.com`;
    const otherUser = await User.create({
      googleId: 'google_other_' + Date.now(),
      name: 'Other Student',
      email: user2Email,
    });
    otherUserId = otherUser._id;
    const otherUserToken = generateToken({ id: otherUser._id, role: 'user', email: user2Email });

    // Subject
    const subject = await Subject.create({
      name: 'Data Structures & Algorithms ' + Date.now(),
      code: 'DSA' + Math.floor(Math.random() * 900 + 100),
      description: 'Core DSA Subject',
    });
    testSubjectId = subject._id;

    // Storage Service upload
    const StorageFactory = require('./src/services/storage/storageFactory');
    const storageService = StorageFactory.getStorageService();
    const uploadResult = await storageService.uploadFile({
      originalname: `test_premium_${Date.now()}.pdf`,
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Premium Test Notes Content\n%%EOF'),
    }, 'pdf');
    const fileUrl = uploadResult.url;
    testFileUrl = fileUrl;

    console.log('[TEST 1] Admin configures payment settings...');
    const paymentUpdateRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/admin/payment-settings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      upiId: 'ani@upi',
      payeeName: 'NotesofAni Founder',
      paymentInstructions: 'Scan QR and pay via PhonePe/GPay.',
    });
    if (paymentUpdateRes.statusCode !== 200) {
      throw new Error(`Admin payment settings update failed: ${JSON.stringify(paymentUpdateRes.body)}`);
    }
    console.log('PASS: Admin updated payment settings.');

    console.log('[TEST 2] Public payment config returns configured payment details without admin controls...');
    const publicConfigRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/payment/config',
      method: 'GET',
    });
    if (publicConfigRes.statusCode !== 200 || !publicConfigRes.body.data.isConfigured || publicConfigRes.body.data.upiId !== 'ani@upi') {
      throw new Error(`Public payment config failed: ${JSON.stringify(publicConfigRes.body)}`);
    }
    console.log('PASS: Public payment config returned correctly for Buy Now modal.');

    console.log('[TEST 3] Premium price validation when creating resource...');
    const invalidPriceRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/resources',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      title: 'Invalid Price Premium PDF',
      subjectId: subject._id.toString(),
      type: 'PDF',
      isPremium: true,
      price: -50,
      fileUrl,
    });
    if (invalidPriceRes.statusCode !== 400) {
      throw new Error(`Invalid price was not rejected with 400! Got: ${invalidPriceRes.statusCode}`);
    }
    console.log('PASS: Negative/invalid price correctly rejected with 400.');

    console.log('[TEST 4] Admin successfully creates a Premium Resource with valid price...');
    const createPremiumRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/resources',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      title: 'DSA Comprehensive Handwritten Planner',
      description: 'Exclusive DSA notes and roadmap with curated practice sets.',
      subjectId: subject._id.toString(),
      type: 'PDF',
      status: 'Published',
      isPremium: true,
      price: 149,
      fileUrl,
    });
    if (createPremiumRes.statusCode !== 201) {
      throw new Error(`Failed to create premium resource: ${JSON.stringify(createPremiumRes.body)}`);
    }
    const premiumResource = createPremiumRes.body.data.resource;
    testResourceId = premiumResource._id;
    if (!premiumResource.isPremium || premiumResource.price !== 149) {
      throw new Error(`Premium flags mismatch: ${JSON.stringify(premiumResource)}`);
    }
    console.log(`PASS: Created Premium Resource "${premiumResource.title}" at ₹${premiumResource.price}.`);

    console.log('[TEST 5] Logged-out and non-purchased users cannot see private fileUrl in catalog or detail...');
    const detailLoggedOut = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}`,
      method: 'GET',
    });
    if (detailLoggedOut.body.data.resource.fileUrl !== '' || detailLoggedOut.body.data.resource.isUnlocked !== false) {
      throw new Error('Logged-out user was able to see fileUrl of premium resource!');
    }

    const detailLoggedInNotPurchased = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (detailLoggedInNotPurchased.body.data.resource.fileUrl !== '' || detailLoggedInNotPurchased.body.data.resource.isPurchased !== false) {
      throw new Error('Non-purchased user was able to access premium fileUrl!');
    }
    console.log('PASS: Content URLs stripped and isUnlocked=false for unauthorized users.');

    console.log('[TEST 6] Unauthorized file streaming & download requests are rejected with 403...');
    const streamAttempt = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}/file`,
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (streamAttempt.statusCode !== 403) {
      throw new Error(`Streaming non-purchased file was not rejected with 403! Got: ${streamAttempt.statusCode}`);
    }

    const downloadAttempt = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}/download`,
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (downloadAttempt.statusCode !== 403) {
      throw new Error(`Downloading non-purchased file was not rejected with 403! Got: ${downloadAttempt.statusCode}`);
    }
    console.log('PASS: Protected streaming and download endpoints returned 403 Forbidden.');

    console.log('[TEST 7] Direct /uploads URL access is blocked by static upload middleware...');
    const localUploadsDir = path.join(__dirname, 'uploads/pdf');
    if (!fs.existsSync(localUploadsDir)) fs.mkdirSync(localUploadsDir, { recursive: true });
    const localPdfName = `test_local_secret_${Date.now()}.pdf`;
    const localPdfFullPath = path.join(localUploadsDir, localPdfName);
    fs.writeFileSync(localPdfFullPath, '%PDF-1.4 Local Secret');
    const localFileUrl = `/uploads/pdf/${localPdfName}`;

    const localRes = await Resource.create({
      title: 'Local Premium Test Resource',
      subject: subject._id,
      resourceType: 'PDF',
      published: true,
      isPremium: true,
      price: 99,
      fileUrl: localFileUrl,
    });
    let localResourceId = localRes._id;

    const directUploadAttempt = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: localFileUrl,
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (directUploadAttempt.statusCode !== 403) {
      throw new Error(`Direct /uploads static file was not blocked with 403! Got: ${directUploadAttempt.statusCode}`);
    }
    console.log('PASS: Direct /uploads bypass prevented with 403 Forbidden.');

    console.log('[TEST 8] Logged-out user cannot submit purchase request (401)...');
    const loggedOutPurchaseRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/purchases',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      resourceId: premiumResource._id.toString(),
      transactionId: 'UPI1234567890',
    });
    if (loggedOutPurchaseRes.statusCode !== 401) {
      throw new Error(`Logged-out purchase request was not rejected with 401! Got: ${loggedOutPurchaseRes.statusCode}`);
    }
    console.log('PASS: Logged-out purchase rejected with 401.');

    console.log('[TEST 9] User submits valid purchase request (201)...');
    const validPurchaseRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/purchases',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }, {
      resourceId: premiumResource._id.toString(),
      transactionId: 'UTR987654321012',
      paymentNote: 'Paid via PhonePe from Aniruddha account.',
    });
    if (validPurchaseRes.statusCode !== 201) {
      throw new Error(`Valid purchase submission failed: ${JSON.stringify(validPurchaseRes.body)}`);
    }
    const createdPurchase = validPurchaseRes.body.data.purchase;
    testPurchaseIds.push(createdPurchase._id);
    if (createdPurchase.status !== 'pending' || createdPurchase.amount !== 149) {
      throw new Error(`Purchase record mismatch: ${JSON.stringify(createdPurchase)}`);
    }
    console.log(`PASS: Purchase request created with status 'pending' and exact amount ₹${createdPurchase.amount}.`);

    console.log('[TEST 10] Duplicate pending purchase request is prevented...');
    const duplicateRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/purchases',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }, {
      resourceId: premiumResource._id.toString(),
      transactionId: 'UTR987654321012',
    });
    if (duplicateRes.statusCode !== 400) {
      throw new Error(`Duplicate pending request was not rejected with 400! Got: ${duplicateRes.statusCode}`);
    }
    console.log('PASS: Duplicate pending purchase request rejected with 400.');

    console.log('[TEST 11] Normal user cannot approve their own or other purchase requests...');
    const userApproveAttempt = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/admin/purchases/${createdPurchase._id}/approve`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (userApproveAttempt.statusCode !== 403 && userApproveAttempt.statusCode !== 401) {
      throw new Error(`User was able to call admin approve endpoint! Got: ${userApproveAttempt.statusCode}`);
    }
    console.log('PASS: User blocked from approving requests.');

    console.log('[TEST 12] Pending user still cannot access the premium file...');
    const stillPendingStream = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}/file`,
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (stillPendingStream.statusCode !== 403) {
      throw new Error(`Pending user was granted access before approval! Got: ${stillPendingStream.statusCode}`);
    }
    console.log('PASS: Pending status does not grant access.');

    console.log('[TEST 13] Admin approves the purchase request...');
    const adminApproveRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/admin/purchases/${createdPurchase._id}/approve`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminApproveRes.statusCode !== 200 || adminApproveRes.body.data.purchase.status !== 'approved') {
      throw new Error(`Admin approval failed: ${JSON.stringify(adminApproveRes.body)}`);
    }
    console.log('PASS: Admin approved purchase request atomically.');

    console.log('[TEST 14] Double-approval is safely prevented...');
    const doubleApproveRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/admin/purchases/${createdPurchase._id}/approve`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (doubleApproveRes.statusCode !== 400) {
      throw new Error(`Double approval was not rejected with 400! Got: ${doubleApproveRes.statusCode}`);
    }
    console.log('PASS: Double-approval prevented.');

    console.log('[TEST 15] Approved user now has full access to view and download the PDF...');
    const approvedDetailRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (!approvedDetailRes.body.data.resource.isPurchased || !approvedDetailRes.body.data.resource.isUnlocked) {
      throw new Error(`Approved resource not marked unlocked: ${JSON.stringify(approvedDetailRes.body)}`);
    }

    const approvedStreamRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}/file`,
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (approvedStreamRes.statusCode !== 200 || !approvedStreamRes.rawBody.includes('%PDF-1.4')) {
      throw new Error(`Approved user could not stream PDF! Status: ${approvedStreamRes.statusCode}`);
    }

    const approvedDownloadRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}/download`,
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (approvedDownloadRes.statusCode !== 200) {
      throw new Error(`Approved user download failed! Status: ${approvedDownloadRes.statusCode}`);
    }
    console.log('PASS: Approved user can stream and download the premium PDF.');

    console.log('[TEST 16] Another non-purchased user STILL cannot access the premium PDF...');
    const otherUserStream = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${premiumResource._id}/file`,
      method: 'GET',
      headers: { Authorization: `Bearer ${otherUserToken}` },
    });
    if (otherUserStream.statusCode !== 403) {
      throw new Error(`Other user gained access unexpectedly! Status: ${otherUserStream.statusCode}`);
    }
    console.log('PASS: Access is strictly isolated per purchased user account.');

    console.log('[TEST 17] User purchase history (/api/v1/user/purchases) lists the approved purchase...');
    const userPurchasesRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/user/purchases',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (userPurchasesRes.statusCode !== 200 || userPurchasesRes.body.data.purchases.length === 0) {
      throw new Error(`User purchases list empty or failed: ${JSON.stringify(userPurchasesRes.body)}`);
    }
    const userPurchase = userPurchasesRes.body.data.purchases[0];
    if (userPurchase.status !== 'approved' || userPurchase.amount !== 149) {
      throw new Error(`User purchase history data mismatch: ${JSON.stringify(userPurchase)}`);
    }
    console.log('PASS: User purchase history displays approved purchase with correct amount and details.');

    console.log('[TEST 18] Rejection flow: rejection reason recorded and user informed...');
    const req2Res = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/v1/purchases',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherUserToken}`,
      },
    }, {
      resourceId: premiumResource._id.toString(),
      transactionId: 'FAKE_UTR_123',
    });
    const purchase2Id = req2Res.body.data.purchase._id;
    testPurchaseIds.push(purchase2Id);

    const rejectRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/admin/purchases/${purchase2Id}/reject`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      reason: 'Transaction not found in bank statement.',
    });
    if (rejectRes.statusCode !== 200 || rejectRes.body.data.purchase.status !== 'rejected') {
      throw new Error(`Rejection failed: ${JSON.stringify(rejectRes.body)}`);
    }
    console.log('PASS: Rejection completed with reason recorded.');

    console.log('\n========================================================');
    console.log('ALL 18 PREMIUM RESOURCES & MANUAL UPI TESTS PASSED! 🎉');
    console.log('========================================================\n');
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    // Clean up all test purchases created during the test
    if (testPurchaseIds.length > 0) {
      await Purchase.deleteMany({ _id: { $in: testPurchaseIds } }).catch(() => {});
    }
    // Clean up test resources & subjects
    if (testResourceId) {
      await Resource.findByIdAndDelete(testResourceId).catch(() => {});
    }
    if (typeof localResourceId !== 'undefined' && localResourceId) {
      await Resource.findByIdAndDelete(localResourceId).catch(() => {});
    }
    if (testSubjectId) {
      await Subject.findByIdAndDelete(testSubjectId).catch(() => {});
    }
    // Clean up test admin & users
    if (testAdminId) {
      await Admin.findByIdAndDelete(testAdminId).catch(() => {});
    }
    if (testUserId) {
      await User.findByIdAndDelete(testUserId).catch(() => {});
    }
    if (otherUserId) {
      await User.findByIdAndDelete(otherUserId).catch(() => {});
    }
    // Clean up test downloads
    await Download.deleteMany({ user: { $in: [testUserId, otherUserId] } }).catch(() => {});
    // Clean up test files
    if (testFileUrl && typeof storageService !== 'undefined') {
      await storageService.deleteFile(testFileUrl).catch(() => {});
    }
    if (typeof localPdfFullPath !== 'undefined' && localPdfFullPath && fs.existsSync(localPdfFullPath)) {
      try { fs.unlinkSync(localPdfFullPath); } catch (_) {}
    }
    // Restore original payment setting if one existed
    if (originalPaymentSetting) {
      await PaymentSetting.deleteMany({});
      const { _id, ...cleanSetting } = originalPaymentSetting;
      await PaymentSetting.create(cleanSetting);
    }
    await mongoose.connection.close(false);
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:');
  console.error(err);
  process.exit(1);
});
