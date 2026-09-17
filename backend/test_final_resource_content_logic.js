const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');
const { OFFICIAL_RESOURCE_TYPES } = require('./src/models/Resource');

async function runFinalResourceContentLogicTest() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('=== STARTING FINAL RESOURCE CONTENT LOGIC E2E TEST ===');

    const testSubjectName = 'DSA Final Logic Test Subject';
    await Subject.deleteMany({ name: { $regex: /DSA Final Logic Test Subject/i } });

    // 1. Create 1 Subject
    console.log('\n--- 1. Subject Creation ---');
    const subject = await Subject.create({
      name: testSubjectName,
      description: 'Single subject holding multiple resource types',
      isActive: true,
    });
    console.log(`✓ Subject created: ${subject.name} (ID: ${subject._id})`);

    // 2. Create 5 distinct resources under the SAME Subject
    console.log('\n--- 2. Creating 5 distinct Resources under 1 Subject ---');

    const res1 = await Resource.create({
      title: 'DSA Notes PDF',
      description: 'PDF notes document',
      resourceType: 'PDF',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/dsa-notes.pdf',
      fileSize: 1024,
      published: true,
    });

    const res2 = await Resource.create({
      title: 'DSA YouTube Lecture',
      description: 'Video lecture from YouTube',
      resourceType: 'Video',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      published: true,
    });

    const res3 = await Resource.create({
      title: 'DSA Drive Video',
      description: 'Shared video stored on Google Drive',
      resourceType: 'Google Drive',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://drive.google.com/file/d/12345/view',
      published: true,
    });

    const res4 = await Resource.create({
      title: 'DSA 2025 PYQ',
      description: 'Previous year questions document',
      resourceType: 'PYQ',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/dsa-2025-pyq.pdf',
      fileSize: 2048,
      published: true,
    });

    const res5 = await Resource.create({
      title: 'DSA Reference',
      description: 'External documentation link',
      resourceType: 'Useful Link',
      subject: subject._id,
      sourceType: 'external',
      externalUrl: 'https://geeksforgeeks.org/dsa',
      published: true,
    });

    console.log('✓ Successfully created 5 distinct resource documents!');

    // 3. Database Count Assertions
    console.log('\n--- 3. Database Count Assertions ---');
    const subjectCount = await Subject.countDocuments({ _id: subject._id });
    const resourceCount = await Resource.countDocuments({ subject: subject._id });

    console.log(`  Subject Count: ${subjectCount} (Expected: 1)`);
    console.log(`  Resource Count: ${resourceCount} (Expected: 5)`);

    if (subjectCount !== 1 || resourceCount !== 5) {
      throw new Error(`Count assertion failed! Subjects: ${subjectCount}, Resources: ${resourceCount}`);
    }
    console.log('✓ Verified: 1 Subject supports 5 distinct Resource documents!');

    // 4. Edit Resource 2 (Video -> Google Drive) by Resource ID
    console.log('\n--- 4. Test Edit: Video -> Google Drive ---');
    const targetRes2 = await Resource.findById(res2._id);
    targetRes2.resourceType = 'Google Drive';
    targetRes2.sourceType = 'external';
    targetRes2.externalUrl = 'https://drive.google.com/folder/abc-shared-folder';
    targetRes2.fileUrl = ''; // Clear obsolete file content
    await targetRes2.save();

    const updatedRes2_A = await Resource.findById(res2._id);
    console.log(`  Resource ID: ${updatedRes2_A._id}`);
    console.log(`  New Type: ${updatedRes2_A.resourceType} (Expected: Google Drive)`);
    console.log(`  New Content URL: ${updatedRes2_A.externalUrl}`);

    if (updatedRes2_A.resourceType !== 'Google Drive' || updatedRes2_A.externalUrl !== 'https://drive.google.com/folder/abc-shared-folder') {
      throw new Error('Video -> Google Drive edit failed!');
    }
    console.log('✓ Video -> Google Drive edit succeeded!');

    // 5. Edit Resource 2 again (Google Drive -> Video with Vimeo URL)
    console.log('\n--- 5. Test Edit: Google Drive -> Video (Vimeo URL) ---');
    updatedRes2_A.resourceType = 'Video';
    updatedRes2_A.sourceType = 'external';
    updatedRes2_A.externalUrl = 'https://vimeo.com/76543210';
    await updatedRes2_A.save();

    const updatedRes2_B = await Resource.findById(res2._id);
    console.log(`  New Type: ${updatedRes2_B.resourceType} (Expected: Video)`);
    console.log(`  New Content URL: ${updatedRes2_B.externalUrl}`);

    if (updatedRes2_B.resourceType !== 'Video' || updatedRes2_B.externalUrl !== 'https://vimeo.com/76543210') {
      throw new Error('Google Drive -> Video edit failed!');
    }
    console.log('✓ Google Drive -> Video (Vimeo URL) edit succeeded!');

    // 6. Test Edit: Metadata-only edit (Title update)
    console.log('\n--- 6. Test Edit: Metadata-only Title Update ---');
    const targetRes1 = await Resource.findById(res1._id);
    targetRes1.title = 'DSA Complete PDF Notes 2026';
    await targetRes1.save();

    const updatedRes1 = await Resource.findById(res1._id);
    if (updatedRes1.title !== 'DSA Complete PDF Notes 2026' || updatedRes1.fileUrl !== '/uploads/pdf/dsa-notes.pdf') {
      throw new Error('Metadata-only edit corrupted existing file content!');
    }
    console.log('✓ Metadata-only update preserved existing PDF fileUrl!');

    // 7. Test Edit: Video -> Useful Link
    console.log('\n--- 7. Test Edit: Video -> Useful Link ---');
    updatedRes2_B.resourceType = 'Useful Link';
    updatedRes2_B.externalUrl = 'https://developer.mozilla.org/';
    await updatedRes2_B.save();

    const updatedRes2_C = await Resource.findById(res2._id);
    if (updatedRes2_C.resourceType !== 'Useful Link' || updatedRes2_C.externalUrl !== 'https://developer.mozilla.org/') {
      throw new Error('Video -> Useful Link edit failed!');
    }
    console.log('✓ Video -> Useful Link edit succeeded!');

    // 8. Re-assert database counts to ensure no new resources/subjects were created during editing
    console.log('\n--- 8. Final Count Verification After All Edits ---');
    const finalSubjectCount = await Subject.countDocuments({ _id: subject._id });
    const finalResourceCount = await Resource.countDocuments({ subject: subject._id });

    console.log(`  Final Subject Count: ${finalSubjectCount} (Expected: 1)`);
    console.log(`  Final Resource Count: ${finalResourceCount} (Expected: 5)`);

    if (finalSubjectCount !== 1 || finalResourceCount !== 5) {
      throw new Error('Edits caused duplicate Subject or Resource creation!');
    }
    console.log('✓ Confirmed: All edits updated exact Resource IDs without creating duplicate subjects or resources!');

    // Cleanup
    console.log('\nCleaning up test documents...');
    await Resource.deleteMany({ subject: subject._id });
    await Subject.deleteOne({ _id: subject._id });

    await mongoose.disconnect();
    console.log('\n=== ALL FINAL RESOURCE CONTENT LOGIC TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (error) {
    console.error('Final resource logic test failed:', error);
    process.exit(1);
  }
}

runFinalResourceContentLogicTest();
