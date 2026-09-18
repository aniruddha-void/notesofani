const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('../src/models/Admin');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('[Admin Seeder Error]: MONGODB_URI environment variable is required.');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('[Admin Seeder] Connected to MongoDB');

    const adminEmail = process.env.INITIAL_ADMIN_EMAIL ? process.env.INITIAL_ADMIN_EMAIL.trim().toLowerCase() : null;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD ? process.env.INITIAL_ADMIN_PASSWORD.trim() : null;

    if (!adminEmail || !adminPassword) {
      console.error('[Admin Seeder Error]: INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD environment variables are required to seed initial admin account.');
      await mongoose.disconnect();
      process.exit(1);
    }

    const existing = await Admin.findOne({ email: adminEmail });
    if (existing) {
      const isMatch = await bcrypt.compare(adminPassword, existing.passwordHash);
      if (!isMatch) {
        const salt = await bcrypt.genSalt(10);
        existing.passwordHash = await bcrypt.hash(adminPassword, salt);
        existing.email = adminEmail;
        await existing.save();
        console.log(`[Admin Seeder] Admin password synchronized successfully for admin: ${adminEmail}`);
      } else {
        console.log(`[Admin Seeder] Admin account is already synchronized for admin: ${adminEmail}`);
      }
      await mongoose.disconnect();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = await Admin.create({
      email: adminEmail,
      passwordHash: passwordHash,
      name: 'NotesofAni Administrator',
      role: 'admin',
    });

    console.log(`[Admin Seeder] Success! Initial admin account created for: ${admin.email}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('[Admin Seeder Error]:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
};

if (require.main === module) {
  seedAdmin().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = seedAdmin;
