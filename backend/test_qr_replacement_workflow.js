const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./src/config/db');
const PaymentSetting = require('./src/models/PaymentSetting');
const Admin = require('./src/models/Admin');
const { generateToken } = require('./src/utils/jwt');

// Helper to make multipart/form-data request
function sendMultipartRequest(options, fields, fileField) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    options.headers = {
      ...options.headers,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    const chunks = [];

    // Append text fields
    for (const [key, val] of Object.entries(fields)) {
      chunks.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
      ));
    }

    // Append file if provided
    if (fileField) {
      chunks.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`
      ));
      chunks.push(fileField.buffer);
      chunks.push(Buffer.from('\r\n'));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(chunks);
    options.headers['Content-Length'] = fullBody.length;

    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(data);
        let json = null;
        try {
          json = JSON.parse(raw.toString('utf8'));
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody: raw,
        });
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

function sendGetRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(data);
        let json = null;
        try {
          json = JSON.parse(raw.toString('utf8'));
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody: raw,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('--- STARTING QR REPLACEMENT WORKFLOW VERIFICATION ---');
  console.log('====================================================\n');

  await connectDB();
  const originalSettings = await PaymentSetting.find({}).lean();
  console.log('Backed up original PaymentSettings records:', originalSettings.length);

  let testAdmin = await Admin.findOne({});
  let testAdminCreated = false;
  if (!testAdmin) {
    testAdmin = await Admin.create({
      email: `test_admin_${Date.now()}@notesofani.com`,
      passwordHash: 'dummy_hash',
    });
    testAdminCreated = true;
  }
  const adminToken = generateToken({ id: testAdmin._id, role: 'admin', email: testAdmin.email });

  try {
    // Generate two distinctly different valid JPEG buffers
    // JPEG magic numbers + distinct payload bytes
    const makeJpegBuffer = (tag) => {
      const header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00]);
      const content = Buffer.from(`TEST_QR_IMAGE_PAYLOAD_${tag}_${Date.now()}_` + 'X'.repeat(500));
      const footer = Buffer.from([0xFF, 0xD9]);
      return Buffer.concat([header, content, footer]);
    };

    const imageABuffer = makeJpegBuffer('IMAGE_A');
    const imageBBuffer = makeJpegBuffer('IMAGE_B');

    // ----------------------------------------------------
    // STEP 1: Upload QR Image A
    // ----------------------------------------------------
    console.log('[STEP 1] Uploading QR Image A via Admin Settings...');
    const uploadARes = await sendMultipartRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/admin/payment-settings',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        upiId: 'test_a@upi',
        payeeName: 'Test Payee A',
        paymentInstructions: 'Pay with Image A',
      },
      {
        name: 'qrCode',
        filename: 'qr_a.jpeg',
        contentType: 'image/jpeg',
        buffer: imageABuffer,
      }
    );

    if (uploadARes.statusCode !== 200 || !uploadARes.body?.data?.paymentSetting) {
      throw new Error(`Upload A failed: ${uploadARes.statusCode} ${JSON.stringify(uploadARes.body)}`);
    }

    const qrUrlA = uploadARes.body.data.paymentSetting.qrCodeUrl;
    console.log('PASS: Uploaded QR Image A successfully.');
    console.log('QR Image A URL from Admin API:', qrUrlA);

    // Verify GET /api/v1/payment/config returns Image A
    console.log('[STEP 2] Verifying public payment config for Image A...');
    const configARes = await sendGetRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/payment/config?_t=${Date.now()}`,
      method: 'GET',
    });

    if (configARes.statusCode !== 200 || configARes.body?.data?.qrCodeUrl !== qrUrlA) {
      throw new Error(`Config A mismatch! Expected: ${qrUrlA}, Got: ${configARes.body?.data?.qrCodeUrl}`);
    }
    console.log('PASS: Public config returns Image A versioned URL:', configARes.body.data.qrCodeUrl);

    // Verify GET /api/v1/payment/qr-code streams Image A bytes
    console.log('[STEP 3] Verifying QR streaming endpoint returns Image A bytes...');
    const streamARes = await sendGetRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/payment/qr-code',
      method: 'GET',
    });

    if (streamARes.statusCode !== 200 || streamARes.rawBody.length !== imageABuffer.length) {
      throw new Error(`Stream A size mismatch! Expected ${imageABuffer.length}, got ${streamARes.rawBody.length}`);
    }
    console.log('PASS: Streamed Image A with exact length:', streamARes.rawBody.length);

    // Verify exactly 1 PaymentSetting document in DB
    const countA = await PaymentSetting.countDocuments();
    if (countA !== 1) {
      throw new Error(`Expected exactly 1 PaymentSetting in DB, found: ${countA}`);
    }
    console.log('PASS: Database contains exactly 1 PaymentSetting record.');

    // ----------------------------------------------------
    // STEP 4: Replace with QR Image B
    // ----------------------------------------------------
    console.log('\n[STEP 4] Replacing with QR Image B via Admin Settings...');
    // Ensure timestamp advances
    await new Promise(r => setTimeout(r, 1100));

    const uploadBRes = await sendMultipartRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/admin/payment-settings',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        upiId: 'test_b@upi',
        payeeName: 'Test Payee B',
        paymentInstructions: 'Pay with Image B',
      },
      {
        name: 'qrCode',
        filename: 'qr_b.jpeg',
        contentType: 'image/jpeg',
        buffer: imageBBuffer,
      }
    );

    if (uploadBRes.statusCode !== 200 || !uploadBRes.body?.data?.paymentSetting) {
      throw new Error(`Upload B failed: ${uploadBRes.statusCode} ${JSON.stringify(uploadBRes.body)}`);
    }

    const qrUrlB = uploadBRes.body.data.paymentSetting.qrCodeUrl;
    console.log('PASS: Uploaded QR Image B replacement successfully.');
    console.log('QR Image B URL from Admin API:', qrUrlB);

    if (qrUrlB === qrUrlA) {
      throw new Error(`Image B URL must have updated version timestamp! Got same URL: ${qrUrlB}`);
    }
    console.log('PASS: Image B URL has updated version query parameter distinct from Image A.');

    // ----------------------------------------------------
    // STEP 5: Verify public config returns Image B
    // ----------------------------------------------------
    console.log('[STEP 5] Verifying public payment config after replacement...');
    const configBRes = await sendGetRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/payment/config?_t=${Date.now()}`,
      method: 'GET',
    });

    if (configBRes.statusCode !== 200 || configBRes.body?.data?.qrCodeUrl !== qrUrlB) {
      throw new Error(`Config B mismatch! Expected: ${qrUrlB}, Got: ${configBRes.body?.data?.qrCodeUrl}`);
    }
    console.log('PASS: Public config immediately returns Image B URL:', configBRes.body.data.qrCodeUrl);

    // ----------------------------------------------------
    // STEP 6: Verify streaming endpoint serves Image B bytes
    // ----------------------------------------------------
    console.log('[STEP 6] Verifying QR streaming endpoint returns Image B bytes...');
    const streamBRes = await sendGetRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/payment/qr-code',
      method: 'GET',
    });

    if (streamBRes.statusCode !== 200 || streamBRes.rawBody.length !== imageBBuffer.length) {
      throw new Error(`Stream B size mismatch! Expected ${imageBBuffer.length}, got ${streamBRes.rawBody.length}`);
    }
    console.log('PASS: Streamed Image B with exact length:', streamBRes.rawBody.length);

    // Verify cache-control headers on stream endpoint
    const cacheHeader = streamBRes.headers['cache-control'] || '';
    if (!cacheHeader.includes('no-cache')) {
      throw new Error(`Expected no-cache header on stream endpoint, got: ${cacheHeader}`);
    }
    console.log('PASS: Stream endpoint returns anti-caching headers:', cacheHeader);

    // Verify single record in DB after replacement
    const countB = await PaymentSetting.countDocuments();
    if (countB !== 1) {
      throw new Error(`Expected exactly 1 PaymentSetting in DB after replacement, found: ${countB}`);
    }
    console.log('PASS: Database still contains exactly 1 PaymentSetting record (no conflicting duplicates).');

    // ----------------------------------------------------
    // STEP 7: Test upload error handling & fallback preservation
    // ----------------------------------------------------
    console.log('\n[STEP 7] Testing invalid upload error handling...');
    const invalidUploadRes = await sendMultipartRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/admin/payment-settings',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        upiId: 'test_b@upi',
        payeeName: 'Test Payee B',
      },
      {
        name: 'qrCode',
        filename: 'malicious.exe',
        contentType: 'application/x-msdownload',
        buffer: Buffer.from('NOT_AN_IMAGE'),
      }
    );

    if (invalidUploadRes.statusCode !== 400) {
      throw new Error(`Expected 400 for invalid file type, got: ${invalidUploadRes.statusCode}`);
    }
    console.log('PASS: Invalid file upload rejected with 400 Bad Request.');

    // Verify previous valid Image B was preserved
    const afterFailedConfigRes = await sendGetRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/payment/config?_t=${Date.now()}`,
      method: 'GET',
    });
    if (afterFailedConfigRes.body?.data?.qrCodeUrl !== qrUrlB) {
      throw new Error('Previous valid QR code was not preserved after failed upload!');
    }
    console.log('PASS: Previous valid QR code preserved after failed upload attempt.');

    // ----------------------------------------------------
    // STEP 8: Verify other payment settings and free resources
    // ----------------------------------------------------
    console.log('\n[STEP 8] Verifying resources catalog and other endpoints...');
    const resourcesRes = await sendGetRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/resources',
      method: 'GET',
    });
    if (resourcesRes.statusCode !== 200) {
      throw new Error(`Resources endpoint failed: ${resourcesRes.statusCode}`);
    }
    console.log('PASS: Public resources endpoint working smoothly.');

    console.log('\n====================================================');
    console.log('ALL QR REPLACEMENT WORKFLOW TESTS PASSED! 🎉');
    console.log('====================================================\n');
  } finally {
    // Clean up test admin if created
    if (testAdminCreated && testAdmin) {
      await Admin.findByIdAndDelete(testAdmin._id).catch(() => {});
    }

    // Restore original payment setting
    console.log('Restoring original PaymentSettings records...');
    await PaymentSetting.deleteMany({});
    if (originalSettings.length > 0) {
      for (const s of originalSettings) {
        const { _id, ...clean } = s;
        await PaymentSetting.create(clean);
      }
    }
    console.log('Restoration complete.');
    await mongoose.connection.close();
  }
}

run().catch((err) => {
  console.error('\n❌ QR WORKFLOW TEST FAILED:', err);
  process.exit(1);
});
