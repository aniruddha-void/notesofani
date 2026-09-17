const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');

async function testLmsSubjectExperience() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('=== STARTING SUBJECT-CENTRIC LMS EXPERIENCE VERIFICATION TEST ===\n');

    const testSubjectName = 'Advance Java';
    await Subject.deleteMany({ name: testSubjectName });

    // 1. Create ONE Subject ("Advance Java")
    console.log('Step 1: Creating ONE Subject ("Advance Java")...');
    const subject = await Subject.create({
      name: testSubjectName,
      description: 'Advanced Java Programming Course & Study Material',
      isActive: true,
    });
    console.log(`✓ Subject created: "${subject.name}" (ID: ${subject._id})`);

    // 2. Create 5 distinct Resources for all 5 canonical types under Advance Java
    console.log('\nStep 2: Creating 5 Resources (PDF, Video, PYQ, Google Drive, Useful Link) under Advance Java...');

    const res1 = await Resource.create({
      title: 'Advance Java Unit 1 Notes',
      description: 'Comprehensive notes covering Servlets and JSP',
      resourceType: 'PDF',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/advjava-unit1.pdf',
      fileSize: 1024,
      published: true,
    });

    const res2 = await Resource.create({
      title: 'Advance Java Video Lecture',
      description: 'Complete video lecture on Spring Boot framework',
      resourceType: 'Video',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://www.youtube.com/watch?v=advjava',
      published: true,
    });

    const res3 = await Resource.create({
      title: 'Advance Java 2025 PYQ',
      description: 'University final examination question paper 2025',
      resourceType: 'PYQ',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/advjava-2025-pyq.pdf',
      fileSize: 2048,
      published: true,
    });

    const res4 = await Resource.create({
      title: 'Advance Java Drive Material',
      description: 'Google Drive folder containing sample code & lab exercises',
      resourceType: 'Google Drive',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://drive.google.com/folder/advjava',
      published: true,
    });

    const res5 = await Resource.create({
      title: 'Java Documentation',
      description: 'Official Oracle Java SE Documentation',
      resourceType: 'Useful Link',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://docs.oracle.com/en/java/',
      published: true,
    });

    console.log(`✓ Successfully created 5 resources under "${subject.name}":`);
    console.log(`  1. ${res1.title} (${res1.resourceType})`);
    console.log(`  2. ${res2.title} (${res2.resourceType})`);
    console.log(`  3. ${res3.title} (${res3.resourceType})`);
    console.log(`  4. ${res4.title} (${res4.resourceType})`);
    console.log(`  5. ${res5.title} (${res5.resourceType})`);

    // 3. Database Count Assertions
    console.log('\nStep 3: Database Uniqueness & Count Assertions...');
    const subjectCount = await Subject.countDocuments({ name: testSubjectName });
    const resourceCount = await Resource.countDocuments({ subject: subject._id });

    console.log(`  Advance Java Subject Count: ${subjectCount} (Expected: 1)`);
    console.log(`  Advance Java Resource Count: ${resourceCount} (Expected: 5)`);

    if (subjectCount !== 1 || resourceCount !== 5) {
      throw new Error(`Count assertion failed! Subjects: ${subjectCount}, Resources: ${resourceCount}`);
    }
    console.log('✓ VERIFIED: Exactly 1 Subject document created without duplicates!');

    // 4. Test Filtering Scenarios
    console.log('\nStep 4: Testing Type Filtering under "Advance Java"...');

    const pdfFilter = await Resource.find({ subject: subject._id, resourceType: 'PDF' });
    console.log(`  PDF Filter Result: ${pdfFilter.length} item(s) -> "${pdfFilter[0]?.title}"`);

    const videoFilter = await Resource.find({ subject: subject._id, resourceType: 'Video' });
    console.log(`  Video Filter Result: ${videoFilter.length} item(s) -> "${videoFilter[0]?.title}"`);

    const pyqFilter = await Resource.find({ subject: subject._id, resourceType: 'PYQ' });
    console.log(`  PYQ Filter Result: ${pyqFilter.length} item(s) -> "${pyqFilter[0]?.title}"`);

    const driveFilter = await Resource.find({ subject: subject._id, resourceType: 'Google Drive' });
    console.log(`  Google Drive Filter Result: ${driveFilter.length} item(s) -> "${driveFilter[0]?.title}"`);

    const linkFilter = await Resource.find({ subject: subject._id, resourceType: 'Useful Link' });
    console.log(`  Useful Link Filter Result: ${linkFilter.length} item(s) -> "${linkFilter[0]?.title}"`);

    const allFilter = await Resource.find({ subject: subject._id });
    console.log(`  All Types Filter Result: ${allFilter.length} total item(s)`);

    if (
      pdfFilter.length !== 1 ||
      videoFilter.length !== 1 ||
      pyqFilter.length !== 1 ||
      driveFilter.length !== 1 ||
      linkFilter.length !== 1 ||
      allFilter.length !== 5
    ) {
      throw new Error('Type filtering test failed!');
    }
    console.log('✓ VERIFIED: All 5 resource types filter correctly under "Advance Java"!');

    // Cleanup
    console.log('\nCleaning up test documents...');
    await Resource.deleteMany({ subject: subject._id });
    await Subject.deleteOne({ _id: subject._id });

    await mongoose.disconnect();
    console.log('\n=== ALL LMS SUBJECT EXPERIENCE TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (error) {
    console.error('LMS test failed:', error);
    process.exit(1);
  }
}

testLmsSubjectExperience();
