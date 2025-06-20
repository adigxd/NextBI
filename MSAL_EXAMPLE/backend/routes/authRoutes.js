// Authentication routes for registration, login, and Azure AD authentication
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
require('dotenv').config();

// Legacy Register route (kept for backward compatibility)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email already in use' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Manual Login route for admin and other users with password authentication
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        console.log(`Manual login attempt for email: ${email}`);
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log(`Login failed: User not found for email ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            console.log(`Login failed: Invalid password for user ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log(`Login successful for user: ${user.username} (${user.email}), role: ${user.role}`);
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Manual login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Azure AD User Info route
// This route is used by the frontend to get user info after Azure AD authentication
router.get('/me', async (req, res) => {
    try {
        // The msalAuthMiddleware will add the user to the request
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        // Return user info
        res.json({
            user: {
                id: req.user.id,
                username: req.user.name || req.user.email,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// MSAL token exchange endpoint
// This endpoint allows the frontend to exchange a valid MSAL token for a standard JWT token
router.post('/msal-exchange', async (req, res) => {
    try {
        console.log('MSAL exchange request received:', req.body);
        const { email } = req.body;
        
        if (!email) {
            console.error('MSAL exchange error: No email provided in request');
            return res.status(400).json({ message: 'Email is required' });
        }
        
        console.log(`MSAL exchange request for email: ${email}`);
        
        try {
            // Find or create the user
            let user = await User.findOne({ where: { email } });
            
            if (!user) {
                console.log(`Creating new user for email: ${email}`);
                // Create a new user with the email
                user = await User.create({
                    username: email.split('@')[0],
                    email: email,
                    role: 'user', // Default role
                    password: Math.random().toString(36).slice(-10), // Random password
                });
            }
            
            console.log(`User found/created: ${user.username} (${user.email}), role: ${user.role}`);
            
            // Check if JWT_SECRET is defined
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not defined in environment variables');
                return res.status(500).json({ message: 'Server configuration error' });
            }
            
            // Generate a standard JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            console.log('JWT token generated successfully');
            
            // Return the token and user info
            return res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (dbError) {
            console.error('Database error during MSAL exchange:', dbError);
            return res.status(500).json({ message: 'Database error', error: dbError.message });
        }
    } catch (err) {
        console.error('MSAL exchange error:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
});


module.exports = router;
