// Script to update a user's role to admin
require('dotenv').config();
const { User } = require('../models');
const database = require('../config/database');

// Get email from command line argument or use a default
const EMAIL_TO_MAKE_ADMIN = process.argv[2] || process.env.ADMIN_EMAIL;

async function makeAdmin() {
  try {
    // Connect to the database
    await database.connect();
    
    // Find the user by email
    const user = await User.findOne({ where: { email: EMAIL_TO_MAKE_ADMIN } });
    
    if (!user) {
      console.error(`User with email ${EMAIL_TO_MAKE_ADMIN} not found.`);
      process.exit(1);
    }
    
    // Update the user's role to admin
    user.role = 'admin';
    await user.save();
    
    console.log(`User ${user.username} (${user.email}) has been updated to admin role.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating user role:', error);
    process.exit(1);
  }
}

makeAdmin();
