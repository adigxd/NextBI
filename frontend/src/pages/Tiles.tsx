import React, { useState, useEffect, ReactElement } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import SpeedIcon from '@mui/icons-material/Speed';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import StorageIcon from '@mui/icons-material/Storage';

import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  projectService, 
  Tile as ServiceTile 
} from '../services/projectService';
import { getAuthHeaders } from '../utils/authUtils';
import TileEditor from '../components/TileEditor';
import { hasProjectPermission } from '../services/userService';

// Backend API URL
const API_URL = 'http://localhost:3000';

// Extended interface for UI display with additional properties
interface Tile extends Omit<ServiceTile, 'type'> {
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'table';
  type: 'chart' | 'table' | 'metric' | 'text' | 'query';
  // The UI shows more specific types than the backend stores
}

// Extended DTO with additional properties needed for our implementation
interface ExtendedCreateTileDto {
  title: string;
  description?: string;
  // These are the UI types, which will be mapped to backend types on save
  uiType: 'chart' | 'table' | 'metric' | 'text' | 'query';
  // These are the backend-acceptable types
  type: 'chart' | 'text' | 'kpi';
  dashboardId: string;
  connectionId?: string;
  config?: TileConfig;
  position?: { x: number; y: number; w: number; h: number };
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface TileConfig {
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'table';
  dimensions?: Array<{ field: string; alias?: string }>;
  measures?: Array<{ field: string; alias?: string; aggregation?: string }>;
  textRows?: Array<{ id: string; type: string; content: string; isQuery: boolean }>;
  connectionId?: string;
  customQuery?: string;
  isQueryMode?: boolean;
  metadata?: {
    sqlQuery?: string;
    [key: string]: any;
  };
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  // Store the UI-specific tile type and chart type for front-end use
  uiType?: 'chart' | 'table' | 'metric' | 'text' | 'query';
  uiChartType?: 'bar' | 'line' | 'pie' | 'donut' | 'table';
  measure?: { field: string; alias?: string; aggregation?: string };
}

const Tiles = (): ReactElement => {
  const navigate = useNavigate();
  const { projectId, folderId, dashboardId } = useParams<{ 
    projectId: string; 
    folderId: string;
    dashboardId: string;
  }>();
  
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [folder, setFolder] = useState<{ id: string; name: string } | null>(null);
  const [dashboard, setDashboard] = useState<{ id: string; name: string } | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasEditPermission, setHasEditPermission] = useState<boolean>(false);
  
  // Auth context for permissions
  const { userData } = useAuth();

  // Dialog states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [tileName, setTileName] = useState<string>('');
  const [tileDescription, setTileDescription] = useState<string>('');
  // This is the UI type selected in the dropdown
const [selectedTileType, setSelectedTileType] = useState<'chart' | 'table' | 'metric' | 'text' | 'query'>('chart');
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie' | 'donut'>('bar');
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  
  const [openTileEditor, setOpenTileEditor] = useState(false);
  const [editingTile, setEditingTile] = useState<Tile | undefined>(undefined);

