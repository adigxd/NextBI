const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const responseController = require('../controllers/responseController');

// Analytics routes (admin only)
// Get all responses for a survey - for analytics
router.get('/survey/:surveyId', authMiddleware, requireRole(['admin']), responseController.getResponsesBySurveyId);

// Get a specific response - admins can view any response, users can only view their own
router.get('/:id', authMiddleware, responseController.getResponseById); // Controller should check ownership

// Submit a new response - authentication optional for anonymous surveys
router.post('/', optionalAuthMiddleware, responseController.createResponse);

// Get user's own responses - users can see their submissions
router.get('/user/me', authMiddleware, requireRole(['user']), responseController.getUserResponses);

module.exports = router;
