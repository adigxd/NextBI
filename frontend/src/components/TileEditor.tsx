import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { projectService, Tile } from '../services/projectService';
import { dataModelService } from '../services/dataModelService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tile-editor-tabpanel-${index}`}
      aria-labelledby={`tile-editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface DataModel {
  id: string;
  name: string;
  fields?: DataModelField[];
}

interface DataModelField {
  id: string;
  name: string;
  type: string;
  isCalculated?: boolean;
  description?: string;
}

interface Dimension {
  fieldId: string;
  fieldName: string;
  aggregation?: string;
}

interface Measure {
  fieldId: string;
  fieldName: string;
  aggregation: string;
}

interface TileConfig {
  chartType: 'bar' | 'line' | 'pie' | 'table';
  dimensions: Dimension[];
  measures: Measure[];
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

// Extended Tile interface with description property
interface ExtendedTile extends Tile {
  description?: string;
}

interface TileEditorProps {
  open: boolean;
  onClose: () => void;
  tile?: Tile;
  dashboardId: string;
  onSave: () => void;
}

const TileEditor: React.FC<TileEditorProps> = ({
  open,
  onClose,
  tile,
  dashboardId,
  onSave
}) => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Basic tile info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataModelId, setDataModelId] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'table'>('bar');

  // Data model and fields
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [selectedDataModel, setSelectedDataModel] = useState<DataModel | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [measures, setMeasures] = useState<Measure[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load data models on mount
  useEffect(() => {
    const loadDataModels = async () => {
      try {
        setLoading(true);
        const models = await dataModelService.getAllDataModels();
        setDataModels(models);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data models:', error);
        setError('Failed to load data models');
        setLoading(false);
      }
    };

    if (open) {
      loadDataModels();
    }
  }, [open]);

  // Initialize form when editing an existing tile
  useEffect(() => {
    if (tile) {
      setName(tile.name);
      // Cast to ExtendedTile to access description
      const extendedTile = tile as unknown as ExtendedTile;
      setDescription(extendedTile.description || '');
      setDataModelId(tile.dataModelId);
      setChartType((tile.config?.chartType as 'bar' | 'line' | 'pie' | 'table') || 'bar');
      
      // Load dimensions and measures from tile config
      if (tile.config?.dimensions) {
        setDimensions(tile.config.dimensions);
      }
      
      if (tile.config?.measures) {
        setMeasures(tile.config.measures);
      }
    } else {
      // Reset form for new tile
      setName('');
      setDescription('');
      setDataModelId('');
      setChartType('bar');
      setDimensions([]);
      setMeasures([]);
    }
  }, [tile, open]);

  // Load data model fields when data model changes
  useEffect(() => {
    const loadDataModelFields = async () => {
      if (!dataModelId) {
        setSelectedDataModel(null);
        return;
      }

      try {
        setLoading(true);
        const model = await dataModelService.getDataModelById(dataModelId);
        setSelectedDataModel(model);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data model fields:', error);
        setError('Failed to load data model fields');
        setLoading(false);
      }
    };

    if (dataModelId) {
      loadDataModelFields();
    }
  }, [dataModelId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value as 'bar' | 'line' | 'pie' | 'table');
  };

  const handleDataModelChange = (event: SelectChangeEvent) => {
    setDataModelId(event.target.value);
    // Reset dimensions and measures when data model changes
    setDimensions([]);
    setMeasures([]);
  };

  const handleAddDimension = (field: DataModelField) => {
    // Check if already added
    if (dimensions.some(d => d.fieldId === field.id)) {
      return;
    }
    
    setDimensions([...dimensions, {
      fieldId: field.id,
      fieldName: field.name
    }]);
  };

  const handleRemoveDimension = (index: number) => {
    const newDimensions = [...dimensions];
    newDimensions.splice(index, 1);
    setDimensions(newDimensions);
  };

  const handleAddMeasure = (field: DataModelField) => {
    // Check if already added
    if (measures.some(m => m.fieldId === field.id)) {
      return;
    }
    
    setMeasures([...measures, {
      fieldId: field.id,
      fieldName: field.name,
      aggregation: 'sum' // Default aggregation
    }]);
  };

  const handleRemoveMeasure = (index: number) => {
    const newMeasures = [...measures];
    newMeasures.splice(index, 1);
    setMeasures(newMeasures);
  };

  const handleMeasureAggregationChange = (index: number, aggregation: string) => {
    const newMeasures = [...measures];
    newMeasures[index].aggregation = aggregation;
    setMeasures(newMeasures);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Tile name is required');
      return;
    }

    if (!dataModelId) {
      setError('Please select a data model');
      return;
    }

    // For charts other than table, require at least one dimension and one measure
    if (chartType !== 'table' && (dimensions.length === 0 || measures.length === 0)) {
      setError('At least one dimension and one measure are required');
      return;
    }

    try {
      setSaving(true);
      
      const tileConfig: TileConfig = {
        chartType,
        dimensions,
        measures
      };
      
      if (tile) {
        // Update existing tile
        await projectService.updateTile(tile.id, {
          name,
          // Remove description from the update payload as it's not in the DTO
          dataModelId,
          config: tileConfig
        });
      } else {
        // Create new tile
        await projectService.createTile({
          name,
          // Remove description from the create payload as it's not in the DTO
          dashboardId,
          dataModelId,
          type: 'chart',
          position: { x: 0, y: 0, w: 6, h: 4 },
          config: tileConfig
        });
      }
      
      setSaving(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save tile:', error);
      setError('Failed to save tile');
      setSaving(false);
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChartIcon />;
      case 'pie':
        return <PieChartIcon />;
      case 'line':
        return <LineChartIcon />;
      case 'table':
        return <TableChartIcon />;
      default:
        return <BarChartIcon />;
    }
  };

  const isNumericField = (field: DataModelField) => {
    return ['number', 'integer', 'float', 'decimal'].includes(field.type.toLowerCase());
  };

  const isDimensionField = (field: DataModelField) => {
    return ['string', 'date', 'datetime', 'boolean'].includes(field.type.toLowerCase()) || field.isCalculated;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {tile ? `Edit Tile: ${tile.name}` : 'Create New Tile'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tile editor tabs">
            <Tab label="General" id="tile-editor-tab-0" aria-controls="tile-editor-tabpanel-0" />
            <Tab label="Data" id="tile-editor-tab-1" aria-controls="tile-editor-tabpanel-1" />
            <Tab label="Visualization" id="tile-editor-tab-2" aria-controls="tile-editor-tabpanel-2" />
          </Tabs>
        </Box>
        
        {/* General Tab */}
        <TabPanel value={tabValue} index={0}>
          <TextField
            autoFocus
            margin="dense"
            label="Tile Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            error={!name.trim()}
            helperText={!name.trim() ? 'Name is required' : ''}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="data-model-select-label">Data Model</InputLabel>
            <Select
              labelId="data-model-select-label"
              id="data-model-select"
              value={dataModelId}
              label="Data Model"
              onChange={handleDataModelChange}
              disabled={loading}
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
              value={chartType}
              label="Chart Type"
              onChange={handleChartTypeChange}
              startAdornment={
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  {getChartIcon(chartType)}
                </Box>
              }
            >
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
              <MenuItem value="table">Table</MenuItem>
            </Select>
            <FormHelperText>Select the type of visualization</FormHelperText>
          </FormControl>
        </TabPanel>
        
        {/* Data Tab */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !selectedDataModel ? (
            <Typography color="text.secondary" align="center">
              Please select a data model in the General tab first
            </Typography>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Available Fields
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, height: 300, overflow: 'auto' }}>
                  {selectedDataModel.fields?.map((field) => (
                    <Box 
                      key={field.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center', 
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box>
                        <Typography variant="body1">{field.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {field.type} {field.isCalculated && '(Calculated)'}
                        </Typography>
                      </Box>
                      <Box>
                        {isDimensionField(field) && (
                          <Button 
                            size="small" 
                            startIcon={<AddIcon />}
                            onClick={() => handleAddDimension(field)}
                            disabled={dimensions.some(d => d.fieldId === field.id)}
                          >
                            Dimension
                          </Button>
                        )}
                        {isNumericField(field) && (
                          <Button 
                            size="small" 
                            startIcon={<AddIcon />}
                            onClick={() => handleAddMeasure(field)}
                            disabled={measures.some(m => m.fieldId === field.id)}
                          >
                            Measure
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Dimensions
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, minHeight: 100 }}>
                    {dimensions.length === 0 ? (
                      <Typography color="text.secondary" align="center">
                        No dimensions selected
                      </Typography>
                    ) : (
                      dimensions.map((dimension, index) => (
                        <Box 
                          key={dimension.fieldId} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center', 
                            mb: 1 
                          }}
                        >
                          <Chip 
                            label={dimension.fieldName} 
                            color="primary" 
                            variant="outlined" 
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveDimension(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Paper>
                </Box>
                
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Measures
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                    {measures.length === 0 ? (
                      <Typography color="text.secondary" align="center">
                        No measures selected
                      </Typography>
                    ) : (
                      measures.map((measure, index) => (
                        <Box 
                          key={measure.fieldId} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center', 
                            mb: 1 
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={measure.fieldName} 
                              color="secondary" 
                              variant="outlined" 
                            />
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <Select
                                value={measure.aggregation}
                                onChange={(e) => handleMeasureAggregationChange(index, e.target.value)}
                                size="small"
                              >
                                <MenuItem value="sum">Sum</MenuItem>
                                <MenuItem value="avg">Average</MenuItem>
                                <MenuItem value="min">Min</MenuItem>
                                <MenuItem value="max">Max</MenuItem>
                                <MenuItem value="count">Count</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveMeasure(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          )}
        </TabPanel>
        
        {/* Visualization Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Paper 
              variant="outlined" 
              sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flexDirection: 'column',
                p: 2
              }}
            >
              <Box sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>
                {getChartIcon(chartType)}
              </Box>
              <Typography variant="h6">
                {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {dimensions.length === 0 || measures.length === 0 ? 
                  'Add dimensions and measures to preview the chart' : 
                  `${dimensions.length} dimension(s) and ${measures.length} measure(s) selected`
                }
              </Typography>
            </Paper>
          </Box>
        </TabPanel>
        
        {error && (
          <Box sx={{ mt: 2, color: 'error.main' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving || !name.trim() || !dataModelId}
        >
          {saving ? <CircularProgress size={24} /> : (tile ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TileEditor;
