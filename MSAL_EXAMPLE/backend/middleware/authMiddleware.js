const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT authentication middleware - requires authentication
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }
    
    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
    }
    
    try {
        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log('JWT verification error:', err.message);
                return res.status(403).json({ message: 'Invalid token' });
            }
            
            console.log('Decoded JWT user:', user);
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Unexpected error in JWT verification:', error);
        return res.status(500).json({ message: 'Authentication error' });
    }
}

// Role checking middleware
const { User } = require('../models');
function requireRole(roles) {
    return async (req, res, next) => {
        console.log('Role middleware - checking roles:', roles);
        console.log('Role middleware - user:', req.user);
        
        if (!req.user) {
            console.log('Role middleware - no user found');
            return res.status(403).json({ message: 'Forbidden: no user' });
        }
        
        // If role is missing from JWT, fetch from DB
        if (!req.user.role) {
            console.log('Role middleware - no role in token, fetching from DB');
            try {
                const user = await User.findByPk(req.user.id);
                if (!user) {
                    console.log('Role middleware - user not found in DB');
                    return res.status(403).json({ message: 'Forbidden: user not found' });
                }
                req.user.role = user.role;
                console.log('Role middleware - fetched role from DB:', user.role);
            } catch (err) {
                console.error('Role middleware - error fetching user role:', err);
                return res.status(500).json({ message: 'Error fetching user role' });
            }
        }
        
        console.log('Role middleware - user role:', req.user.role);
        console.log('Role middleware - required roles:', roles);
        
        if (!roles.includes(req.user.role)) {
            console.log('Role middleware - insufficient role');
            return res.status(403).json({ 
                message: 'Forbidden: insufficient role', 
                userRole: req.user.role, 
                requiredRoles: roles 
            });
        }
        
        console.log('Role middleware - access granted');
        next();
    };
}

// Optional authentication middleware - allows requests to proceed without authentication
function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // If no token is provided, just continue without setting req.user
    if (!token) {
        console.log('Optional auth: No token provided, continuing as anonymous');
        return next();
    }
    
    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
    }
    
    try {
        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log('Optional auth: JWT verification error:', err.message);
                // Even if token is invalid, continue without setting req.user
                return next();
            }
            
            console.log('Optional auth: Decoded JWT user:', user);
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Unexpected error in JWT verification:', error);
        // Continue without setting req.user
        next();
    }
}

module.exports = { authMiddleware, requireRole, optionalAuthMiddleware };
