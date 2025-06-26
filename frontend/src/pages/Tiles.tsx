import React, { useState, useEffect } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  projectService, 
  Tile as ServiceTile, 
  CreateTileDto 
} from '../services/projectService';
import { dataModelService } from '../services/dataModelService';
import TileEditor from '../components/TileEditor';
import { hasProjectPermission } from '../services/userService';

// Extended interface for UI display with additional properties
interface Tile extends ServiceTile {
  chartType: 'bar' | 'line' | 'pie' | 'donut';
}

// Extended DTO with additional properties needed for our implementation
interface ExtendedCreateTileDto extends CreateTileDto {
  dataModelId?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface DataModel {
  id: string;
  name: string;
}

const Tiles: React.FC = () => {
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
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Auth context for permissions
  const { userData } = useAuth();

  // States for permissions
  // Using userData to determine edit permissions as needed
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [tileName, setTileName] = useState<string>('');
  const [tileDescription, setTileDescription] = useState<string>('');
  const [selectedDataModelId, setSelectedDataModelId] = useState<string>('');
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie' | 'donut'>('bar');
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  
  // Tile editor state
  const [openTileEditor, setOpenTileEditor] = useState<boolean>(false);
  const [editingTile, setEditingTile] = useState<Tile | undefined>(undefined);

  // Function to fetch dashboard data
  const fetchData = async () => {
    if (!projectId || !folderId || !dashboardId) return;
    
      try {
        setLoading(true);
        // Get project details
        const projectData = await projectService.getProjectById(projectId);
        setProject(projectData);
        
        // Get folder details
        const folderData = await projectService.getFoldersByProjectId(projectId);
        const currentFolder = folderData.find(f => f.id === folderId) || { id: folderId, name: 'Unknown Folder' };
        setFolder(currentFolder);
        
        // Get dashboard details
        const dashboardData = await projectService.getDashboardById(dashboardId);
        setDashboard(dashboardData);
        
        // Get tiles for this dashboard
        const tileData = await projectService.getTilesByDashboardId(dashboardId);
        
        // Convert to UI format with chart type
        const uiTiles = tileData.map(tile => {
          // Convert 'table' chart type to 'donut' for compatibility
          const chartType = tile.config?.chartType;
          const convertedChartType = chartType === 'table' ? 'donut' : 
                                   (chartType as 'bar' | 'line' | 'pie' | 'donut') || 'bar';
          return {
            ...tile,
            chartType: convertedChartType
          };
        });
        
        setTiles(uiTiles);
        
        // Get all data models for the dropdown
        const models = await dataModelService.getAllDataModels();
        setDataModels(models);
        
        // Check user permissions for this project
        // Permission check is done but we're not restricting UI yet
        await hasProjectPermission(projectId, 'edit');
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setNotification({
          message: `Error loading data: ${(error as Error).message}`,
          type: 'error'
        });
        setLoading(false);
      }
    };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    fetchData();
  }, [projectId, folderId, dashboardId, userData?.id]);

  const handleCreateTile = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTileName('');
    setTileDescription('');
    setSelectedDataModelId('');
    setSelectedChartType('bar');
  };

  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setSelectedChartType(event.target.value as 'bar' | 'line' | 'pie' | 'donut');
  };

  const handleSaveTile = async () => {
    if (!dashboardId) return;
    
    try {
      const tileData: ExtendedCreateTileDto = {
        title: tileName, // Use 'title' instead of 'name' to match backend expectations
        dashboardId,
        dataModelId: selectedDataModelId,
        type: 'chart',
        chartType: selectedChartType, // Add chartType at the top level for backend validation
        position: { x: 0, y: 0, w: 6, h: 4 },
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        config: {
          chartType: selectedChartType,
          dimensions: [],
          measures: []
        }
      };
      
      // Create tile using the service
      const newTile = await projectService.createTile(tileData);
      
      // Add to UI with chart type
      const uiTile: Tile = {
        ...newTile,
        chartType: selectedChartType
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tile: Tile) => {
    setAnchorEl(event.currentTarget);
    setSelectedTile(tile);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTile(null);
  };

  const handleEditTile = () => {
    if (!selectedTile) return;
    
    // Close the menu
    handleMenuClose();
    
    // Open the tile editor with the selected tile
    setEditingTile(selectedTile);
    setOpenTileEditor(true);
  };

  const handleDeleteTile = async () => {
    if (selectedTile) {
      try {
        // Delete tile using the service
        await projectService.deleteTile(selectedTile.id);
        
        // Remove from UI
        setTiles(tiles.filter(t => t.id !== selectedTile.id));
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

  // Helper function to get the appropriate icon for a chart type
  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar':
        return <BarChartIcon />;
      case 'pie':
        return <PieChartIcon />;
      case 'line':
        return <ShowChartIcon />;
      case 'donut':
        return <TableChartIcon />; // Reusing TableChartIcon for donut chart
      default:
        return <BarChartIcon />;
    }
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTile}
          >
            Create Tile
          </Button>
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
                    {getChartIcon(tile.chartType)}
                    <Typography variant="h6" component="h2" noWrap>
                      {tile.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }} paragraph>
                    {tile.name} visualization
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      {tile.chartType.charAt(0).toUpperCase() + tile.chartType.slice(1)} Chart
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tile.updatedAt ? new Date(tile.updatedAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, tile)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
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
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="data-model-select-label">Data Model</InputLabel>
            <Select
              labelId="data-model-select-label"
              id="data-model-select"
              value={selectedDataModelId}
              label="Data Model"
              onChange={(e) => setSelectedDataModelId(e.target.value)}
            >
              {dataModels.map((model) => (
                <MenuItem key={model.id} value={model.id}>{model.name}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Select a data model for this visualization</FormHelperText>
          </FormControl>
          
          <FormControl fullWidth>
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
            <FormHelperText>Select the type of visualization</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveTile} 
            variant="contained" 
            color="primary"
            disabled={!tileName.trim() || !selectedDataModelId}
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
