import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
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
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';

import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService, Tile as BackendTile } from '../services/projectService';

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

import TileEditor, { TileData } from '../components/Tiles/TileEditor';
import { hasProjectPermission } from '../services/userService';

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

// Define the Tile interface for our frontend
interface Tile {
  id: string;
  title: string; // Changed from 'name' to 'title' to match backend response
  description?: string;
  type: 'Table' | 'Text & Query'; // Frontend types
  dashboardId: string;
  connectionId?: string;
  position?: {
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
    if (tile.textRows && Array.isArray(tile.textRows)) {
      console.log('[DEBUG] Found textRows directly in tile.textRows:', tile.textRows);
      textRows = tile.textRows.map(row => ({
        id: row.id || '',
        type: row.type || 'text',
        content: row.content || '',
        isQuery: !!row.isQuery
      }));
    } else if (tile.content?.textRows && Array.isArray(tile.content.textRows)) {
      console.log('[DEBUG] Found textRows in tile.content.textRows:', tile.content.textRows);
      textRows = tile.content.textRows;
    } else if (tile.config?.textRows && Array.isArray(tile.config.textRows)) {
      console.log('[DEBUG] Found textRows in tile.config.textRows:', tile.config.textRows);
      textRows = tile.config.textRows;
    } else {
      console.log('[DEBUG] No textRows found in any expected location');
    }
  }

  const result: Tile = {
    id: tile.id,
    title: tile.title || tile.name || '', // Support both title and name for backward compatibility
    type: frontendType,
    content: {
      textRows,
      tableConfig: frontendType === 'Table' ? {
        selectedTable: tile.config?.tableConfig?.selectedTable || '',
        columns: tile.config?.tableConfig?.columns || []
      } : undefined
    },
    dashboardId: tile.dashboardId,
    connectionId: tile.connectionId || '', // Ensure connectionId is always a string
    position: tile.position || { x: 0, y: 0, w: 6, h: 4 }
  };
  
  console.log('[DEBUG] convertToTileData - Converted tile data:', JSON.stringify(result, null, 2));
  return result;
}

