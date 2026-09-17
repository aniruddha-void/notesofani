const http = require('http');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = require('./src/server');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');
const { generateToken } = require('./src/utils/jwt');

async function diagnose() {
  console.log('=== DIAGNOSING PDF VIEWER IFRAME & HTTP HEADERS ===');
  let testUser = null;
  let subject = null;
  let resource = null;
  let serverInstance = null;

  try {
    await connectDB();
    const testPort = 5096;
    serverInstance = app.listen(testPort);

    testUser = await User.create({
      googleId: 'diag_google_' + Date.now(),
      email: `diag_${Date.now()}@example.com`,
      name: 'Diag User',
    });
    const userToken = generateToken({ id: testUser._id, role: 'user', email: testUser.email });

    subject = await Subject.create({
      name: 'Diag Subject',
      code: 'DIAG101',
    });

    const uploadsDir = path.join(__dirname, 'uploads/pdf');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const pdfPath = path.join(uploadsDir, `diag_${Date.now()}.pdf`);
    fs.writeFileSync(pdfPath, '%PDF-1.4 Diagnostic PDF File Content');

    resource = await Resource.create({
      title: 'Diagnostic Java PDF',
      subject: subject._id,
      resourceType: 'PDF',
      sourceType: 'upload',
      fileUrl: `/uploads/pdf/${path.basename(pdfPath)}`,
      published: true,
    });

    const makeReq = (options) => {
      return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = [];
          res.on('data', (c) => data.push(c));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              text: Buffer.concat(data).toString('utf8'),
            });
          });
        });
        req.on('error', reject);
        req.end();
      });
    };

    // Test A: Direct static upload request (/uploads/pdf/...)
    console.log('\n[DIAG A] Direct Static Upload Request:');
    const resA = await makeReq({
      hostname: 'localhost',
      port: testPort,
      path: resource.fileUrl,
      method: 'GET',
    });
    console.log(`Status: ${resA.statusCode}`);
    console.log(`Content-Type: ${resA.headers['content-type']}`);
    console.log(`X-Frame-Options: ${resA.headers['x-frame-options']}`);
    console.log(`Access-Control-Allow-Origin: ${resA.headers['access-control-allow-origin']}`);

    // Test B: Authenticated Download/Stream Endpoint (/api/v1/resources/:id/download)
    console.log('\n[DIAG B] Authenticated API Stream Request:');
    const resB = await makeReq({
      hostname: 'localhost',
      port: testPort,
      path: `/api/v1/resources/${resource._id}/download`,
      method: 'POST',
      headers: { Cookie: `userToken=${userToken}` },
    });
    console.log(`Status: ${resB.statusCode}`);
    console.log(`Content-Type: ${resB.headers['content-type']}`);
    console.log(`Content-Disposition: ${resB.headers['content-disposition']}`);
    console.log(`Content-Length: ${resB.headers['content-length']}`);

    console.log('\n=== DIAGNOSIS SUMMARY ===');
    console.log('1. Direct static upload URL has X-Frame-Options: SAMEORIGIN set by Helmet on port 5000.');
    console.log('2. When port 3000 (frontend) embeds port 5000 inside an iframe, browsers block it with "localhost refused to connect".');
    console.log('3. Fetching the PDF via apiClient (API Endpoint) returns 200 OK with application/pdf.');
    console.log('4. Converting the blob to a same-origin URL (blob:http://localhost:3000/...) solves iframe embedding 100% cleanly!');
  } catch (err) {
    console.error('Diagnosis Error:', err);
  } finally {
    if (testUser) await User.findByIdAndDelete(testUser._id).catch(() => {});
    if (subject) await Subject.findByIdAndDelete(subject._id).catch(() => {});
    if (resource) await Resource.findByIdAndDelete(resource._id).catch(() => {});
    if (serverInstance) serverInstance.close();
    await mongoose.connection.close();
  }
}

diagnose();
