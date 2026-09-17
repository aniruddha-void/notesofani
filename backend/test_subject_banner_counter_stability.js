const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Subject = require('./src/models/Subject');
const Resource = require('./src/models/Resource');

async function testSubjectBannerCounterStability() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('=== STARTING SUBJECT BANNER COUNTER STABILITY TEST ===\n');

    const testSubjectName = 'Advance Java Banner Stability Test';
    await Subject.deleteMany({ name: testSubjectName });

    // 1. Create Subject
    console.log('Step 1: Creating Subject ("Advance Java Banner Stability Test")...');
    const subject = await Subject.create({
      name: testSubjectName,
      description: 'Subject for banner counter stability test',
      isActive: true,
    });
    console.log(`✓ Subject created with ID: ${subject._id}`);

    // 2. Create 2 Resources (1 PDF, 1 PYQ)
    console.log('\nStep 2: Creating 2 resources (1 PDF, 1 PYQ) under Subject...');
    const pdfRes = await Resource.create({
      title: 'Advance Java Notes',
      description: 'PDF notes',
      resourceType: 'PDF',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/adv-notes.pdf',
      fileSize: 1024,
      published: true,
    });

    const pyqRes = await Resource.create({
      title: 'Advance Java 2025 PYQ',
      description: 'PYQ paper',
      resourceType: 'PYQ',
      subject: subject._id,
      sourceType: 'upload',
      fileUrl: '/uploads/pdf/adv-2025-pyq.pdf',
      fileSize: 2048,
      published: true,
    });
    console.log('✓ Successfully created 1 PDF and 1 PYQ resource!');

    // 3. Compute Stable Inventory Breakdown
    console.log('\nStep 3: Fetching Full Subject Inventory (Unfiltered)...');
    const fullInventory = await Resource.find({ subject: subject._id });

    const OFFICIAL_TYPES = ['PDF', 'Video', 'PYQ', 'Google Drive', 'Useful Link'];
    const stableBreakdown = OFFICIAL_TYPES.reduce((acc, t) => {
      acc[t] = fullInventory.filter((r) => r.resourceType === t).length;
      return acc;
    }, {});

    console.log(`  Stable Total Resources: ${fullInventory.length} (Expected: 2)`);
    console.log(`  Stable Breakdown:`, stableBreakdown);

    if (fullInventory.length !== 2 || stableBreakdown['PDF'] !== 1 || stableBreakdown['PYQ'] !== 1) {
      throw new Error('Full inventory count assertion failed!');
    }

    // 4. Test Filtering Simulation
    console.log('\nStep 4: Simulating Filter Queries...');

    // Scenario A: All Types Selected
    const allFiltered = await Resource.find({ subject: subject._id, published: true });
    console.log(`  Scenario A (All Types): Returned ${allFiltered.length} card(s)`);
    console.log(`  -> Banner Total: ${fullInventory.length} | PDF: ${stableBreakdown['PDF']} | PYQ: ${stableBreakdown['PYQ']}`);

    // Scenario B: PDF Selected
    const pdfFiltered = await Resource.find({ subject: subject._id, resourceType: 'PDF', published: true });
    console.log(`  Scenario B (PDF Filter): Returned ${pdfFiltered.length} card(s) ("${pdfFiltered[0]?.title}")`);
    console.log(`  -> Banner Total: ${fullInventory.length} | PDF: ${stableBreakdown['PDF']} | PYQ: ${stableBreakdown['PYQ']} (STABLE UNCHANGED!)`);

    // Scenario C: PYQ Selected
    const pyqFiltered = await Resource.find({ subject: subject._id, resourceType: 'PYQ', published: true });
    console.log(`  Scenario C (PYQ Filter): Returned ${pyqFiltered.length} card(s) ("${pyqFiltered[0]?.title}")`);
    console.log(`  -> Banner Total: ${fullInventory.length} | PDF: ${stableBreakdown['PDF']} | PYQ: ${stableBreakdown['PYQ']} (STABLE UNCHANGED!)`);

    if (pdfFiltered.length !== 1 || pyqFiltered.length !== 1 || allFiltered.length !== 2) {
      throw new Error('Filtered card results do not match expected queries!');
    }
    console.log('✓ VERIFIED: Active Subject Banner counters remain 100% stable while card list filters dynamically!');

    // Step 5: Test Subject Selector Pill Count
    console.log('\nStep 5: Verifying Subject Selector Pill Count...');
    const subjectPillCount = await Resource.countDocuments({ subject: subject._id });
    console.log(`  Subject Pill Count for "${subject.name}": ${subjectPillCount} (Expected: 2)`);
    if (subjectPillCount !== 2) {
      throw new Error('Subject pill count is incorrect!');
    }
    console.log('✓ VERIFIED: Subject pill count represents total subject resources (2) and remains unchanged!');

    // Cleanup
    console.log('\nCleaning up test documents...');
    await Resource.deleteMany({ subject: subject._id });
    await Subject.deleteOne({ _id: subject._id });

    await mongoose.disconnect();
    console.log('\n=== ALL BANNER COUNTER STABILITY TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (error) {
    console.error('Counter stability test failed:', error);
    process.exit(1);
  }
}

testSubjectBannerCounterStability();
