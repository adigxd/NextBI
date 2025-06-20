import { Request, Response } from 'express';
import { Tile, Dashboard, Folder, ProjectUser } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all tiles in a dashboard
 */
export const getDashboardTiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.params;
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
      });
      return;
    }
    
    // Check if user has access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have access to this dashboard'
      });
      return;
    }
    
    // Get tiles
    const tiles = await Tile.findAll({
      where: {
        dashboardId
      }
    });
    
    res.status(200).json({
      success: true,
      data: tiles
    });
    
  } catch (error) {
    logger.error('Get dashboard tiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard tiles'
    });
  }
};

/**
 * Create a new tile on a dashboard
 */
export const createTile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.body;
    const { 
      title, 
      type, 
      chartType, 
      content, 
      position, 
      styling, 
      dataModelId 
    } = req.body;
    
    if (!title || !type || !dashboardId) {
      res.status(400).json({
        success: false,
        message: 'Title, type, and dashboardId are required'
      });
      return;
    }
    
    // Validate tile type
    if (!['chart', 'text', 'kpi'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Tile type must be chart, text, or kpi'
      });
      return;
    }
    
    // Validate chart type if tile is a chart
    if (type === 'chart' && (!chartType || !['bar', 'line', 'pie', 'donut'].includes(chartType))) {
      res.status(400).json({
        success: false,
        message: 'Chart type must be bar, line, pie, or donut'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
      });
      return;
    }
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to add tiles to this dashboard'
      });
      return;
    }
    
    // Create tile
    const tile = await Tile.create({
      id: uuidv4(),
      title,
      type,
      chartType: type === 'chart' ? chartType : null,
      content: content || {},
      position: position || { x: 0, y: 0, w: 6, h: 6 },
      styling: styling || { 
        backgroundColor: '#ffffff', 
        textColor: '#333333',
        chartColors: ['#40c0a0', '#2060e0', '#e04060']
      },
      dataModelId: dataModelId || null,
      dashboardId
    });
    
    res.status(201).json({
      success: true,
      data: tile
    });
    
  } catch (error) {
    logger.error('Create tile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tile'
    });
  }
};

/**
 * Get a tile by ID
 */
export const getTileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    
    const tile = await Tile.findByPk(tileId);
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
      });
      return;
    }
    
    // Check if user has access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have access to this tile'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: tile
    });
    
  } catch (error) {
    logger.error('Get tile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tile'
    });
  }
};

/**
 * Update tile
 */
export const updateTile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    const { 
      title, 
      content, 
      position, 
      styling, 
      dataModelId 
    } = req.body;
    
    const tile = await Tile.findByPk(tileId);
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
      });
      return;
    }
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to update this tile'
      });
      return;
    }
    
    // Update tile
    if (title !== undefined) tile.title = title;
    if (content !== undefined) tile.content = content;
    if (position !== undefined) tile.position = position;
    if (styling !== undefined) tile.styling = styling;
    if (dataModelId !== undefined) tile.dataModelId = dataModelId;
    
    // Save changes
    await tile.save();
    
    res.status(200).json({
      success: true,
      data: tile
    });
    
  } catch (error) {
    logger.error('Update tile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tile'
    });
  }
};

/**
 * Update tile position
 */
export const updateTilePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    const { position } = req.body;
    
    if (!position) {
      res.status(400).json({
        success: false,
        message: 'Position data is required'
      });
      return;
    }
    
    const tile = await Tile.findByPk(tileId);
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
      });
      return;
    }
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to update this tile'
      });
      return;
    }
    
    // Update tile position
    tile.position = position;
    
    // Save changes
    await tile.save();
    
    res.status(200).json({
      success: true,
      message: 'Tile position updated successfully'
    });
    
  } catch (error) {
    logger.error('Update tile position error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tile position'
    });
  }
};

/**
 * Delete tile
 */
export const deleteTile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    
    const tile = await Tile.findByPk(tileId);
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
      });
      return;
    }
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to delete this tile'
      });
      return;
    }
    
    // Delete tile
    await tile.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Tile deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete tile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tile'
    });
  }
};
