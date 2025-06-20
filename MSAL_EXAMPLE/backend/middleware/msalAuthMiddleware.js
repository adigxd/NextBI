const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { User } = require('../models');
require('dotenv').config();

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

// Azure AD token validation middleware
function msalAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Verify the token
  jwt.verify(token, getSigningKey, {
    algorithms: ['RS256'],
    audience: process.env.AZURE_CLIENT_ID, // The client ID of your app registration
    issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}/v2.0`,
  }, async (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }

    try {
      // Log the decoded token for debugging
      console.log('Decoded MSAL token:', JSON.stringify(decoded, null, 2));
      
      // Extract email from token
      const email = decoded.preferred_username || decoded.upn || decoded.email || decoded.unique_name;
      
      if (!email) {
        console.error('No email found in token:', decoded);
        return res.status(400).json({ message: 'No email found in token' });
      }
      
      console.log(`Looking for user with email: ${email}`);
      
      // Check if user exists in our database
      let user = await User.findOne({ where: { email } });
      
      // If user doesn't exist, create a new one
      if (!user) {
        console.log(`User with email ${email} not found, creating new user`);
        const username = decoded.name || email.split('@')[0];
        
        try {
          user = await User.create({
            username: username,
            email: email,
            // Set a default role (you might want to adjust this based on your requirements)
            role: 'user',
            // No password needed for Azure AD authentication
            password: Math.random().toString(36).slice(-10),
          });
          console.log(`Created new user: ${username} (${email})`);
        } catch (createError) {
          console.error('Error creating user:', createError);
          return res.status(500).json({ message: 'Error creating user account' });
        }
      } else {
        console.log(`Found existing user: ${user.username} (${user.email})`);
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        // Add Azure AD specific claims if needed
        azureOid: decoded.oid,
        name: decoded.name,
      };
      
      next();
    } catch (error) {
      console.error('MSAL middleware error:', error);
      res.status(500).json({ message: 'Server error processing authentication' });
    }
  });
}

// Role checking middleware (same as before)
function requireRole(roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden: no user' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    
    next();
  };
}

module.exports = {
  msalAuthMiddleware,
  requireRole
};