  // Define menu handling functions first to avoid lint errors
  const handleMenuClose = (): void => {
    setAnchorEl(null);
    setSelectedTile(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tile: Tile): void => {
    setAnchorEl(event.currentTarget);
    setSelectedTile(tile);
  };

  const handleEditTile = (): void => {
    if (selectedTile) {
      handleMenuClose();
      setEditingTile(selectedTile);
      setOpenTileEditor(true);
    }
  };

  const handleDeleteTile = async (): Promise<void> => {
    if (selectedTile) {
      try {
        // Use the correct projectService method for deleting tiles
        await projectService.deleteTile(selectedTile.id);
        
        setTiles(tiles.filter(tile => tile.id !== selectedTile.id));
        handleMenuClose();
        
        setNotification({
          message: 'Tile deleted successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting tile:', error);
        setNotification({
          message: `Failed to delete tile: ${(error as Error).message}`,
          type: 'error'
        });
      }
    }
  };

  const fetchData = async (): Promise<void> => {
    if (!projectId || !folderId || !dashboardId) return;
    
    try {
      setLoading(true);
      
      // Use getProjectById instead of getProject
      const projectData = await projectService.getProjectById(projectId);
      setProject({ id: projectData.id, name: projectData.name });
      
      // Get folder data from the project's folders array
      const folderData = projectData.folders?.find(f => f.id === folderId) || 
        { id: folderId, name: 'Folder' };
      setFolder({ id: folderData.id, name: folderData.name });
      
      // Use the correct method from projectService for fetching dashboard
      const dashboardData = await projectService.getDashboardById(dashboardId);
      setDashboard({ id: dashboardData.id, name: dashboardData.name });
      
      // Use the correct API endpoint for fetching tiles
      // The projectService already has a method for this
      const tilesData = await projectService.getTilesByDashboardId(dashboardId);
      
      setTiles(tilesData.map(tile => ({
        ...tile,
        chartType: (tile.config?.chartType || 'bar') as 'bar' | 'line' | 'pie' | 'donut',
        type: tile.type as 'chart' | 'table' | 'metric' | 'text' | 'query'
      })));
      
      if (userData?.id) {
        const hasPermission = await hasProjectPermission(projectId, 'edit');
        setHasEditPermission(hasPermission);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({
        message: `Failed to load data: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    fetchData();
  }, [projectId, folderId, dashboardId, userData?.id]);

  const handleCreateTile = (): void => {
    setOpenDialog(true);
  };

  const handleCloseDialog = (): void => {
    setOpenDialog(false);
    setTileName('');
    setTileDescription('');
    setSelectedTileType('chart');
    setSelectedChartType('bar');
  };

  const handleTileTypeChange = (event: SelectChangeEvent): void => {
    setSelectedTileType(event.target.value as 'chart' | 'table' | 'metric' | 'text' | 'query');
  };

  const handleChartTypeChange = (event: SelectChangeEvent): void => {
    setSelectedChartType(event.target.value as 'bar' | 'line' | 'pie' | 'donut');
  };

  // These functions are now defined at the top of the component to avoid lint errors

  const handleSaveTile = async (): Promise<void> => {
    if (!dashboardId || !tileName.trim()) return;
    
    try {
      // Map UI tile types to backend-acceptable types
      let backendType: 'chart' | 'text' | 'kpi';
      
      // Map UI types to backend types
      switch (selectedTileType) {
        case 'chart':
        case 'table':
          backendType = 'chart';
          break;
        case 'text':
        case 'query':
          backendType = 'text';
          break;
        case 'metric':
          backendType = 'kpi';
          break;
        default:
          backendType = 'chart'; // Default fallback
      }
      
      const tileData: ExtendedCreateTileDto = {
        title: tileName,
        description: tileDescription.trim() || undefined,
        dashboardId,
        uiType: selectedTileType, // Store the UI type for frontend reference
        type: backendType, // Use the mapped backend type
        position: { x: 0, y: 0, w: 6, h: 4 },
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        config: {}
      };
      
      // Configure based on UI tile type
      if (selectedTileType === 'chart') {
        tileData.config = {
          chartType: selectedChartType,
          dimensions: [],
          measures: [],
          uiType: 'chart' // Explicitly store UI type in config
        };
      } else if (selectedTileType === 'table') {
        // Table is a special chart type
        tileData.config = {
          chartType: 'table', // Custom chartType for table visualization
          dimensions: [],
          measures: [],
          uiType: 'table' // Explicitly store UI type in config
        };
      } else if (selectedTileType === 'metric') {
        tileData.config = {
          measures: [],
          uiType: 'metric' // Explicitly store UI type in config
        };
      } else if (selectedTileType === 'query') {
        // This now covers both Free Text and Database Query modes
        tileData.config = {
          textRows: [{
            id: '1',
            type: 'paragraph',
            content: '',
            isQuery: false
          }],
          uiType: 'query', // Explicitly store UI type in config
          isQueryMode: false, // Initially not in query mode, will be toggled in editor
          customQuery: ''
        };
      }
      
      console.log('Creating tile with data:', JSON.stringify(tileData, null, 2));
      
      // Use the correct projectService method for creating tiles
      const newTile = await projectService.createTile(tileData as any);
      
      // Add to UI with chart type if applicable
      const uiTile: Tile = {
        ...newTile,
        chartType: (() => {
          if (selectedTileType === 'chart') return selectedChartType;
          if (selectedTileType === 'table') return 'table' as const;
          return 'bar'; // Default for other types
        })(),
        type: selectedTileType
      };
      
      setTiles([...tiles, uiTile]);
      handleCloseDialog();
      
      setNotification({
        message: 'Tile created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating tile:', error);
      setNotification({
        message: `Failed to create tile: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  // Helper function to get the appropriate icon for a tile type
  const getTileIcon = (type: string, chartType?: string): React.ReactNode => {
    if (type === 'chart') {
      if (chartType === 'bar') return <BarChartIcon />;
      if (chartType === 'line') return <ShowChartIcon />;
      if (chartType === 'pie' || chartType === 'donut') return <PieChartIcon />;
      return <BarChartIcon />;
    } else if (type === 'table') {
      return <TableChartIcon />;
    } else if (type === 'metric') {
      return <SpeedIcon />;
    } else if (type === 'text') {
      return <TextFieldsIcon />;
    } else if (type === 'query') {
      return <StorageIcon />;
    }
    return <BarChartIcon />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Notification Snackbar */}
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
      
      {/* Breadcrumbs Navigation */}
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
          onClick={handleCreateTile}
          disabled={!hasEditPermission}
        >
          Create Tile
        </Button>
      </Box>

      {tiles.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <BarChartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tiles yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a tile to visualize your data
          </Typography>
          {hasEditPermission && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateTile}
            >
              Create Tile
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tiles.map((tile) => (
            <Grid item xs={12} sm={6} md={4} key={tile.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getTileIcon(tile.config?.uiType || tile.type, tile.config?.uiChartType || tile.chartType)}
                    <Typography variant="h6" component="h2" sx={{ ml: 1 }} noWrap>
                      {tile.title}
                    </Typography>
                  </Box>
                  
                  {/* Display tile content based on type */}
                  <Box sx={{ minHeight: 100, mt: 1, mb: 2 }}>
                    {/* Chart Tiles */}
                    {(tile.type === 'chart' || tile.config?.uiType === 'chart') && (
                      <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        {getTileIcon(tile.config?.uiType || tile.type, tile.config?.uiChartType || tile.chartType)}
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {tile.config?.dimensions?.length || 0} dimensions, {tile.config?.measures?.length || 0} measures
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Table Tiles */}
                    {tile.config?.uiType === 'table' && (
                      <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <TableChartIcon />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {tile.config?.dimensions?.length || 0} columns, {tile.config?.measures?.length || 0} metrics
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Metric Tiles */}
                    {((typeof tile.type === 'string' && tile.type.includes('kpi')) || tile.config?.uiType === 'metric') && (
                      <Box sx={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>123</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tile.config?.measure?.fieldName || 'Metric'}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Text Tiles */}
                    {(tile.type === 'text' || tile.config?.uiType === 'text' || tile.config?.uiType === 'query') && !tile.config?.isQueryMode && (
                      <Box sx={{ height: 150, overflow: 'hidden', bgcolor: '#f5f5f5', borderRadius: 1, p: 2 }}>
                        {tile.config?.textRows?.map((row: {type: string; content: string; id: string}, idx: number) => {
                          switch (row.type) {
                            case 'header': 
                              return <Typography key={idx} variant="h6">{row.content}</Typography>;
                            case 'subheader':
                              return <Typography key={idx} variant="subtitle1">{row.content}</Typography>;
                            default:
                              return <Typography key={idx} variant="body2">{row.content}</Typography>;
                          }
                        })}
                      </Box>
                    )}
                    
                    {/* Query Tiles */}
                    {tile.config?.uiType === 'query' && tile.config?.isQueryMode && (
                      <Box sx={{ height: 150, overflow: 'hidden', bgcolor: '#f5f5f5', borderRadius: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <StorageIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                          <Typography variant="caption" color="primary">Database Query</Typography>
                        </Box>
                        <Typography variant="body2" component="pre" sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.75rem',
                          whiteSpace: 'pre-wrap',
                          overflow: 'hidden',
                          maxHeight: 100
                        }}>
                          {(tile.config?.customQuery || '').substring(0, 150)}{(tile.config?.customQuery?.length || 0) > 150 ? '...' : ''}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Fallback if no specific display is available */}
                    {!tile.config?.uiType && !['chart', 'text', 'kpi'].includes(tile.type) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }} paragraph>
                        {tile.description || `${tile.title} visualization`}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      {(tile.config?.uiType || tile.type).charAt(0).toUpperCase() + (tile.config?.uiType || tile.type).slice(1)}
                      {tile.type === 'chart' && tile.chartType && ` (${tile.chartType})`}
                      {tile.config?.uiType === 'chart' && tile.config?.uiChartType && ` (${tile.config?.uiChartType})`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tile.updatedAt ? new Date(tile.updatedAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
                {hasEditPermission && (
                  <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, tile)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditTile}>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteTile} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

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
          
          <FormControl fullWidth>
            <InputLabel id="tile-type-select-label">Tile Type</InputLabel>
            <Select
              labelId="tile-type-select-label"
              id="tile-type-select"
              value={selectedTileType}
              label="Tile Type"
              onChange={handleTileTypeChange}
            >
              <MenuItem value="chart">Chart</MenuItem>
              <MenuItem value="table">Table</MenuItem>
              <MenuItem value="metric">Metric</MenuItem>
              <MenuItem value="query">Free Text / Database Query</MenuItem>
            </Select>
            <FormHelperText>Select the type of tile</FormHelperText>
          </FormControl>
          
          {selectedTileType === 'chart' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="chart-type-select-label">Chart Type</InputLabel>
              <Select
                labelId="chart-type-select-label"
                id="chart-type-select"
                value={selectedChartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="donut">Donut Chart</MenuItem>
              </Select>
              <FormHelperText>Select the type of chart visualization</FormHelperText>
            </FormControl>
          )}
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
      <TileEditor 
        open={openTileEditor}
        onClose={() => setOpenTileEditor(false)}
        tile={editingTile}
        dashboardId={dashboardId || ''}
        onSave={fetchData}
      />
    </Box>
  );
};

export default Tiles;
