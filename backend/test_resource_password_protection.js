const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./src/config/db');
const Resource = require('./src/models/Resource');
const Subject = require('./src/models/Subject');
const User = require('./src/models/User');
const {
  createResource,
  updateResource,
  getResourceById,
  verifyResourcePassword,
  recordDownload,
  getResources,
  getAllResourcesAdmin,
} = require('./src/controllers/resourceController');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    cookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, options) {
      this.cookies[name] = val;
      return this;
    },
  };
  return res;
}

async function runPasswordProtectionTests() {
  console.log('=== STARTING PER-RESOURCE PASSWORD PROTECTION TESTS ===');
  await connectDB();

  const testTitlePrefix = 'TEST_PWD_PROT_RESOURCE_';
  let testSubject = null;
  let testUser = null;

  try {
    // Ensure test subject exists
    testSubject = await Subject.findOne({ name: 'Java Programming' });
    if (!testSubject) {
      testSubject = await Subject.create({
        name: 'Java Programming',
        code: 'CS201',
        description: 'Java Programming Course',
      });
    }

    // Ensure test user exists
    testUser = await User.findOne({ email: 'testuser_pwd@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test Password User',
        email: 'testuser_pwd@example.com',
        googleId: 'test_google_id_pwd_123',
      });
    }

    // 1. Create Unprotected Resource
    let unprotectedId = null;
    {
      const req = {
        admin: { _id: new mongoose.Types.ObjectId() },
        body: {
          title: `${testTitlePrefix}UNPROTECTED`,
          description: 'Unprotected resource test',
          type: 'Google Drive',
          subjectId: testSubject._id.toString(),
          status: 'Published',
          externalUrl: 'https://drive.google.com/test-unprotected',
          passwordProtected: false,
        },
      };
      const res = createMockRes();
      await createResource(req, res);

      if (res.statusCode !== 201 || res.body?.status !== 'success') {
        throw new Error(`[Test Fail 1] Expected 201 for unprotected resource creation, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }

      unprotectedId = res.body?.data?.resource?._id;
      const dbDoc = await Resource.findById(unprotectedId).select('+passwordHash');
      if (dbDoc.passwordProtected !== false || dbDoc.passwordHash !== null) {
        throw new Error(`[Test Fail 1] Expected passwordProtected=false and passwordHash=null, got ${JSON.stringify(dbDoc)}`);
      }
      console.log('✓ Test 1 Passed: Unprotected resource created correctly without password hash');
    }

    // 2. Create Protected Resource without password (should fail 400)
    {
      const req = {
        admin: { _id: new mongoose.Types.ObjectId() },
        body: {
          title: `${testTitlePrefix}PROTECTED_FAIL`,
          type: 'Useful Link',
          subjectId: testSubject._id.toString(),
          externalUrl: 'https://example.com/test',
          passwordProtected: true,
          password: '',
        },
      };
      const res = createMockRes();
      await createResource(req, res);

      if (res.statusCode !== 400) {
        throw new Error(`[Test Fail 2] Expected 400 when creating protected resource without password, got ${res.statusCode}`);
      }
      console.log('✓ Test 2 Passed: Creating protected resource without password returns 400 validation error');
    }

    // 3. Create Protected Resource with password "NotesofAni@2026"
    let protectedId = null;
    const initialPassword = 'NotesofAni@2026';
    {
      const req = {
        admin: { _id: new mongoose.Types.ObjectId() },
        body: {
          title: `${testTitlePrefix}PROTECTED_SUCCESS`,
          type: 'Useful Link',
          subjectId: testSubject._id.toString(),
          status: 'Published',
          externalUrl: 'https://example.com/protected-secret-link',
          passwordProtected: true,
          password: initialPassword,
        },
      };
      const res = createMockRes();
      await createResource(req, res);

      if (res.statusCode !== 201 || res.body?.status !== 'success') {
        throw new Error(`[Test Fail 3] Expected 201 for protected resource creation, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }

      protectedId = res.body?.data?.resource?._id;
      const dbDoc = await Resource.findById(protectedId).select('+passwordHash');
      if (!dbDoc.passwordProtected || !dbDoc.passwordHash) {
        throw new Error('[Test Fail 3] passwordProtected or passwordHash missing in MongoDB');
      }

      // Verify bcrypt hash works
      const isMatch = await bcrypt.compare(initialPassword, dbDoc.passwordHash);
      if (!isMatch) {
        throw new Error('[Test Fail 3] Password hash in MongoDB does not match initial password');
      }

      // Verify passwordHash is NOT in returned JSON
      if (res.body?.data?.resource?.passwordHash) {
        throw new Error('[Test Fail 3] CRITICAL SECURITY ISSUE: passwordHash was leaked in response body!');
      }

      console.log('✓ Test 3 Passed: Protected resource created with bcrypt hash (passwordHash hidden from API response)');
    }

    // 4. GET /api/v1/resources/:id on Protected Resource WITHOUT access cookie (should hide externalUrl)
    {
      const req = {
        params: { id: protectedId },
        cookies: {},
        headers: {},
      };
      const res = createMockRes();
      await getResourceById(req, res);

      if (res.statusCode !== 200 || res.body?.data?.resource?.isUnlocked !== false) {
        throw new Error(`[Test Fail 4] Expected isUnlocked=false for locked resource, got ${JSON.stringify(res.body)}`);
      }

      if (res.body?.data?.resource?.externalUrl !== '') {
        throw new Error('[Test Fail 4] SECURITY FAIL: externalUrl was exposed for locked resource!');
      }

      console.log('✓ Test 4 Passed: Locked resource details hide sensitive URLs and return isUnlocked=false');
    }

    // 5. Verify Password with INCORRECT password
    {
      const req = {
        params: { id: protectedId },
        user: testUser,
        body: { password: 'WrongPassword123' },
      };
      const res = createMockRes();
      await verifyResourcePassword(req, res);

      if (res.statusCode !== 401 || res.body?.status !== 'error') {
        throw new Error(`[Test Fail 5] Expected 401 for incorrect password, got ${res.statusCode}`);
      }
      console.log('✓ Test 5 Passed: Incorrect password returns 401 access denied');
    }

    // 6. Verify Password with CORRECT password ("NotesofAni@2026")
    let accessCookieValue = null;
    {
      const req = {
        params: { id: protectedId },
        user: testUser,
        body: { password: initialPassword },
      };
      const res = createMockRes();
      await verifyResourcePassword(req, res);

      if (res.statusCode !== 200 || res.body?.data?.isUnlocked !== true) {
        throw new Error(`[Test Fail 6] Expected 200 and isUnlocked=true, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }

      if (!res.body?.data?.externalUrl) {
        throw new Error('[Test Fail 6] Expected externalUrl to be returned after successful password verification');
      }

      accessCookieValue = res.cookies[`res_access_${protectedId}`];
      if (!accessCookieValue) {
        throw new Error('[Test Fail 6] Expected access cookie to be set on response');
      }

      console.log('✓ Test 6 Passed: Correct password grants temporary access and sets HTTP-only access cookie');
    }

    // 7. GET /api/v1/resources/:id WITH access cookie & user login (should expose externalUrl)
    {
      const req = {
        params: { id: protectedId },
        user: testUser,
        cookies: { [`res_access_${protectedId}`]: accessCookieValue },
        headers: {},
      };
      const res = createMockRes();
      await getResourceById(req, res);

      if (res.statusCode !== 200 || res.body?.data?.resource?.isUnlocked !== true) {
        throw new Error(`[Test Fail 7] Expected isUnlocked=true with access cookie, got ${JSON.stringify(res.body)}`);
      }

      if (res.body?.data?.resource?.externalUrl !== 'https://example.com/protected-secret-link') {
        throw new Error(`[Test Fail 7] Expected externalUrl to be available, got "${res.body?.data?.resource?.externalUrl}"`);
      }

      console.log('✓ Test 7 Passed: Resource detail with valid access cookie returns unlocked content');
    }

    // 8. Download Endpoint on Protected Resource WITHOUT access cookie (should return 403)
    {
      const req = {
        params: { id: protectedId },
        user: testUser,
        cookies: {},
        headers: {},
      };
      const res = createMockRes();
      await recordDownload(req, res);

      if (res.statusCode !== 403) {
        throw new Error(`[Test Fail 8] Expected 403 for download without access cookie, got ${res.statusCode}`);
      }

      console.log('✓ Test 8 Passed: Downloading protected resource without password authorization returns 403 Forbidden');
    }

    // 9. Download Endpoint on Protected Resource WITH access cookie (should succeed 200)
    {
      const req = {
        params: { id: protectedId },
        user: testUser,
        cookies: { [`res_access_${protectedId}`]: accessCookieValue },
        headers: {},
      };
      const res = createMockRes();
      await recordDownload(req, res);

      if (res.statusCode !== 200 || res.body?.status !== 'success') {
        throw new Error(`[Test Fail 9] Expected 200 for download with access cookie, got ${res.statusCode}`);
      }

      console.log('✓ Test 9 Passed: Downloading protected resource with valid access cookie succeeds');
    }

    // 10. Metadata-only Edit (keeps protection & existing password)
    {
      const req = {
        params: { id: protectedId },
        admin: { _id: new mongoose.Types.ObjectId() },
        body: {
          title: `${testTitlePrefix}PROTECTED_EDITED_TITLE`,
          passwordProtected: true,
          password: '', // Blank password
        },
      };
      const res = createMockRes();
      await updateResource(req, res);

      if (res.statusCode !== 200 || res.body?.status !== 'success') {
        throw new Error(`[Test Fail 10] Metadata update failed with code ${res.statusCode}`);
      }

      const dbDoc = await Resource.findById(protectedId).select('+passwordHash');
      if (!dbDoc.passwordProtected || !dbDoc.passwordHash) {
        throw new Error('[Test Fail 10] Protection or passwordHash was lost during metadata update!');
      }

      const isStillMatch = await bcrypt.compare(initialPassword, dbDoc.passwordHash);
      if (!isStillMatch) {
        throw new Error('[Test Fail 10] Password hash changed during metadata-only update!');
      }

      console.log('✓ Test 10 Passed: Metadata-only edit preserves password protection & existing passwordHash');
    }

    // 11. Change Password to "NewSecret@2026"
    const newPassword = 'NewSecret@2026';
    {
      const req = {
        params: { id: protectedId },
        admin: { _id: new mongoose.Types.ObjectId() },
        body: {
          passwordProtected: true,
          password: newPassword,
        },
      };
      const res = createMockRes();
      await updateResource(req, res);

      if (res.statusCode !== 200) {
        throw new Error(`[Test Fail 11] Password update failed with code ${res.statusCode}`);
      }

      // Old password should fail
      const oldReq = { params: { id: protectedId }, user: testUser, body: { password: initialPassword } };
      const oldRes = createMockRes();
      await verifyResourcePassword(oldReq, oldRes);
      if (oldRes.statusCode !== 401) {
        throw new Error('[Test Fail 11] Old password still worked after password update!');
      }

      // New password should succeed
      const newReq = { params: { id: protectedId }, user: testUser, body: { password: newPassword } };
      const newRes = createMockRes();
      await verifyResourcePassword(newReq, newRes);
      if (newRes.statusCode !== 200) {
        throw new Error('[Test Fail 11] New password failed after password update!');
      }

      console.log('✓ Test 11 Passed: Password update invalidates old password and enforces new password');
    }

    // 12. Disable Protection
    {
      const req = {
        params: { id: protectedId },
        admin: { _id: new mongoose.Types.ObjectId() },
        body: {
          passwordProtected: false,
        },
      };
      const res = createMockRes();
      await updateResource(req, res);

      if (res.statusCode !== 200) {
        throw new Error(`[Test Fail 12] Disable protection failed with code ${res.statusCode}`);
      }

      const dbDoc = await Resource.findById(protectedId).select('+passwordHash');
      if (dbDoc.passwordProtected !== false || dbDoc.passwordHash !== null) {
        throw new Error(`[Test Fail 12] Expected passwordProtected=false and passwordHash=null, got ${JSON.stringify(dbDoc)}`);
      }

      console.log('✓ Test 12 Passed: Disabling protection sets passwordProtected=false and clears passwordHash');
    }

    // 13. Enable Protection on previously unprotected resource
    {
      const req = {
        params: { id: protectedId },
        admin: { _id: new mongoose.Types.ObjectId() },
        body: {
          passwordProtected: true,
          password: 'ReEnabledPassword@2026',
        },
      };
      const res = createMockRes();
      await updateResource(req, res);

      if (res.statusCode !== 200) {
        throw new Error(`[Test Fail 13] Re-enabling protection failed with code ${res.statusCode}`);
      }

      const verifyReq = { params: { id: protectedId }, user: testUser, body: { password: 'ReEnabledPassword@2026' } };
      const verifyRes = createMockRes();
      await verifyResourcePassword(verifyReq, verifyRes);
      if (verifyRes.statusCode !== 200) {
        throw new Error('[Test Fail 13] Verification failed on re-enabled protected resource');
      }

      console.log('✓ Test 13 Passed: Enabling protection on previously unprotected resource succeeds');
    }

    // 14. Admin List API excludes passwordHash
    {
      const req = { admin: { _id: new mongoose.Types.ObjectId() }, query: {} };
      const res = createMockRes();
      await getAllResourcesAdmin(req, res);

      const items = res.body?.data?.resources || [];
      const testItem = items.find((r) => r._id.toString() === protectedId.toString());
      if (testItem && testItem.passwordHash) {
        throw new Error('[Test Fail 14] CRITICAL SECURITY FAIL: Admin list API exposed passwordHash!');
      }

      console.log('✓ Test 14 Passed: Admin API list returns passwordProtected boolean but never exposes passwordHash');
    }

    // Clean up test resources
    await Resource.deleteMany({ title: { $regex: new RegExp(`^${testTitlePrefix}`, 'i') } });
    await User.deleteMany({ email: 'testuser_pwd@example.com' });
    console.log('✓ Test Cleanup: Removed all temporary test Resource and User documents');

    console.log('=== ALL PER-RESOURCE PASSWORD PROTECTION TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('❌ Test Suite Failed:', err);
    await Resource.deleteMany({ title: { $regex: new RegExp(`^${testTitlePrefix}`, 'i') } }).catch(() => {});
    await User.deleteMany({ email: 'testuser_pwd@example.com' }).catch(() => {});
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

runPasswordProtectionTests();
