const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./src/config/db');
const ContactMessage = require('./src/models/ContactMessage');
const { submitContactForm } = require('./src/controllers/contactController');

function createMockRes() {
  return {
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
}

async function runTests() {
  console.log('=== STARTING CONTACT FORM INTEGRATION TESTS ===');
  await connectDB();

  const testEmailPrefix = 'test_contact_integration_';

  try {

    {
      const req = {
        body: {
          name: '',
          email: 'valid@example.com',
          message: 'Hello World',
        },
      };
      const res = createMockRes();
      await submitContactForm(req, res);

      if (res.statusCode !== 400 || res.body?.status !== 'error') {
        throw new Error(`[Test Fail] Expected 400 for missing name, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      console.log('✓ Test 1 Passed: Missing name returns 400 validation error');
    }

    {
      const req = {
        body: {
          name: 'Jane Doe',
          email: 'invalid-email-address',
          message: 'Hello World',
        },
      };
      const res = createMockRes();
      await submitContactForm(req, res);

      if (res.statusCode !== 400 || res.body?.status !== 'error') {
        throw new Error(`[Test Fail] Expected 400 for invalid email, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      console.log('✓ Test 2 Passed: Invalid email returns 400 validation error');
    }

    {
      const req = {
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          message: '   ',
        },
      };
      const res = createMockRes();
      await submitContactForm(req, res);

      if (res.statusCode !== 400 || res.body?.status !== 'error') {
        throw new Error(`[Test Fail] Expected 400 for missing message, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      console.log('✓ Test 3 Passed: Missing message returns 400 validation error');
    }

    let createdMsgId1 = null;
    {
      const req = {
        body: {
          name: '  John Tester  ',
          email: `  ${testEmailPrefix}1@example.com  `,
          subject: '  Resource Suggestion  ',
          message: 'Could you add notes on Microservices Architecture?',
        },
      };
      const res = createMockRes();
      await submitContactForm(req, res);

      if (res.statusCode !== 201 || res.body?.status !== 'success') {
        throw new Error(`[Test Fail] Expected 201 for valid submission, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }

      createdMsgId1 = res.body?.data?.messageId;
      const dbDoc = await ContactMessage.findById(createdMsgId1);
      if (!dbDoc) {
        throw new Error('[Test Fail] Message was not found in MongoDB after 201 response');
      }

      if (
        dbDoc.name !== 'John Tester' ||
        dbDoc.email !== `${testEmailPrefix}1@example.com` ||
        dbDoc.subject !== 'Resource Suggestion' ||
        dbDoc.status !== 'Unread'
      ) {
        throw new Error(`[Test Fail] Document data mismatch: ${JSON.stringify(dbDoc)}`);
      }

      console.log('✓ Test 4 Passed: Valid submission creates MongoDB document with correct trimmed fields & status');
    }

    let createdMsgId2 = null;
    {
      const req = {
        body: {
          name: 'Alice Smith',
          email: `${testEmailPrefix}2@example.com`,
          subject: '',
          message: 'I have a general question regarding downloadable PDFs.',
        },
      };
      const res = createMockRes();
      await submitContactForm(req, res);

      if (res.statusCode !== 201 || res.body?.status !== 'success') {
        throw new Error(`[Test Fail] Expected 201 for optional subject submission, got ${res.statusCode}`);
      }

      createdMsgId2 = res.body?.data?.messageId;
      const dbDoc = await ContactMessage.findById(createdMsgId2);
      if (dbDoc.subject !== 'General Inquiry') {
        throw new Error(`[Test Fail] Expected subject to default to "General Inquiry", got "${dbDoc.subject}"`);
      }

      console.log('✓ Test 5 Passed: Optional subject correctly defaults to "General Inquiry"');
    }

    await ContactMessage.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`, 'i') } });
    console.log('✓ Test Cleanup: Removed all test ContactMessage records from MongoDB');

    console.log('=== ALL CONTACT FORM INTEGRATION TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('❌ Test Suite Failed:', err);

    await ContactMessage.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`, 'i') } }).catch(() => {});
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

runTests();

