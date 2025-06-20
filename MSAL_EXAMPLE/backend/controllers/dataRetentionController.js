const { Survey, Response, Answer } = require('../models');
const auditService = require('../services/auditService');
const { Op } = require('sequelize');

/**
 * Archive a survey
 */
exports.archiveSurvey = async (req, res) => {
    try {
        const { id } = req.params;
        const survey = await Survey.findByPk(id);
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Only admins can archive surveys
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to archive surveys' });
        }
        
        // Update survey status
        await survey.update({
            isArchived: true,
            archivedAt: new Date(),
            archivedBy: req.user.id,
            status: 'archived'
        });
        
        // Log the action
        await auditService.logAction({
            userId: req.user.id,
            action: 'archive',
            entityType: 'survey',
            entityId: survey.id,
            details: { surveyTitle: survey.title },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        res.json({ 
            message: 'Survey archived successfully',
            survey
        });
    } catch (err) {
        console.error('Error archiving survey:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Restore an archived survey
 */
exports.restoreSurvey = async (req, res) => {
    try {
        const { id } = req.params;
        const survey = await Survey.findByPk(id);
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Only admins can restore surveys
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to restore surveys' });
        }
        
        // Check if survey is archived
        if (!survey.isArchived) {
            return res.status(400).json({ message: 'Survey is not archived' });
        }
        
        // Update survey status
        await survey.update({
            isArchived: false,
            archivedAt: null,
            archivedBy: null,
            // Restore previous status or set to closed if it was active
            status: survey.status === 'archived' ? 'closed' : survey.status
        });
        
        // Log the action
        await auditService.logAction({
            userId: req.user.id,
            action: 'restore',
            entityType: 'survey',
            entityId: survey.id,
            details: { surveyTitle: survey.title },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        res.json({ 
            message: 'Survey restored successfully',
            survey
        });
    } catch (err) {
        console.error('Error restoring survey:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Permanently delete a survey and its responses
 */
exports.purgeSurvey = async (req, res) => {
    try {
        const { id } = req.params;
        const survey = await Survey.findByPk(id);
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Only super admins can permanently delete surveys
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to permanently delete surveys' });
        }
        
        // Get all responses for this survey
        const responses = await Response.findAll({
            where: { surveyId: id }
        });
        
        // Delete all answers for each response
        for (const response of responses) {
            await Answer.destroy({
                where: { responseId: response.id }
            });
        }
        
        // Delete all responses
        await Response.destroy({
            where: { surveyId: id }
        });
        
        // Log the action before deleting the survey
        await auditService.logAction({
            userId: req.user.id,
            action: 'purge',
            entityType: 'survey',
            entityId: survey.id,
            details: { 
                surveyTitle: survey.title,
                responsesDeleted: responses.length
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        // Delete the survey
        await survey.destroy();
        
        res.json({ 
            message: 'Survey and all associated data permanently deleted',
            surveyId: id
        });
    } catch (err) {
        console.error('Error purging survey:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get archived surveys
 */
exports.getArchivedSurveys = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Only admins can view archived surveys
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view archived surveys' });
        }
        
        const { count, rows } = await Survey.findAndCountAll({
            where: { 
                isArchived: true,
                userId: req.user.id
            },
            limit,
            offset,
            order: [['archivedAt', 'DESC']]
        });
        
        res.json({
            total: count,
            page,
            limit,
            surveys: rows
        });
    } catch (err) {
        console.error('Error getting archived surveys:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Set retention period for a survey
 */
exports.setRetentionPeriod = async (req, res) => {
    try {
        const { id } = req.params;
        const { retentionEndDate } = req.body;
        
        if (!retentionEndDate) {
            return res.status(400).json({ message: 'Retention end date is required' });
        }
        
        const survey = await Survey.findByPk(id);
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Only admins can set retention periods
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to set retention periods' });
        }
        
        // Update retention end date
        await survey.update({
            retentionEndDate: new Date(retentionEndDate)
        });
        
        // Log the action
        await auditService.logAction({
            userId: req.user.id,
            action: 'set_retention',
            entityType: 'survey',
            entityId: survey.id,
            details: { 
                surveyTitle: survey.title,
                retentionEndDate
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        res.json({ 
            message: 'Retention period set successfully',
            survey
        });
    } catch (err) {
        console.error('Error setting retention period:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get audit logs for a survey
 */
exports.getSurveyAuditLogs = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if survey exists
        const survey = await Survey.findByPk(id);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Only admins can view audit logs
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view audit logs' });
        }
        
        // Get audit logs for this survey
        const logs = await auditService.getEntityLogs('survey', id);
        
        res.json(logs);
    } catch (err) {
        console.error('Error getting survey audit logs:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get all audit logs (admin only)
 */
exports.getAllAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Only admins can view all audit logs
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view all audit logs' });
        }
        
        const result = await auditService.getAllLogs(page, limit);
        
        res.json(result);
    } catch (err) {
        console.error('Error getting all audit logs:', err);
        res.status(500).json({ error: err.message });
    }
};
