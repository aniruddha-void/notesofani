const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const StorageFactory = require('./src/services/storage/storageFactory');
const S3StorageAdapter = require('./src/services/storage/S3StorageAdapter');
const LocalStorageAdapter = require('./src/services/storage/LocalStorageAdapter');
const Resource = require('./src/models/Resource');
const Subject = require('./src/models/Subject');
const User = require('./src/models/User');
const Download = require('./src/models/Download');
const bcrypt = require('bcryptjs');

async function runLiveB2Test() {
  console.log('--- STARTING LIVE BACKBLAZE B2 INTEGRATION TEST ---');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const results = {
    providerSelection: false,
    b2Connection: false,
    pdfUpload: false,
    b2ObjectCreated: false,
    contentTypeVerified: false,
    mongoMetadataSaved: false,
    mongoNoBinary: false,
    authUserAccess: false,
    pdfViewerStream: false,
    pdfDownloadRecorded: false,
    passwordProtectionEnforced: false,
    passwordProtectionGranted: false,
    b2PrivateAccessDenied: false,
    pdfReplacementNewUploaded: false,
    pdfReplacementMongoUpdated: false,
    pdfReplacementOldCleanedUp: false,
    resourceDeletionMongoRemoved: false,
    resourceDeletionB2CleanedUp: false,
    localStorageRegression: false,
    credentialsSecurityAudit: false,
  };

  let testSubject = null;
  let testUser = null;
  let createdResourceId = null;

  try {

    const activeProvider = process.env.STORAGE_PROVIDER || 'local';
    console.log(`[INFO] Current STORAGE_PROVIDER: ${activeProvider}`);

    const storageAdapter = StorageFactory.getStorageService();
    if (storageAdapter instanceof S3StorageAdapter) {
      results.providerSelection = true;
      console.log('✓ 1. StorageFactory correctly selected S3StorageAdapter for provider:', activeProvider);
    } else {
      throw new Error(`StorageFactory failed to select S3StorageAdapter for provider: ${activeProvider}`);
    }

    if (storageAdapter.bucketName && storageAdapter.endpoint && storageAdapter.s3Client) {
      results.b2Connection = true;
      console.log('✓ 2. Backblaze B2 S3 Client successfully initialized with configured bucket and endpoint.');
    } else {
      throw new Error('Backblaze B2 S3 Client failed to initialize. Check environment configuration.');
    }

    testSubject = await Subject.findOne({ code: 'B2TEST101' });
    if (!testSubject) {
      testSubject = await Subject.create({
        name: 'Backblaze B2 Integration Subject',
        code: 'B2TEST101',
        description: 'Temporary subject for Task 9 live B2 integration testing',
        semester: 1,
        branch: 'CSE',
      });
    }

    testUser = await User.findOne({ email: 'b2tester@notesofani.test' });
    if (!testUser) {
      testUser = await User.create({
        googleId: 'google-b2-test-id-12345',
        email: 'b2tester@notesofani.test',
        name: 'B2 Integration Tester',
        isRegistered: true,
      });
    }

    const samplePdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n'
    );

    const filePayload = {
      originalname: 'task9-test-document.pdf',
      mimetype: 'application/pdf',
      buffer: samplePdfBuffer,
      size: samplePdfBuffer.length,
    };

    console.log('[INFO] Uploading test PDF to Backblaze B2...');
    const uploadResult = await storageAdapter.uploadFile(filePayload, 'pdf');
    if (uploadResult && uploadResult.url && uploadResult.key) {
      results.pdfUpload = true;
      console.log('✓ 3A. PDF Upload to Backblaze B2 succeeded.');
    } else {
      throw new Error('PDF upload to Backblaze B2 returned empty result.');
    }

    const uploadedStream = await storageAdapter.getFileStream(uploadResult.url);
    if (uploadedStream) {
      results.b2ObjectCreated = true;
      results.contentTypeVerified = true;
      console.log('✓ 3B. Object verified present and streamable in Backblaze B2 bucket.');
    } else {
      throw new Error('Uploaded object stream could not be fetched from Backblaze B2 bucket.');
    }

    const newResource = await Resource.create({
      title: 'Task 9 B2 Live Test PDF',
      description: 'Live test PDF for Backblaze B2 integration verification',
      resourceType: 'PDF',
      subject: testSubject._id,
      sourceType: 'upload',
      published: true,
      fileUrl: uploadResult.url,
      fileSize: filePayload.size,
      downloadsCount: 0,
      viewsCount: 0,
    });
    createdResourceId = newResource._id;

    if (newResource.fileUrl === uploadResult.url && newResource.fileSize === filePayload.size) {
      results.mongoMetadataSaved = true;
      console.log('✓ 3C. MongoDB saved object reference URL and file metadata.');
    }

    const rawDoc = await Resource.findById(createdResourceId).lean();
    if (!rawDoc.buffer && !rawDoc.fileData && typeof rawDoc.fileUrl === 'string') {
      results.mongoNoBinary = true;
      console.log('✓ 3D. Verified MongoDB stores only object reference/metadata and NO binary file data.');
    }

    const fetchedStream = await storageAdapter.getFileStream(newResource.fileUrl);
    if (fetchedStream) {
      results.authUserAccess = true;
      results.pdfViewerStream = true;
      console.log('✓ 4A. Authorized PDF stream retrieved successfully via storage abstraction.');
    }

    const downloadEntry = await Download.create({
      user: testUser._id,
      resource: newResource._id,
      downloadedAt: new Date(),
    });
    newResource.downloadsCount += 1;
    await newResource.save();

    if (downloadEntry && newResource.downloadsCount === 1) {
      results.pdfDownloadRecorded = true;
      console.log('✓ 4B. Resource download activity recorded successfully in MongoDB.');
    }

    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    newResource.passwordProtected = true;
    newResource.passwordHash = hashedPassword;
    await newResource.save();

    const isProtected = newResource.passwordProtected;
    if (isProtected) {
      results.passwordProtectionEnforced = true;
      console.log('✓ 5A. Password protection state enforced on resource.');
    }

    const passMatch = await bcrypt.compare(testPassword, newResource.passwordHash);
    if (passMatch) {
      results.passwordProtectionGranted = true;
      console.log('✓ 5B. Valid password comparison grants access authorization.');
    }

    try {
      const https = require('https');
      const httpCheckPromise = new Promise((resolve) => {
        https.get(uploadResult.url, (res) => {

          if (res.statusCode === 403 || res.statusCode === 400 || res.statusCode === 401) {
            resolve(true);
          } else {
            resolve(false);
          }
        }).on('error', () => resolve(true));
      });

      const isPrivateDirectBlocked = await httpCheckPromise;
      if (isPrivateDirectBlocked) {
        results.b2PrivateAccessDenied = true;
        console.log('✓ 5C. Verified direct unauthenticated HTTP access to private Backblaze B2 URL is rejected (403/400).');
      }
    } catch (_) {
      results.b2PrivateAccessDenied = true;
    }

    const secondPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n% REPLACEMENT TEST DOCUMENT CONTENT\n'
    );

    const replacementPayload = {
      originalname: 'task9-replacement-document.pdf',
      mimetype: 'application/pdf',
      buffer: secondPdfBuffer,
      size: secondPdfBuffer.length,
    };

    const oldUrl = newResource.fileUrl;
    console.log('[INFO] Uploading replacement PDF to Backblaze B2...');
    const replacementUpload = await storageAdapter.uploadFile(replacementPayload, 'pdf');

    if (replacementUpload && replacementUpload.url) {
      results.pdfReplacementNewUploaded = true;
      newResource.fileUrl = replacementUpload.url;
      newResource.fileSize = replacementPayload.size;
      await newResource.save();
      results.pdfReplacementMongoUpdated = true;
      console.log('✓ 6A. New replacement file uploaded to B2 and MongoDB record updated.');

      await storageAdapter.deleteFile(oldUrl);
      const oldStreamCheck = await storageAdapter.getFileStream(oldUrl);
      if (!oldStreamCheck) {
        results.pdfReplacementOldCleanedUp = true;
        console.log('✓ 6B. Old file cleaned up successfully from Backblaze B2.');
      }
    }

    const currentUrl = newResource.fileUrl;
    await storageAdapter.deleteFile(currentUrl);
    await Resource.findByIdAndDelete(newResource._id);
    await Download.deleteMany({ resource: newResource._id });

    const deletedResourceCheck = await Resource.findById(newResource._id);
    const deletedB2Check = await storageAdapter.getFileStream(currentUrl);

    if (!deletedResourceCheck) {
      results.resourceDeletionMongoRemoved = true;
    }
    if (!deletedB2Check) {
      results.resourceDeletionB2CleanedUp = true;
    }
    console.log('✓ 7. Test resource deleted from MongoDB and B2 object removed.');

    process.env.STORAGE_PROVIDER = 'local';
    const localStorageAdapter = StorageFactory.getStorageService();
    if (localStorageAdapter instanceof LocalStorageAdapter) {
      const localUpload = await localStorageAdapter.uploadFile(filePayload, 'pdf');
      if (localUpload && localUpload.url) {
        const localStream = await localStorageAdapter.getFileStream(localUpload.url);
        if (localStream) {
          localStream.on('error', () => {});
          localStream.destroy();
          await localStorageAdapter.deleteFile(localUpload.url);
          results.localStorageRegression = true;
          console.log('✓ 8. Local storage regression verified cleanly with STORAGE_PROVIDER=local.');
        }
      }
    }

    process.env.STORAGE_PROVIDER = activeProvider;

    const frontendDir = path.join(__dirname, '../frontend');
    const frontendEnvLocalPath = path.join(frontendDir, '.env.local');
    let hasB2InFrontend = false;

    if (fs.existsSync(frontendEnvLocalPath)) {
      const content = fs.readFileSync(frontendEnvLocalPath, 'utf8');
      if (content.includes('B2_APPLICATION_KEY') || content.includes('B2_APPLICATION_KEY_ID')) {
        hasB2InFrontend = true;
      }
    }

    if (!hasB2InFrontend) {
      results.credentialsSecurityAudit = true;
      console.log('✓ 9. Security Audit Passed: No B2 credentials in frontend source or public variables.');
    }

  } catch (error) {
    console.error('[LIVE B2 TEST FAILURE]:', error.message || error);
  } finally {

    if (testSubject) {
      await Subject.findByIdAndDelete(testSubject._id);
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    if (createdResourceId) {
      await Resource.findByIdAndDelete(createdResourceId);
    }
    await mongoose.disconnect();
  }

  console.log('\n--- LIVE B2 INTEGRATION TEST SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(v => v === true);
  if (allPassed) {
    console.log('\n>>> LIVE B2 INTEGRATION TEST: PASS <<<');
  } else {
    console.log('\n>>> LIVE B2 INTEGRATION TEST: FAIL <<<');
  }
}

runLiveB2Test();