export const Tiles: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, folderId, dashboardId } = useParams<{ projectId: string; folderId: string; dashboardId: string }>();
  const { userData } = useAuth();

  // State for project data
  const [project, setProject] = useState<any>(null);
  const [folder, setFolder] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEditPermission, setHasEditPermission] = useState<boolean>(false);

  // Dialog states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [tileName, setTileName] = useState<string>('');
  const [tileDescription, setTileDescription] = useState<string>('');
  const [selectedTileType, setSelectedTileType] = useState<'Table' | 'Text & Query'>('Table');
  const [availableConnections, setAvailableConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');

  // Variables and functions below are no longer needed with inline visualization approach
  // Keeping the commented code for reference if we need to revert
  const [expandedTileId, setExpandedTileId] = useState<string | null>(null);
  
  // Track which tile is being hovered for action buttons
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [openTileEditor, setOpenTileEditor] = useState(false);
  const [editingTile, setEditingTile] = useState<TileData | null>(null);

  // Toggle expanded state for a tile to show its visualization
  const handleTileClick = (tile: Tile): void => {
    // Toggle expanded state for the clicked tile
    setExpandedTileId(expandedTileId === tile.id ? null : tile.id);
  };

  const handleEditTile = (tile: Tile) => {
    console.log('[DEBUG] handleEditTile - Original tile data:', JSON.stringify(tile, null, 2));
    const convertedTile = convertToTileData(tile as unknown as ServiceTileType);
    console.log('[DEBUG] handleEditTile - Converted tile data for editor:', JSON.stringify(convertedTile, null, 2));
    setEditingTile(convertedTile);
    setOpenTileEditor(true);
  };

  const handleDeleteTile = async (tile: Tile): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete the tile "${tile.title || 'Untitled'}"?`)) {
      return;
    }

    try {
      await projectService.deleteTile(tile.id);

      setTiles(prev => prev.filter(t => t.id !== tile.id));

      setError(null);
    } catch (error) {
      console.error('Error deleting tile:', error);

      setError(`Failed to delete tile: ${(error as Error).message}`);
    }
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

  const fetchData = async () => {
    if (!projectId || !folderId || !dashboardId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check if user has edit permission for this project
      const hasPermission = await hasProjectPermission(projectId, 'edit');
      setHasEditPermission(hasPermission);
      
      // Get project details
      const projectResponse = await projectService.getProjectById(projectId);
      setProject(projectResponse);
      
      // Get folder details
      const folderResponse = await projectService.getFolderById(folderId);
      setFolder(folderResponse);
      
      // Get dashboard details
      const dashboardResponse = await projectService.getDashboardById(dashboardId);
      setDashboard(dashboardResponse);
      
      // Get tiles for this dashboard
      const serviceTiles = await projectService.getTilesByDashboardId(dashboardId);
      console.log('[DEBUG] fetchData - Raw tiles from API:', JSON.stringify(serviceTiles, null, 2));
      
      // Process tiles for display
      if (serviceTiles && Array.isArray(serviceTiles)) {
        for (let i = 0; i < serviceTiles.length; i++) {
          console.log(`[DEBUG] Tile ${i} (${serviceTiles[i].id}) - type: ${serviceTiles[i].type}`);
          if (serviceTiles[i].textRows) {
            console.log(`[DEBUG] Tile ${i} textRows:`, JSON.stringify(serviceTiles[i].textRows, null, 2));
          }
        }
        
        // Convert service tiles to our frontend Tile format
        const frontendTiles: Tile[] = serviceTiles.map(serviceTile => {
          // Convert backend tile to our frontend format
          return convertToTileData(serviceTile);
        });
        
        setTiles(frontendTiles);
      }
      
      // Load database connections
      await loadDatabaseConnections();
      
      if (userData?.id) {
        const editPermission = await hasProjectPermission(projectId, 'edit');
        setHasEditPermission(editPermission);
      }
    } catch (err) {
      console.error('Error fetching dashboard tiles:', err);
      setError('Failed to load dashboard tiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, folderId, dashboardId, userData?.id]);

  const loadDatabaseConnections = async () => {
    if (!projectId) return;

    try {
      const connections = await databaseConnectionService.getConnectionsByProjectId(projectId);
      setAvailableConnections(connections);
    } catch (error) {
      console.error('Error loading database connections:', error);
      setError('Failed to load database connections');
    }
  };

  const handleOpenDialog = async (): Promise<void> => {
    try {
      await loadDatabaseConnections();
    } catch (error) {
      console.error('Error fetching database connections:', error);
      setError('Failed to load database connections');
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = (): void => {
    setOpenDialog(false);
    setTileName('');
    setTileDescription('');
    setSelectedTileType('Table');
    setSelectedConnectionId('');
  };

  const handleSaveTile = async (): Promise<void> => {
    if (!dashboardId || !tileName.trim()) return;

    try {
      if (!selectedConnectionId) {
        setError('Database connection is required for all tile types');
        return;
      }

      const tileData = {
        title: tileName.trim(),
        description: tileDescription.trim() || undefined,
        dashboardId,
        type: selectedTileType,
        position: { x: 0, y: 0, w: 6, h: 4 },
        connectionId: selectedConnectionId
      };

      if (selectedTileType === 'Table') {
        tileData.config = {
          tableConfig: {
            selectedTable: '',
            columns: []
          },
          uiType: 'table'
        };
      } else if (selectedTileType === 'Text & Query') {
        tileData.textRows = [];
      }

      const response: BackendTile = await projectService.createTile(tileData);

      // Convert backend tile to frontend format
      const updatedTile: Tile = convertToTileData(response);

      setTiles(prevTiles => [...prevTiles, updatedTile]);
      handleCloseDialog();
      setError(null);
    } catch (error) {
      console.error('Error creating tile:', error);
      setError('Failed to create tile');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar
        open={notification !== null}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message || ''}
        </Alert>
      </Snackbar>

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link color="inherit" href="/projects" onClick={(e) => { e.preventDefault(); navigate('/projects'); }}>
          Projects
        </Link>
        <Link
          color="inherit"
          href={`/projects/${projectId}`}
          onClick={(e) => { e.preventDefault(); navigate(`/projects/${projectId}`); }}
        >
          {project?.name || 'Project'}
        </Link>
        <Link
          color="inherit"
          href={`/projects/${projectId}/folders/${folderId}`}
          onClick={(e) => { e.preventDefault(); navigate(`/projects/${projectId}/folders/${folderId}`); }}
        >
          {folder?.name || 'Folder'}
        </Link>
        <Typography color="text.primary">{dashboard?.name || 'Dashboard'}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Tiles
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          disabled={!hasEditPermission}
        >
          Create Tile
        </Button>
      </Box>

      {tiles.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <TextFieldsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tiles yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a tile to visualize your data
          </Typography>
          {hasEditPermission && (
            <Grid container sx={{ mt: 3, mb: 6 }}>
              <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                >
                  Add Tile
                </Button>
                
                {/* No empty hidden elements needed */}
              </Grid>
            </Grid>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tiles.map((tile) => (
            <Grid item key={tile.id} xs={12} sm={6} md={expandedTileId === tile.id ? 12 : 4}>
              <Card
                elevation={expandedTileId === tile.id ? 3 : 1}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  border: expandedTileId === tile.id ? '1px solid' : 'none',
                  borderColor: 'primary.light'
                }}
                onClick={() => handleTileClick(tile)}
                onMouseEnter={() => setHoveredTileId(tile.id)}
                onMouseLeave={() => setHoveredTileId(null)}
              >
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  {/* Action buttons that appear on hover */}
                  {hoveredTileId === tile.id && hasEditPermission && (
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 1,
                        zIndex: 2
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTile(tile);
                        }}
                      >
                        <TextFieldsIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTile(tile);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {/* Tile Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ mr: 2 }}>
                      {/* This ensures getTileIcon is actually used */}
                      {getTileIcon(tile.type)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" noWrap title={tile.title}>
                        {tile.title || 'Untitled Tile'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {tile.description || ''}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Divider between header and content */}
                  {expandedTileId === tile.id && <Divider sx={{ my: 1 }} />}
                  
                  {/* Tile Content - shown when expanded */}
                  {expandedTileId === tile.id && (
                    <Box sx={{ mt: 2 }}>
                      {/* Text & Query Tile Content */}
                      {tile.type === 'Text & Query' && (tile.content?.textRows || tile.config?.textRows) && (
                        <Box>
                          {(tile.content?.textRows || tile.config?.textRows || []).map((row: any, idx: number) => (
                            <Box key={row.id || idx} sx={{ mb: 2 }}>
                              {!row.isQuery ? (
                                <>
                                  {row.type === 'header' && (
                                    <Typography variant="h4">{row.content || 'Header Text'}</Typography>
                                  )}
                                  {row.type === 'subheader' && (
                                    <Typography variant="h5">{row.content || 'Subheader Text'}</Typography>
                                  )}
                                  {row.type === 'text' && (
                                    <Typography variant="body1">{row.content || 'Regular Text'}</Typography>
                                  )}
                                </>
                              ) : (
                                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <CodeIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="subtitle2" color="primary">Query Result</Typography>
                                  </Box>
                                  <Typography variant="body2" component="pre" 
                                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                    {row.content ? row.content : 'No query defined'}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {/* Table Tile Content */}
                      {tile.type === 'Table' && tile.config?.tableConfig && (
                        <Box>
                          {tile.config.tableConfig.selectedTable && tile.config.tableConfig.columns && 
                           tile.config.tableConfig.columns.length > 0 ? (
                            <Box>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      {tile.config.tableConfig.columns.map((column: string) => (
                                        <TableCell key={column}>{column}</TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell colSpan={tile.config.tableConfig.columns.length} align="center">
                                        <Typography variant="body2" color="text.secondary">
                                          Data would display here when connected to the database
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                Table: <b>{tile.config.tableConfig.selectedTable}</b>
                              </Typography>
                            </Box>
                          ) : (
                            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                              No table or columns configured
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* No configuration yet */}
                      {!tile.config && (!tile.content?.textRows || tile.content.textRows.length === 0) && (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                          <Typography color="text.secondary" align="center">
                            This tile has no content configured
                          </Typography>
                          <Button 
                            size="small" 
                            sx={{ mt: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTile(tile);
                            }}
                          >
                            Configure Tile
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {/* Preview content when not expanded */}
                  {!expandedTileId || expandedTileId !== tile.id ? (
                    <Box sx={{ mt: 2, opacity: 0.7 }}>
                      {tile.type === 'Table' && tile.config?.tableConfig && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TableChartIcon color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {tile.config.tableConfig.selectedTable || 'Table view'}
                          </Typography>
                        </Box>
                      )}
                      {tile.type === 'Text & Query' && tile.config?.textRows?.length > 0 && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            maxHeight: '3em',
                            // TypeScript-safe way to add vendor prefixes
                            ...({
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            } as React.CSSProperties)
                          }}
                        >
                          {tile.config.textRows[0]?.content || 'Text content'}
                        </Typography>
                      )}
                      {(!tile.config || 
                        (tile.type === 'Text & Query' && (!tile.config.textRows || tile.config.textRows.length === 0)) ||
                        (tile.type === 'Table' && !tile.config.tableConfig)) && (
                        <Typography variant="body2" color="text.secondary">
                          Click to view content
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </CardContent>
                
                {/* Footer - always visible */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    px: 2, 
                    py: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {tile.connectionId ? 'Connected' : 'No connection'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {expandedTileId === tile.id ? 'Click to collapse' : 'Click to expand'}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

      )}

      {/* Menu component removed as we're now using inline visualization */}

      {/* Create Tile Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Create New Tile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tile Name"
            fullWidth
            variant="outlined"
            value={tileName}
            onChange={(e) => setTileName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={tileDescription}
            onChange={(e) => setTileDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mt: 2 }} error={!selectedTileType}>
            <InputLabel id="tile-type-label">Tile Type</InputLabel>
            <Select
              labelId="tile-type-label"
              value={selectedTileType}
              label="Tile Type"
              onChange={(e: SelectChangeEvent) => setSelectedTileType(e.target.value as 'Table' | 'Text & Query')}
            >
              <MenuItem value="Table">Table</MenuItem>
              <MenuItem value="Text & Query">Text & Query</MenuItem>
            </Select>
            {!selectedTileType && <FormHelperText>Required</FormHelperText>}
          </FormControl>
          
          {/* Database connection selection - required for all tile types */}
            <FormControl fullWidth sx={{ mt: 2 }} error={!selectedConnectionId}>
              <InputLabel id="connection-label">Database Connection</InputLabel>
              <Select
                labelId="connection-label"
                value={selectedConnectionId}
                label="Database Connection"
                onChange={(e: SelectChangeEvent) => setSelectedConnectionId(e.target.value)}
              >
                {availableConnections.map(connection => (
                  <MenuItem key={connection.id} value={connection.id}>{connection.name}</MenuItem>
                ))}
              </Select>
              {!selectedConnectionId && <FormHelperText>Required</FormHelperText>}
            </FormControl>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveTile} 
            variant="contained" 
            color="primary"
            disabled={!tileName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Tile Editor */}
      {openTileEditor && editingTile && (
        <TileEditor 
          open={openTileEditor}
          onClose={() => setOpenTileEditor(false)}
          tile={editingTile} 
          dashboardId={dashboardId || ''}
          onSave={async (updatedTileData) => {
            try {
              console.log('[DEBUG] TileEditor onSave - Received tile data:', JSON.stringify(updatedTileData, null, 2));
              
              // Prepare update payload
              const updatePayload: any = {
                title: updatedTileData.title,
                dashboardId: updatedTileData.dashboardId,
                type: updatedTileData.type,
                connectionId: updatedTileData.connectionId,
                position: updatedTileData.position
              };
              
              // Handle tile type-specific data
              if (updatedTileData.type === 'Text & Query' && updatedTileData.content.textRows) {
                console.log('[DEBUG] TileEditor onSave - Processing Text & Query tile with textRows:', 
                  JSON.stringify(updatedTileData.content.textRows, null, 2));
                
                // For Text & Query tiles, extract textRows as a separate field
                // The backend will create/update these in the text_rows table
                updatePayload.textRows = updatedTileData.content.textRows.map(row => ({
                  id: row.id, // Include ID if it exists for existing rows
                  type: row.type || 'text',
                  content: row.content, // Use 'content' which is what the TextRow model expects
                  isQuery: row.isQuery || false
                }));
                
                // Store textRows in content so it can be retrieved on the frontend
                updatePayload.content = {
                  textRows: updatedTileData.content.textRows
                };
                
                // Also include in config for backward compatibility
                updatePayload.config = {
                  textRows: updatedTileData.content.textRows,
                  uiType: 'text'
                };
                
                console.log('[DEBUG] TileEditor onSave - Prepared textRows payload:', 
                  JSON.stringify(updatePayload.textRows, null, 2));
              } else if (updatedTileData.type === 'Table' && updatedTileData.content.tableConfig) {
                // For Table tiles, keep using the config field
                updatePayload.config = {
                  tableConfig: updatedTileData.content.tableConfig,
                  uiType: 'table'
                };
              }
              
              console.log('[DEBUG] TileEditor onSave - Final update payload:', JSON.stringify(updatePayload, null, 2));
              
              // Save the updated tile data to the backend
              const updatedTile = await projectService.updateTile(updatedTileData.id, updatePayload);
              console.log('[DEBUG] TileEditor onSave - Response from backend:', JSON.stringify(updatedTile, null, 2));
              
              // Refresh data to show the updated tiles
              await fetchData();
              setOpenTileEditor(false);
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
