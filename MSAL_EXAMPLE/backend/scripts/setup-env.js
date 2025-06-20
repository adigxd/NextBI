// Script to set up the .env file with a secure JWT_SECRET
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a secure random JWT secret
const generateJwtSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Path to the .env.example file
const envExamplePath = path.join(__dirname, '..', '.env.example');
// Path to the .env file
const envPath = path.join(__dirname, '..', '.env');

// Check if .env file already exists
if (fs.existsSync(envPath)) {
  console.log('.env file already exists. Checking if JWT_SECRET is defined...');
  
  // Read the existing .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if JWT_SECRET is defined
  if (envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=your_jwt_secret_key')) {
    console.log('JWT_SECRET is already defined in .env file.');
  } else {
    console.log('JWT_SECRET is not defined or has default value. Adding a secure JWT_SECRET...');
    
    // Generate a new JWT secret
    const jwtSecret = generateJwtSecret();
    
    // Replace the default JWT_SECRET or add a new one
    const updatedEnvContent = envContent.includes('JWT_SECRET=') 
      ? envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`)
      : `${envContent}\nJWT_SECRET=${jwtSecret}`;
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log('Added secure JWT_SECRET to .env file.');
  }
} else {
  console.log('.env file does not exist. Creating from .env.example...');
  
  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    console.error('.env.example file not found!');
    process.exit(1);
  }
  
  // Read the .env.example file
  let envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Generate a new JWT secret
  const jwtSecret = generateJwtSecret();
  
  // Replace the default JWT_SECRET with a secure one
  const updatedEnvContent = envExampleContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
  
  // Write the updated content to the .env file
  fs.writeFileSync(envPath, updatedEnvContent);
  console.log('Created .env file with secure JWT_SECRET.');
}

console.log('Environment setup complete!');
