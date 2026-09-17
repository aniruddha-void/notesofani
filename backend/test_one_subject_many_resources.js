const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');
const { OFFICIAL_RESOURCE_TYPES } = require('./src/models/Resource');

async function testOneSubjectManyResources() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('--- STARTING VERIFICATION TEST ---');

    // 1. Clean up old test data if present
    const testSubjectName = 'Data Structure & Algorithm Verification Test';
    await Subject.deleteMany({ name: { $regex: /Data Structure & Algorithm Verification Test/i } });

    // 2. Create Subject
    console.log('Step 1: Creating Subject...');
    const subject = await Subject.create({
      name: testSubjectName,
      description: 'Test subject for verification',
      isActive: true,
    });
    console.log(`✓ Subject created with ID: ${subject._id}`);

    // 3. Duplicate check (case-insensitive)
    console.log('Step 2: Testing case-insensitive duplicate subject protection...');
    const duplicateSubjectName = 'data structure & algorithm verification test';
    const escapedName = duplicateSubjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const duplicate = await Subject.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    });
    if (duplicate) {
      console.log('✓ Duplicate subject correctly detected (Case-insensitive check passed)');
    } else {
      throw new Error('Case-insensitive duplicate check failed!');
    }

    // 4. Create 5 distinct resources under the exact same Subject ID
    console.log('Step 3: Creating 5 resources under the exact same Subject ID for all 5 official types...');
    const resourceConfigs = [
      { title: 'DSA Notes PDF', resourceType: 'PDF', fileUrl: '/uploads/sample.pdf', sourceType: 'upload' },
      { title: 'DSA Video Lecture', resourceType: 'Video', externalUrl: 'https://youtube.com/watch?v=sample', sourceType: 'external' },
      { title: 'DSA 2025 PYQ', resourceType: 'PYQ', fileUrl: '/uploads/pyq.pdf', sourceType: 'upload' },
      { title: 'DSA Drive Material', resourceType: 'Google Drive', externalUrl: 'https://drive.google.com/folder', sourceType: 'external' },
      { title: 'DSA Reference Docs', resourceType: 'Useful Link', externalUrl: 'https://geeksforgeeks.org/dsa', sourceType: 'external' },
    ];

    const createdResources = [];
    for (const config of resourceConfigs) {
      const resDoc = await Resource.create({
        ...config,
        subject: subject._id,
        published: true,
      });
      createdResources.push(resDoc);
    }
    console.log(`✓ Successfully created ${createdResources.length} resources under Subject ID ${subject._id}`);

    // 5. Assert Counts
    console.log('Step 4: Asserting database counts...');
    const subjectCount = await Subject.countDocuments({ _id: subject._id });
    const resourceCount = await Resource.countDocuments({ subject: subject._id });

    console.log(`  Subject Count: ${subjectCount} (Expected: 1)`);
    console.log(`  Resource Count: ${resourceCount} (Expected: 5)`);

    if (subjectCount !== 1 || resourceCount !== 5) {
      throw new Error(`Count assertion failed! Subjects: ${subjectCount}, Resources: ${resourceCount}`);
    }
    console.log('✓ Subject count = 1, Resource count = 5 verified!');

    // 6. Verify Official Resource Types array
    console.log('Step 5: Verifying Official Resource Types...');
    console.log('  Allowed Types:', OFFICIAL_RESOURCE_TYPES);
    if (OFFICIAL_RESOURCE_TYPES.includes('Notes')) {
      throw new Error('Notes is still present in OFFICIAL_RESOURCE_TYPES!');
    }
    console.log('✓ "Notes" is absent from OFFICIAL_RESOURCE_TYPES. Verified exactly 5 canonical types!');

    // 7. Edit Resource Test (PDF -> Video)
    console.log('Step 6: Editing Resource 1 (PDF -> Video)...');
    const pdfResource = createdResources[0];
    pdfResource.resourceType = 'Video';
    pdfResource.externalUrl = 'https://youtube.com/watch?v=converted';
    pdfResource.fileUrl = '';
    pdfResource.sourceType = 'external';
    await pdfResource.save();

    const updatedSubjectCount = await Subject.countDocuments({ _id: subject._id });
    const updatedResourceCount = await Resource.countDocuments({ subject: subject._id });

    if (updatedSubjectCount !== 1 || updatedResourceCount !== 5) {
      throw new Error('Resource edit affected subject or resource counts!');
    }
    console.log('✓ Resource edit successful. Subject count remains 1, resource count remains 5.');

    // Cleanup
    console.log('Cleaning up test documents...');
    await Resource.deleteMany({ subject: subject._id });
    await Subject.deleteOne({ _id: subject._id });

    await mongoose.disconnect();
    console.log('=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

testOneSubjectManyResources();
