/**
 * Creates or updates an admin user.
 *
 * Usage:
 *   node scripts/createAdmin.js
 *   ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=secret123 node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const NAME     = process.env.ADMIN_NAME;
const EMAIL    = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌  MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅  Connected to MongoDB');

  const existing = await User.findOne({ email: EMAIL });

  if (existing) {
    // Promote to admin if already a regular user
    existing.role   = 'admin';
    existing.status = 'active';
    existing.name   = NAME;
    existing.password = PASSWORD;   // triggers bcrypt pre-save hook
    await existing.save();
    console.log(`✅  Existing user promoted to admin: ${EMAIL}`);
  } else {
    await User.create({ name: NAME, email: EMAIL, password: PASSWORD, role: 'admin', status: 'active' });
    console.log(`✅  Admin account created: ${EMAIL}`);
  }

  console.log(`\n   Email    : ${EMAIL}`);
  console.log(`   Password : ${PASSWORD}`);
  console.log('\n   Use these credentials to log in at the admin dashboard.\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ ', err.message);
  process.exit(1);
});
