const express = require('express');
const router = express.Router();
const { requireRole, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const surveyController = require('../controllers/surveyController');

// User routes - users can only view surveys assigned to them
// IMPORTANT: Specific routes must come before generic routes with path parameters
router.get('/assigned', requireRole(['user']), surveyController.getActiveSurveys); // Users see only assigned surveys

// Admin routes - admins can create and manage surveys but not participate
router.get('/', requireRole(['admin']), surveyController.getSurveys); // Admin sees all surveys
router.post('/', requireRole(['admin']), surveyController.createSurvey); // Only admins can create
router.post('/:id/toggle-archive', requireRole(['admin']), surveyController.toggleArchiveStatus);

// Routes with path parameters come last
router.put('/:id', requireRole(['admin']), surveyController.updateSurvey); // Only admins can update
router.delete('/:id', requireRole(['admin']), surveyController.deleteSurvey); // Only admins can delete

// View a specific survey - both roles can view but for different purposes
// (admin for management, user for participation)
// Also allows anonymous access for anonymous surveys
router.get('/:id', optionalAuthMiddleware, surveyController.getSurveyById);

module.exports = router;
