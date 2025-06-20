const express = require('express');
const router = express.Router();
const surveyAssignmentController = require('../controllers/surveyAssignmentController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Authentication is handled at the server level
// No need to use router.use(requireAuth) here

// Routes for admin only
router.post('/assign', requireRole(['admin']), surveyAssignmentController.assignUserToSurvey);
router.delete('/:surveyId/user/:userId', requireRole(['admin']), surveyAssignmentController.removeUserFromSurvey);
router.get('/survey/:surveyId/users', requireRole(['admin']), surveyAssignmentController.getUsersBySurveyId);
router.get('/search-users', requireRole(['admin']), surveyAssignmentController.searchUsers);
router.post('/survey/:surveyId/auto-assign', requireRole(['admin']), surveyAssignmentController.autoAssignUsers);

// Routes for both admin and user
router.get('/user/:userId?/surveys', requireRole(['admin', 'user']), surveyAssignmentController.getSurveysByUserId);

module.exports = router;
