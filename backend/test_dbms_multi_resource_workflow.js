const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');

async function testDbmsMultiResourceWorkflow() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('=== STARTING MANDATORY DBMS MULTI-RESOURCE WORKFLOW TEST ===\n');

    const testSubjectName = 'DBMS Architecture Verification Test';
    await Subject.deleteMany({ name: testSubjectName });

    console.log('Step 1: Creating Subject...');
    const subject = await Subject.create({
      name: testSubjectName,
      description: 'Database Management Systems Core Subject',
      isActive: true,
    });
    console.log(`✓ Subject created: "${subject.name}" | ID: ${subject._id}`);

    console.log('\nStep 2: Creating 5 distinct Resources under the SAME Subject ID...');

    const res1 = await Resource.create({
      title: 'DBMS PYQ',
      description: 'Previous year question paper',
      resourceType: 'PYQ',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/dbms-2024-pyq.pdf',
      fileSize: 1024,
      published: true,
    });

    const res2 = await Resource.create({
      title: 'DBMS Notes',
      description: 'Comprehensive lecture notes',
      resourceType: 'PDF',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/dbms-notes.pdf',
      fileSize: 2048,
      published: true,
    });

    const res3 = await Resource.create({
      title: 'DBMS Video',
      description: 'YouTube tutorial lecture',
      resourceType: 'Video',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://www.youtube.com/watch?v=sample123',
      published: true,
    });

    const res4 = await Resource.create({
      title: 'DBMS Drive',
      description: 'Google Drive shared folder',
      resourceType: 'Google Drive',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://drive.google.com/folder/sample-drive',
      published: true,
    });

    const res5 = await Resource.create({
      title: 'DBMS Link',
      description: 'GeeksforGeeks reference link',
      resourceType: 'Useful Link',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://www.geeksforgeeks.org/dbms',
      published: true,
    });

    console.log(`✓ Successfully created 5 resources:`);
    console.log(`  - ${res1.title} (${res1.resourceType}) ID: ${res1._id}`);
    console.log(`  - ${res2.title} (${res2.resourceType}) ID: ${res2._id}`);
    console.log(`  - ${res3.title} (${res3.resourceType}) ID: ${res3._id}`);
    console.log(`  - ${res4.title} (${res4.resourceType}) ID: ${res4._id}`);
    console.log(`  - ${res5.title} (${res5.resourceType}) ID: ${res5._id}`);

    console.log('\nStep 3: Verifying Database Counts...');
    const subjectCount = await Subject.countDocuments({ _id: subject._id });
    const resourceCount = await Resource.countDocuments({ subject: subject._id });

    console.log(`  Subject Count for DBMS: ${subjectCount} (Expected: 1)`);
    console.log(`  Resource Count for DBMS: ${resourceCount} (Expected: 5)`);

    if (subjectCount !== 1 || resourceCount !== 5) {
      throw new Error(`Count assertion failed! Subjects: ${subjectCount}, Resources: ${resourceCount}`);
    }
    console.log('✓ VERIFIED: Exactly 1 Subject document supports 5 independent Resource documents!');

    console.log('\nStep 4: Editing ONLY Resource 1 (DBMS PYQ)...');
    res1.title = 'DBMS 2024 PYQ Updated';
    await res1.save();

    const checkRes1 = await Resource.findById(res1._id);
    const checkRes2 = await Resource.findById(res2._id);
    const checkRes3 = await Resource.findById(res3._id);

    console.log(`  Resource 1 updated title: "${checkRes1.title}"`);
    console.log(`  Resource 2 title: "${checkRes2.title}" (Unchanged)`);
    console.log(`  Resource 3 title: "${checkRes3.title}" (Unchanged)`);

    if (checkRes1.title !== 'DBMS 2024 PYQ Updated' || checkRes2.title !== 'DBMS Notes' || checkRes3.title !== 'DBMS Video') {
      throw new Error('Editing one resource affected other resources!');
    }
    console.log('✓ VERIFIED: Editing Resource 1 mutated ONLY Resource 1. Other resources remain untouched.');

    console.log('\nStep 5: Deleting ONLY Resource 1...');
    await Resource.findByIdAndDelete(res1._id);

    const postDeleteSubjectCount = await Subject.countDocuments({ _id: subject._id });
    const postDeleteResourceCount = await Resource.countDocuments({ subject: subject._id });
    const deletedResCheck = await Resource.findById(res1._id);

    console.log(`  Deleted Resource Check: ${deletedResCheck ? 'STILL EXISTS' : 'NULL (Successfully Deleted)'}`);
    console.log(`  Remaining DBMS Resources: ${postDeleteResourceCount} (Expected: 4)`);
    console.log(`  DBMS Subject Count: ${postDeleteSubjectCount} (Expected: 1)`);

    if (deletedResCheck !== null || postDeleteResourceCount !== 4 || postDeleteSubjectCount !== 1) {
      throw new Error('Deleting one resource failed or damaged the Subject / other resources!');
    }
    console.log('✓ VERIFIED: Deleting Resource 1 removed ONLY Resource 1. Subject and 4 remaining resources are fully intact.');

    console.log('\nStep 6: Creating another resource of the SAME type (PYQ 2026) under DBMS...');
    const res6 = await Resource.create({
      title: 'DBMS PYQ 2026',
      description: 'New PYQ resource of same type under same subject',
      resourceType: 'PYQ',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/dbms-2026-pyq.pdf',
      fileSize: 3072,
      published: true,
    });

    const finalSubjectCount = await Subject.countDocuments({ _id: subject._id });
    const finalResourceCount = await Resource.countDocuments({ subject: subject._id });

    console.log(`  Created New Resource ID: ${res6._id} | Type: ${res6.resourceType}`);
    console.log(`  Final DBMS Subject Count: ${finalSubjectCount} (Expected: 1)`);
    console.log(`  Final DBMS Resource Count: ${finalResourceCount} (Expected: 5)`);

    if (finalSubjectCount !== 1 || finalResourceCount !== 5) {
      throw new Error('Adding second PYQ failed!');
    }
    console.log('✓ VERIFIED: Multiple resources of the SAME type (e.g. multiple PYQs) are fully supported under 1 Subject!');

    console.log('\nCleaning up test documents...');
    await Resource.deleteMany({ subject: subject._id });
    await Subject.deleteOne({ _id: subject._id });

    await mongoose.disconnect();
    console.log('\n=== ALL MANDATORY WORKFLOW TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS! ===');
    process.exit(0);
  } catch (error) {
    console.error('Workflow test failed:', error);
    process.exit(1);
  }
}

testDbmsMultiResourceWorkflow();

