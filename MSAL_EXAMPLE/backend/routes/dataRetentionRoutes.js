const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const dataRetentionController = require('../controllers/dataRetentionController');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole(['admin']));

// Archive/restore routes
router.post('/surveys/:id/archive', dataRetentionController.archiveSurvey);
router.post('/surveys/:id/restore', dataRetentionController.restoreSurvey);

// Permanent deletion route (super admin only)
router.delete('/surveys/:id/purge', dataRetentionController.purgeSurvey);

// Retention period routes
router.post('/surveys/:id/retention', dataRetentionController.setRetentionPeriod);

// Archived surveys list
router.get('/surveys/archived', dataRetentionController.getArchivedSurveys);

// Audit logs routes
router.get('/surveys/:id/logs', dataRetentionController.getSurveyAuditLogs);
router.get('/logs', dataRetentionController.getAllAuditLogs);

module.exports = router;
