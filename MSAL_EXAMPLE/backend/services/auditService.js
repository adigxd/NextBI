const { AuditLog } = require('../models');

/**
 * Service for logging admin actions for audit purposes
 */
class AuditService {
  /**
   * Log an action performed by a user
   * @param {Object} data - The audit log data
   * @param {number} data.userId - The ID of the user who performed the action
   * @param {string} data.action - The action performed (e.g., 'create', 'update', 'delete', 'archive')
   * @param {string} data.entityType - The type of entity affected (e.g., 'survey', 'user')
   * @param {number} data.entityId - The ID of the entity affected
   * @param {Object} data.details - Additional details about the action
   * @param {string} data.ipAddress - The IP address of the user
   * @param {string} data.userAgent - The user agent of the user's browser
   * @returns {Promise<Object>} The created audit log entry
   */
  static async logAction(data) {
    try {
      return await AuditLog.create(data);
    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't throw the error, as we don't want to interrupt the main flow
      // if audit logging fails
      return null;
    }
  }

  /**
   * Get audit logs for a specific entity
   * @param {string} entityType - The type of entity
   * @param {number} entityId - The ID of the entity
   * @returns {Promise<Array>} Array of audit logs
   */
  static async getEntityLogs(entityType, entityId) {
    return await AuditLog.findAll({
      where: { entityType, entityId },
      order: [['createdAt', 'DESC']],
      include: [{ association: 'user', attributes: ['id', 'username', 'email'] }]
    });
  }

  /**
   * Get audit logs for a specific user
   * @param {number} userId - The ID of the user
   * @returns {Promise<Array>} Array of audit logs
   */
  static async getUserLogs(userId) {
    return await AuditLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get all audit logs with pagination
   * @param {number} page - The page number
   * @param {number} limit - The number of logs per page
   * @returns {Promise<Object>} Object containing logs and pagination info
   */
  static async getAllLogs(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await AuditLog.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [{ association: 'user', attributes: ['id', 'username', 'email'] }]
    });
    
    return {
      logs: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = AuditService;
