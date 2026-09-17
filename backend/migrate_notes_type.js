const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Resource = require('./src/models/Resource');

async function migrateNotesType() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas for migration check...');

    const collection = mongoose.connection.db.collection('resources');
    const notesResources = await collection.find({ resourceType: 'Notes' }).toArray();

    console.log(`Found ${notesResources.length} resources with resourceType === 'Notes'`);

    if (notesResources.length > 0) {
      const updateResult = await collection.updateMany(
        { resourceType: 'Notes' },
        { $set: { resourceType: 'PDF' } }
      );
      console.log(`Updated ${updateResult.modifiedCount} resources from 'Notes' to 'PDF'`);
    } else {
      console.log('No migration needed. 0 resources had resourceType === "Notes".');
    }

    await mongoose.disconnect();
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateNotesType();

