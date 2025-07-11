import React, { useState, useEffect, useMemo } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import {
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Box,
  CircularProgress,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from 'react-grid-layout';
import { useAuth } from '../context/AuthContext';
import { projectService, Tile as BackendTile } from '../services/projectService';
import { queryService, QueryResult } from '../services/queryService';

// Define the ServiceTile interface to match backend response
interface ServiceTileType {
  id: string;
  title: string; // Changed from 'name' to 'title' to match backend response
  description?: string;
  type: 'Table' | 'Text & Query'; // Updated to match frontend types
  dashboardId: string;
  connectionId?: string;
  dataModelId?: string;
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  content?: any;
  config?: any;
  textRows?: TextRow[];
  createdAt?: string;
  updatedAt?: string;
}

import { databaseConnectionService, DatabaseConnection } from '../services/databaseConnectionService';

import TileEditor from '../components/Tiles/TileEditor';
import { hasProjectPermission } from '../services/userService';
import QueryResultViewer from '../components/QueryResult/QueryResultViewer';

// Define the TextRow interface
interface TextRow {
  id?: string;
  tileId?: string;
  type: 'header' | 'subheader' | 'text';
  content: string;
  isQuery: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Define the TileData interface for the TileEditor component
interface TileData {
  id: string;
  title: string;
  description?: string;
  type: 'Table' | 'Text & Query';
  dashboardId: string;
  connectionId: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: any;
  content?: {
    textRows?: TextRow[];
    tableConfig?: {
      selectedTable: string;
      columns: string[];
    };
  };
}

// Define the Tile interface for our frontend
interface Tile {
  id: string;
  title: string; // Changed from 'name' to 'title' to match backend response
  description?: string;
  type: 'Table' | 'Text & Query'; // Frontend types
  dashboardId: string;
  connectionId?: string;
  // Position is now required for dragging functionality
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: any;
  content?: {
    textRows?: TextRow[];
    tableConfig?: {
      selectedTable: string;
      columns: string[];
    };
  };
  textRows?: TextRow[];
  createdAt?: string;
  updatedAt?: string;
}

// Common wrapper for converting backend tile data to frontend format
const convertToTileData = (tile: BackendTile | any): Tile => {
  console.log('[DEBUG] convertToTileData - Raw tile data received:', JSON.stringify(tile, null, 2));
  
  // Extract textRows from where they may be found
  let textRows: any[] = [];
  let frontendType = tile.type;
  
  // Parse the text rows from wherever they might be
  if (tile.type === 'Text & Query') {
    console.log('[DEBUG] This is a Text & Query tile'); 
    
    // Try to find textRows in all possible locations
    if (tile.textRows && Array.isArray(tile.textRows)) {
      console.log('[DEBUG] Found textRows directly in tile.textRows:', tile.textRows);
      textRows = tile.textRows.map((row: any) => ({
        id: row.id || '',
        tileId: row.tileId || tile.id, // Ensure tileId is set
        type: row.type || 'text',
        content: row.content || row.text || '', // Support both content and text properties
        isQuery: !!row.isQuery
      }));
    } else if (tile.content?.textRows && Array.isArray(tile.content.textRows)) {
      console.log('[DEBUG] Found textRows in tile.content.textRows:', tile.content.textRows);
      textRows = tile.content.textRows.map((row: any) => ({
        id: row.id || '',
        tileId: row.tileId || tile.id,
        type: row.type || 'text',
        content: row.content || row.text || '',
        isQuery: !!row.isQuery
      }));
    } else if (tile.config?.textRows && Array.isArray(tile.config.textRows)) {
      console.log('[DEBUG] Found textRows in tile.config.textRows:', tile.config.textRows);
      textRows = tile.config.textRows.map((row: any) => ({
        id: row.id || '',
        tileId: row.tileId || tile.id,
        type: row.type || 'text',
        content: row.content || row.text || '',
        isQuery: !!row.isQuery
      }));
    } else {
      console.log('[DEBUG] No textRows found in any expected location');
    }
    
    // Additional debug logging
    console.log('[DEBUG] Final textRows after extraction:', JSON.stringify(textRows, null, 2));
  }

  const result: Tile = {
    id: tile.id,
    title: tile.title || tile.name || '', // Support both title and name for backward compatibility
    type: frontendType,
    description: tile.description || '',
    content: {
      textRows: textRows.length > 0 ? textRows : undefined,
      tableConfig: frontendType === 'Table' ? {
        selectedTable: tile.config?.tableConfig?.selectedTable || '',
        columns: tile.config?.tableConfig?.columns || []
      } : undefined
    },
    dashboardId: tile.dashboardId || '',
    connectionId: tile.connectionId,
    position: tile.position || { x: 0, y: 0, w: 6, h: 6 },
    config: tile.config || {}
  };
  
  // Always ensure textRows are available at both locations for consistent access
  if (result.type === 'Text & Query') {
    // Make sure textRows are accessible at the root level for the editor
    result.textRows = textRows.length > 0 ? textRows : [];
    
    // And ensure they're in the content object for rendering
    if (!result.content) result.content = {};
    result.content.textRows = textRows.length > 0 ? textRows : [];
  }
  
  console.log('[DEBUG] convertToTileData - Converted tile data:', JSON.stringify(result, null, 2));
  return result;
}

export const Tiles: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, folderId, dashboardId } = useParams();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [project, setProject] = useState<any>(null);
  const [folder, setFolder] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTileEditor, setOpenTileEditor] = useState(false);
  const [editingTile, setEditingTile] = useState<TileData | null>(null);

  // New tile form state
  const [tileName, setTileName] = useState('');
  const [tileDescription, setTileDescription] = useState('');
  const [selectedTileType, setSelectedTileType] = useState<'Table' | 'Text & Query'>('Table');
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [availableConnections, setAvailableConnections] = useState<DatabaseConnection[]>([]);
  
  // These states are declared but not used (keeping for compatibility)
  const [selectedConnection, setSelectedConnection] = useState('');
  const [newTileType, setNewTileType] = useState<'Table' | 'Text & Query'>('Table');
  const [newTileTitle, setNewTileTitle] = useState('');
  const [formErrors, setFormErrors] = useState<any>({});

  // Query execution state
  const [queryResults, setQueryResults] = useState<{[rowId: string]: {result?: QueryResult, loading: boolean, error?: string}}>({});

  // Execute a query for a specific text row
  const executeQuery = async (tile: Tile, row: TextRow) => {
    // Skip if no query content or not marked as a query
    if (!row.content?.trim() || !row.isQuery || !tile.connectionId) {
      return;
    }
    
    const rowId = row.id || '';
    
    // Set loading state for this query
    setQueryResults(prev => ({
      ...prev,
      [rowId]: { loading: true }
    }));
    
    try {
      // Execute the query using the queryService
      console.log(`[QUERY] Executing query for tile ${tile.id}, row ${rowId}:`, row.content);
      const result = await queryService.executeQuery(tile.connectionId, row.content);
      
      // Store the results
      setQueryResults(prev => ({
        ...prev,
        [rowId]: { result, loading: false, error: undefined }
      }));
      console.log(`[QUERY] Query results for ${rowId}:`, result);
    } catch (error) {
      console.error(`[QUERY] Error executing query for ${rowId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Store the error
      setQueryResults(prev => ({
        ...prev,
        [rowId]: { loading: false, error: errorMessage }
      }));
    }
  };
  
  // Note: We're using inline query execution in the useEffect hook,
  // so this function has been removed to fix lint warnings

  // Access control
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [collapsedTiles, setCollapsedTiles] = useState<{[key: string]: boolean}>({});

  // All tiles are now expanded by default
  // We track collapsed tiles instead of expanded ones
  const [collapsedTileIds, setCollapsedTileIds] = useState<string[]>([]);
  
  // State for grid layout
  const [layouts, setLayouts] = useState<Layout[]>([]);
  
  // State for hover effects - currently used only in rendering conditions
  const hoveredTileId = null;

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Note: openTileEditor and editingTile are already declared at the top of the component
  // Removed duplicate declaration

  // Toggle collapsed state for a tile
  const handleTileClick = (tile: Tile): void => {
    // Toggle collapsed state for the clicked tile
    setCollapsedTileIds(prevState => {
      if (prevState.includes(tile.id)) {
        return prevState.filter(id => id !== tile.id);
      } else {
        return [...prevState, tile.id];
      }
    });
  };

  const handleEditTile = (tile: Tile) => {
    console.log('%c[DEBUG] EDIT BUTTON CLICKED', 'background: #ffcc00; color: black; font-size: 14px; font-weight: bold;');
    console.log('[DEBUG] handleEditTile - Original tile data:', JSON.stringify(tile, null, 2));
  
    try {
      const convertedTile = convertToTileData(tile as unknown as ServiceTileType);
      console.log('[DEBUG] handleEditTile - Converted tile data for editor:', JSON.stringify(convertedTile, null, 2));
      
      // Convert to TileData format with required fields
      const editorTile: TileData = {
        ...convertedTile,
        connectionId: convertedTile.connectionId || '',
        config: convertedTile.config || {}
      };
      
      console.log('[DEBUG] handleEditTile - Setting editingTile:', editorTile);
      setEditingTile(editorTile);
      console.log('[DEBUG] handleEditTile - Setting openTileEditor to true');
      setOpenTileEditor(true);
      console.log('[DEBUG] handleEditTile - Function completed successfully');
    } catch (error) {
      console.error('[ERROR] Error in handleEditTile:', error);
    }
  };

  const handleDeleteTile = async (tile: Tile): Promise<void> => {
    console.log('%c[DEBUG] DELETE BUTTON CLICKED', 'background: #ff6347; color: white; font-size: 14px; font-weight: bold;');
    console.log('[DEBUG] handleDeleteTile - Tile data:', JSON.stringify(tile, null, 2));

    try {
      const confirmResult = window.confirm(`Are you sure you want to delete the tile "${tile.title || 'Untitled'}"?`);
      console.log('[DEBUG] handleDeleteTile - Confirm result:', confirmResult);
      
      if (!confirmResult) {
        console.log('[DEBUG] handleDeleteTile - User cancelled deletion');
        return;
      }

      console.log('[DEBUG] handleDeleteTile - Deleting tile with ID:', tile.id);
      await projectService.deleteTile(tile.id);
      console.log('[DEBUG] handleDeleteTile - Backend deletion successful');

      console.log('[DEBUG] handleDeleteTile - Updating tiles state to remove deleted tile');
      setTiles(prev => {
        const newTiles = prev.filter(t => t.id !== tile.id);
        console.log('[DEBUG] handleDeleteTile - New tiles count:', newTiles.length);
        return newTiles;
      });

      setError(null);
      console.log('[DEBUG] handleDeleteTile - Deletion completed successfully');
    } catch (error) {
      console.error('[ERROR] Error in handleDeleteTile:', error);
      setError(`Failed to delete tile: ${(error as Error).message}`);
    }
  };

  // Handle layout changes when tiles are dragged or resized
  const handleLayoutChange = (newLayout: Layout[]): void => {
    console.log('[DEBUG] Layout changed:', JSON.stringify(newLayout, null, 2));
    
    // Make sure minimum size constraints are preserved
    const constrainedLayout = newLayout.map(layoutItem => {
      // Get the tile corresponding to this layout item
      const tile = tiles.find(t => t.id === layoutItem.i);
      if (tile) {
        // Apply minimum sizes based on tile type
        let minW = 4; // Default minimum width
        let minH = 6; // Default minimum height
        
        // Text & Query tiles with content need more space
        if (tile.type === 'Text & Query' && tile.content?.textRows) {
          minH = Math.max(6, Math.min(12, 4 + tile.content.textRows.length));
        }
        
        // Table tiles need more width
        if (tile.type === 'Table') {
          minW = 6;
        }
        
        // Ensure layout respects minimum sizes
        return {
          ...layoutItem,
          w: Math.max(layoutItem.w, minW),
          h: Math.max(layoutItem.h, minH),
          minW,
          minH
        };
      }
      return layoutItem;
    });
    
    setLayouts(constrainedLayout);
    
    // Update the tile positions in state
    const updatedTiles = tiles.map(tile => {
      const layoutItem = constrainedLayout.find(item => item.i === tile.id);
      if (layoutItem) {
        return {
          ...tile,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return tile;
    });
    
    setTiles(updatedTiles);
    
    // Save the updated layouts to backend (debounced or throttled in a real app)
    // This just updates the position in memory - a real implementation would persist to backend
  };

  // Helper function to render the appropriate icon for each tile type
  const getTileIcon = (type: 'Table' | 'Text & Query'): React.ReactNode => {
    switch (type) {
      case 'Table':
        return <TableChartIcon />;
      case 'Text & Query':
        return <TextFieldsIcon />;
      default:
        return <TableChartIcon />;
    }
  };

  // We need to handle adding new tiles
  const handleAddTile = async () => {
    if (!tileName.trim()) return;
    
    try {
      const newTile = {
        title: tileName,
        description: tileDescription,
        type: selectedTileType,
        dashboardId: dashboardId || '',
        connectionId: selectedConnectionId,
        position: {
          x: 0,
          y: 0,
          w: selectedTileType === 'Table' ? 6 : 4,
          h: 6
        }
      };

      // Create the tile via API
      const createdTile = await projectService.createTile(newTile);
      
      // Convert to frontend format and add to state
      const frontendTile = convertToTileData(createdTile);
      setTiles(prev => [...prev, frontendTile]);
      
      // Update layouts
      setLayouts(prev => [...prev, {
        i: frontendTile.id,
        x: frontendTile.position.x,
        y: frontendTile.position.y,
        w: frontendTile.position.w,
        h: frontendTile.position.h,
        minW: frontendTile.type === 'Table' ? 6 : 4,
        minH: 6
      }]);
      
      // Close dialog and reset form
      setOpenDialog(false);
      setTileName('');
      setTileDescription('');
      
    } catch (error) {
      console.error('Error creating tile:', error);
      setError(`Failed to create tile: ${(error as Error).message}`);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!projectId || !folderId || !dashboardId) {
        console.log('[INFO] Missing required parameters:', { projectId, folderId, dashboardId });
        setError('Missing required parameters. Please make sure project, folder and dashboard IDs are provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Only use this as fallback if needed - DISABLED for now
        if (false) {
          console.log('[DEV] Using mock data due to missing parameters');
          // Create mock data and return
          setProject({ id: 'mock-project', name: 'Mock Project', description: 'Mock project for testing' });
          setFolder({ id: 'mock-folder', name: 'Mock Folder', description: 'Mock folder for testing', projectId: 'mock-project' });
          setDashboard({ id: 'mock-dashboard', name: 'Mock Dashboard', description: 'Mock dashboard for testing', folderId: 'mock-folder' });
          setTiles([]);
          setHasEditPermission(true);
          
          // Create mock database connections so they appear in the dropdown
          setAvailableConnections([
            { 
              id: 'mock-conn-1', 
              name: 'Mock MySQL Connection',
              type: 'mysql',
              host: 'localhost',
              port: 3306,
              database: 'mock_db',
              username: 'user',
              status: 'active',
              createdAt: new Date().toISOString()
            },
            { 
              id: 'mock-conn-2', 
              name: 'Mock PostgreSQL Connection',
              type: 'postgres',
              host: 'localhost',
              port: 5432,
              database: 'mock_db',
              username: 'user',
              status: 'active',
              createdAt: new Date().toISOString()
            }
          ]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Load project, folder and dashboard data
        console.log('[INFO] Loading data for project:', projectId, 'folder:', folderId, 'dashboard:', dashboardId);
        const projectData = await projectService.getProjectById(projectId);
        console.log('[DEBUG] Project data loaded:', projectData);
        
        const folderData = await projectService.getFolderById(folderId);
        console.log('[DEBUG] Folder data loaded:', folderData);
        
        const dashboardData = await projectService.getDashboardById(dashboardId);
        console.log('[DEBUG] Dashboard data loaded:', dashboardData);
        
        // Check if user has edit permission
        const hasEditAccess = await hasProjectPermission(projectId, 'edit');
        
        // Load database connections for the tile editor
        const connections = await databaseConnectionService.getAllConnections();
        console.log('[DEBUG] Loaded database connections:', connections);
        
        // Set the database connections for later use
        // Already updated in the later code
        
        // Load tiles for this dashboard
        const dashboardTiles = await projectService.getTilesByDashboardId(dashboardId);
        console.log('[DEBUG] Loaded tiles:', dashboardTiles);
        
        // Convert backend tiles to frontend format
        const frontendTiles = dashboardTiles.map(tile => convertToTileData(tile));
        console.log('[DEBUG] Converted tiles:', frontendTiles);
        
        // We've removed the unused extractedLayouts declaration
        // since we're not using GridLayout's layout property in this component
        
        // Update state with all the loaded data
        setProject(projectData);
        setDashboard(dashboardData);
        setTiles(frontendTiles);
        setHasEditPermission(hasEditAccess);
        setConnections(connections);
        setError(null);
        
        // Execute queries for all Text & Query tiles after setting state
        console.log('[INFO] Starting query execution for all Text & Query tiles');
        frontendTiles.forEach(tile => {
          if (tile.type === 'Text & Query' && tile.textRows && tile.connectionId) {
            const queryRows = tile.textRows.filter(row => row.isQuery && row.content?.trim());
            if (queryRows.length > 0) {
              console.log(`[INFO] Found ${queryRows.length} queries in tile ${tile.id}, executing...`);
              // Execute each query in the tile
              queryRows.forEach(row => executeQuery(tile, row));
            }
          }
        });
        
        // DISABLED mock data
        if (false) {
          console.log('[DEV] Using mock data due to error');
          // Create mock data
          setProject({ id: 'mock-project', name: 'Mock Project', description: 'Mock project for testing' });
          setFolder({ id: 'mock-folder', name: 'Mock Folder', description: 'Mock folder for testing', projectId: 'mock-project' });
          setDashboard({ id: 'mock-dashboard', name: 'Mock Dashboard', description: 'Mock dashboard for testing', folderId: 'mock-folder' });
          setTiles([]);
          setHasEditPermission(true);
          
          // Create mock database connections
          setConnections([
            { 
              id: 'mock-conn-1', 
              name: 'Mock MySQL Connection',
              type: 'mysql',
              host: 'localhost',
              port: 3306,
              database: 'mock_db',
              username: 'user',
              status: 'active',
              createdAt: new Date().toISOString()
            },
            { 
              id: 'mock-conn-2', 
              name: 'Mock PostgreSQL Connection',
              type: 'postgres',
              host: 'localhost',
              port: 5432,
              database: 'mock_db',
              username: 'user',
              status: 'active',
              createdAt: new Date().toISOString()
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [projectId, folderId, dashboardId]);

  // Render function
  return (
    <Box sx={{ padding: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <>
          {/* Dashboard header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              {dashboard?.name || 'Dashboard'}
            </Typography>
            {hasEditPermission && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  // Reset form fields
                  setTileName('');
                  setTileDescription('');
                  setSelectedTileType('Table');
                  setSelectedConnectionId('');
                  setOpenDialog(true);
                }}
              >
                Add Tile
              </Button>
            )}
          </Box>

          {/* Grid layout for tiles */}
          {/* Add Tile Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>Add New Tile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={tileName}
            onChange={(e) => setTileName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            value={tileDescription}
            onChange={(e) => setTileDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Type"
            fullWidth
            value={selectedTileType}
            onChange={(e) => setSelectedTileType(e.target.value as 'Table' | 'Text & Query')}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Table">Table</MenuItem>
            <MenuItem value="Text & Query">Text & Query</MenuItem>
          </TextField>
          
          <TextField
            select
            margin="dense"
            label="Database Connection"
            fullWidth
            value={selectedConnectionId}
            onChange={(e) => setSelectedConnectionId(e.target.value)}
            required={selectedTileType === 'Table'}
          >
            {connections.map((conn) => (
              <MenuItem key={conn.id} value={conn.id}>
                {conn.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddTile}
            disabled={!tileName.trim() || (selectedTileType === 'Table' && !selectedConnectionId)}
          >
            Add Tile
          </Button>
        </DialogActions>
      </Dialog>

      {tiles.length > 0 ? (
            <GridLayout
              className="layout"
              layout={layouts}
              cols={12}
              rowHeight={30}
              width={1200}
              onLayoutChange={handleLayoutChange}
              isDraggable={hasEditPermission}
              isResizable={hasEditPermission}
              draggableHandle=".tile-drag-handle"
              draggableCancel=".tile-actions, .tile-actions *, .MuiIconButton-root"
            >
              {tiles.map((tile) => (
                <div key={tile.id} style={{ overflow: 'hidden' }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      '&:hover .tile-actions': { opacity: 1 },
                      overflow: 'visible', // Make sure the buttons aren't clipped
                      border: '1px solid #ccc', // Add visible border for debugging
                      '& *': { pointerEvents: 'auto' } // Enable pointer events for all children
                    }}
                  >
                    <CardContent
                      className="tile-drag-handle"
                      onClick={(e) => {
                        console.log('[DEBUG] CardContent clicked', e.currentTarget);
                      }}
                      sx={{
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: hasEditPermission ? 'move' : 'default',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        position: 'relative' // Add position context
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTileIcon(tile.type)}
                        <Typography variant="subtitle1" sx={{ ml: 1 }}>
                          {tile.title || 'Untitled'}
                        </Typography>
                      </Box>
                      
                      {hasEditPermission && (
                        <Box 
                          className="tile-actions" 
                          onClick={(e) => {
                            console.log('[DEBUG] Tile actions Box clicked', e.currentTarget);
                          }}
                          sx={{ 
                            opacity: { xs: 1, sm: 1 }, // Always visible for debugging
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 1 },
                            display: 'flex',
                            gap: 1,
                            position: 'absolute', // Use absolute positioning to ensure it's on top
                            top: 4,
                            right: 4,
                            zIndex: 100, // Very high z-index to ensure visibility
                            pointerEvents: 'auto' // Explicitly enable pointer events
                          }}>
                          <IconButton 
                            size="small" 
                            id={`edit-btn-${tile.id}`}
                            onClick={(e) => {
                              console.log('%c[EVENT] Edit IconButton clicked', 'background: #4CAF50; color: white;');
                              console.log('[EVENT] Event details:', e.type, e.currentTarget);
                              e.preventDefault(); // Prevent default behavior
                              e.stopPropagation(); // Prevent card click
                              // Add a timeout to see if there's something stopping immediate execution
                              setTimeout(() => {
                                console.log('[EVENT] Inside setTimeout for edit button');
                                handleEditTile(tile);
                              }, 0);
                            }}
                            sx={{ 
                              bgcolor: 'rgba(0,0,0,0.04)', 
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
                              zIndex: 50, // Higher z-index to ensure button is clickable
                              position: 'relative',
                              pointerEvents: 'auto' // Explicitly enable pointer events
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            id={`delete-btn-${tile.id}`}
                            onClick={(e) => {
                              console.log('%c[EVENT] Delete IconButton clicked', 'background: #f44336; color: white;');
                              console.log('[EVENT] Event details:', e.type, e.currentTarget);
                              e.preventDefault(); // Prevent default behavior
                              e.stopPropagation(); // Prevent card click
                              // Add a timeout to see if there's something stopping immediate execution
                              setTimeout(() => {
                                console.log('[EVENT] Inside setTimeout for delete button');
                                handleDeleteTile(tile);
                              }, 0);
                            }}
                            sx={{ 
                              bgcolor: 'rgba(0,0,0,0.04)', 
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
                              zIndex: 50, // Higher z-index to ensure button is clickable
                              position: 'relative',
                              pointerEvents: 'auto' // Explicitly enable pointer events
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </CardContent>
                    
                    <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                      {/* Render tile content based on type */}
                      {tile.type === 'Table' && (
                        <TableContainer component={Paper} sx={{ height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            Table content would be rendered here
                          </Typography>
                        </TableContainer>
                      )}
                      
                      {tile.type === 'Text & Query' && (
                        <Box sx={{ height: '100%', overflow: 'auto' }}>
                          {tile.textRows?.map((row, idx) => (
                            <Box key={row.id || idx} sx={{ mb: 2 }}>
                              {row.type === 'header' && (
                                <Typography variant="h5">{row.content}</Typography>
                              )}
                              {row.type === 'subheader' && (
                                <Typography variant="h6">{row.content}</Typography>
                              )}
                              {row.type === 'text' && (
                                <Typography variant="body1">
                                  {row.isQuery ? (
                                    <Box sx={{ width: '100%' }}>
                                      {/* Show query content in monospace */}
                                      <Box component="div" sx={{ 
                                        fontFamily: 'monospace', 
                                        bgcolor: 'action.hover', 
                                        p: 0.5, 
                                        borderRadius: 1,
                                        mb: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}>
                                        <span>{row.content}</span>
                                        {hasEditPermission && (
                                          <Tooltip title="Refresh query results">
                                            <IconButton 
                                              size="small" 
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                executeQuery(tile, row);
                                              }}
                                            >
                                              <RefreshIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </Box>
                                      
                                      {/* Render query results */}
                                      {row.id && queryResults[row.id] ? (
                                        <QueryResultViewer
                                          result={queryResults[row.id].result}
                                          loading={queryResults[row.id].loading}
                                          error={queryResults[row.id].error}
                                        />
                                      ) : (
                                        <Box 
                                          sx={{ 
                                            p: 1, 
                                            borderRadius: 1, 
                                            bgcolor: 'background.paper',
                                            border: '1px dashed',
                                            borderColor: 'divider' 
                                          }}
                                        >
                                          <Typography variant="body2" color="text.secondary">
                                            Query results will appear here
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  ) : (
                                    row.content
                                  )}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </GridLayout>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '50vh',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Tiles Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add tiles to build your dashboard.
              </Typography>
              {hasEditPermission && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  Add First Tile
                </Button>
              )}
            </Paper>
          )}
        </>
      )}
      
      {/* Tile Editor Dialog */}
      {openTileEditor && editingTile && (
        <TileEditor
          tile={editingTile as any}
          dashboardId={dashboardId || ''}
          open={openTileEditor}
          onClose={() => setOpenTileEditor(false)}
          onSave={async (updatedTile) => {
            try {
              // Save the updated tile to the backend
              await projectService.updateTile(updatedTile.id, updatedTile);
              
              // Refresh the tiles list
              const updatedTiles = await projectService.getTilesByDashboardId(dashboardId || '');
              const frontendTiles = updatedTiles.map((tile: any) => convertToTileData(tile));
              setTiles(frontendTiles);
              
              // Close the editor
              setOpenTileEditor(false);
              setError(null);
            } catch (error) {
              console.error('[ERROR] Error updating tile:', error);
              setError('Failed to update tile');
            }
          }}
        />
      )}
    </Box>
  );
};

export default Tiles;
