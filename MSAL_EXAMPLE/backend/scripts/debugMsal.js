// Script to debug MSAL authentication and user creation
require('dotenv').config();
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { User } = require('../models');
const database = require('../config/database');

// Create a JWKS client to fetch the signing keys
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
});

// Function to get the signing key
const getSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

// Function to manually create an admin user
async function createAdminUser(email) {
  try {
    await database.connect();
    console.log('Database connected');
    
    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    
    if (user) {
      console.log(`User already exists: ${user.username} (${user.email}), role: ${user.role}`);
      
      // Update role to admin if not already
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log(`Updated user role to admin`);
      }
    } else {
      // Create new admin user
      user = await User.create({
        username: email.split('@')[0], // Use part before @ as username
        email: email,
        role: 'admin',
        password: Math.random().toString(36).slice(-10), // Random password
      });
      console.log(`Created new admin user: ${user.username} (${user.email})`);
    }
    
    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error('Please provide an email address as argument');
      process.exit(1);
    }
    
    console.log(`Creating/updating admin user for email: ${email}`);
    const user = await createAdminUser(email);
    
    console.log('Success! User details:');
    console.log({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main();
