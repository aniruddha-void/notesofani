const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./src/config/db');
const ContactMessage = require('./src/models/ContactMessage');
const User = require('./src/models/User');
const { submitContactForm } = require('./src/controllers/contactController');
const { protectUser } = require('./src/middlewares/authMiddleware');
const { generateToken } = require('./src/utils/jwt');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function runAuthContactTests() {
  console.log('=== STARTING CONTACT FORM USER AUTH PROTECTION TESTS ===');
  await connectDB();

  const testEmailPrefix = 'auth_contact_test_';
  let testUser = null;
  let userToken = null;

  try {
    // Ensure test user document exists in MongoDB
    testUser = await User.findOne({ email: `${testEmailPrefix}user@example.com` });
    if (!testUser) {
      testUser = await User.create({
        name: 'Contact Auth Tester',
        email: `${testEmailPrefix}user@example.com`,
        googleId: 'test_contact_google_123',
      });
    }

    userToken = generateToken({ id: testUser._id.toString(), role: 'user', email: testUser.email });

    // TEST 1: Unauthenticated request (no cookie/token) -> protectUser rejects with 401
    {
      const req = {
        cookies: {},
        headers: {},
        body: {
          name: 'Anonymous Hater',
          email: 'anon@example.com',
          message: 'Trying to bypass authentication',
        },
      };
      const res = createMockRes();

      let nextCalled = false;
      await protectUser(req, res, () => { nextCalled = true; });

      if (nextCalled || res.statusCode !== 401) {
        throw new Error(`[Test Fail 1] Expected protectUser to reject unauthenticated request with 401, got status ${res.statusCode}`);
      }

      // Verify no document was saved in MongoDB
      const docCount = await ContactMessage.countDocuments({ email: 'anon@example.com' });
      if (docCount !== 0) {
        throw new Error('[Test Fail 1] Unauthenticated request created a ContactMessage in MongoDB!');
      }

      console.log('✓ Test 1 Passed: Unauthenticated request to contact API rejected with 401 Unauthorized');
    }

    // TEST 2: Authenticated User request -> protectUser passes, submitContactForm creates ContactMessage
    let createdMsgId = null;
    {
      const req = {
        cookies: { userToken },
        headers: {},
        body: {
          name: 'Contact Auth Tester',
          email: `${testEmailPrefix}user@example.com`,
          subject: 'Resource Suggestion',
          message: 'Can you please add Operating Systems notes?',
        },
      };
      const res = createMockRes();

      let nextCalled = false;
      await protectUser(req, res, () => { nextCalled = true; });

      if (!nextCalled || !req.user) {
        throw new Error('[Test Fail 2] protectUser failed to authenticate valid user token');
      }

      await submitContactForm(req, res);

      if (res.statusCode !== 201 || res.body?.status !== 'success') {
        throw new Error(`[Test Fail 2] Expected 201 for authenticated contact submission, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }

      createdMsgId = res.body?.data?.messageId;
      const dbDoc = await ContactMessage.findById(createdMsgId);
      if (!dbDoc) {
        throw new Error('[Test Fail 2] ContactMessage document not found in MongoDB');
      }

      if (String(dbDoc.user) !== String(testUser._id)) {
        throw new Error(`[Test Fail 2] Document user reference mismatch: expected ${testUser._id}, got ${dbDoc.user}`);
      }

      console.log('✓ Test 2 Passed: Authenticated user submission succeeded (201) and linked to req.user._id in MongoDB');
    }

    // TEST 3: Authenticated User with invalid input -> 400 error and no invalid document created
    {
      const req = {
        cookies: { userToken },
        headers: {},
        body: {
          name: 'Contact Auth Tester',
          email: 'invalid-email',
          message: 'Some message',
        },
      };
      const res = createMockRes();

      await protectUser(req, res, () => {});
      await submitContactForm(req, res);

      if (res.statusCode !== 400) {
        throw new Error(`[Test Fail 3] Expected 400 for invalid email, got ${res.statusCode}`);
      }

      console.log('✓ Test 3 Passed: Authenticated request with invalid email returns 400 validation error');
    }

    // TEST 4: Simulated Logout (invalid/missing token) -> 401
    {
      const req = {
        cookies: { userToken: 'invalid_token_after_logout' },
        headers: {},
        body: {
          name: 'Logged Out User',
          email: `${testEmailPrefix}user@example.com`,
          message: 'Trying to submit after logout',
        },
      };
      const res = createMockRes();

      let nextCalled = false;
      await protectUser(req, res, () => { nextCalled = true; });

      if (nextCalled || res.statusCode !== 401) {
        throw new Error('[Test Fail 4] Expected protectUser to reject invalid/logged out token');
      }

      console.log('✓ Test 4 Passed: Post-logout request rejected with 401 Unauthorized');
    }

    // Cleanup test records
    await ContactMessage.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`, 'i') } });
    await User.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`, 'i') } });
    console.log('✓ Test Cleanup: Removed all test ContactMessage and User records from MongoDB');

    console.log('=== ALL CONTACT FORM AUTH PROTECTION TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('❌ Test Suite Failed:', err);
    await ContactMessage.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`, 'i') } }).catch(() => {});
    await User.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`, 'i') } }).catch(() => {});
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

runAuthContactTests();
