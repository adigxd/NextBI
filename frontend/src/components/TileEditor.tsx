import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
  IconButton,
  Divider,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon,
  Code as CodeIcon,
  Title as TitleIcon,
  Subtitles as SubtitlesIcon,
  TextFormat as TextFormatIcon,
  TextFields as TextFieldsIcon,
  Storage as StorageIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  DonutLarge as DonutLargeIcon
} from '@mui/icons-material';
import { projectService } from '../services/projectService';
import { databaseConnectionService, DatabaseConnection } from '../services/databaseConnectionService';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getAuthHeaders } from '../utils/authUtils';

// Define CreateTileDto interface to match the backend expected format
interface CreateTileDto {
  title: string;
  description?: string;
  // Backend only accepts these types
  type: 'chart' | 'text' | 'kpi';
  dashboardId: string;
  connectionId?: string;
  config?: TileConfig;
  position?: { x: number; y: number; w: number; h: number };
}

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

interface DimensionField {
  fieldId: string;
  fieldName: string;
  aggregation?: string;
}

interface MeasureField {
  fieldId: string;
  fieldName: string;
  aggregation: string;
  alias?: string;
}

interface TextRow {
  id: string;
  type: 'header' | 'subheader' | 'text';
  content: string;
  isQuery: boolean;
}

interface TileConfig {
  // Backend only supports these chart types
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
  dimensions?: DimensionField[];
  measures?: MeasureField[];
  textRows?: TextRow[];
  connectionId?: string;
  customQuery?: string;
  isQueryMode?: boolean;
  // Store the UI-specific tile type and chart type for front-end use
  uiType?: 'chart' | 'table' | 'metric' | 'text' | 'query';
  uiChartType?: 'bar' | 'line' | 'pie' | 'donut' | 'table';
  metadata?: {
    sqlQuery?: string;
    [key: string]: any;
  };
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  measure?: MeasureField;
}

interface DatabaseField {
  name: string;
  type: string;
  table: string;
  description?: string;
}

interface Tile {
  id: string;
  title: string;
  // Backend types
  type: 'chart' | 'text' | 'kpi';
  description?: string;
  connectionId?: string;
  config?: TileConfig;
  // UI can have additional types stored in config
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
  // UI-specific tile type
  const [tileType, setTileType] = useState<'chart' | 'table' | 'metric' | 'text' | 'query'>('chart');
  const [connectionId, setConnectionId] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'donut' | 'table'>('bar');

  // Text tile rows
  const [textRows, setTextRows] = useState<TextRow[]>([{
    id: '1',
    type: 'header',
    content: '',
    isQuery: false
  }]);

  // Query tile state
  const [isQueryMode, setIsQueryMode] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // Connection and fields
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  // Track the selected connection object - needed for connection details
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [databaseFields, setDatabaseFields] = useState<DatabaseField[]>([]);
  const [dimensions, setDimensions] = useState<DimensionField[]>([]);
  const [measures, setMeasures] = useState<MeasureField[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Store mapping between field IDs and their source tables (needed for SQL generation)
  const [fieldTableMap, setFieldTableMap] = useState<Map<string, string>>(new Map());

  // Validation function
  const isValid = () => {
    // Basic validation
    if (!name.trim()) return false;
    
    // Type-specific validation
    if (tileType === 'chart' || tileType === 'table') {
      return connectionId && dimensions.length > 0 && measures.length > 0;
    } else if (tileType === 'metric') {
      return connectionId && measures.length > 0;
    } else if (tileType === 'text') {
      return textRows.length > 0 && textRows.some(row => row.content.trim());
    } else if (tileType === 'query') {
      if (isQueryMode) {
        return connectionId && customQuery.trim().length > 0;
      } else {
        return textRows.length > 0 && textRows.some(row => row.content.trim());
      }
    }
    
    return false;
  };

  // Load connections on mount
  useEffect(() => {
    const loadConnections = async () => {
      try {
        setLoading(true);
        const connList = await databaseConnectionService.getAllConnections();
        setConnections(connList.filter(conn => conn.status === 'active'));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load database connections:', error);
        setError('Failed to load database connections');
        setLoading(false);
      }
    };

    if (open) {
      loadConnections();
    }
  }, [open]);

  // Initialize form when editing an existing tile
  useEffect(() => {
    if (!tile || !open) return;
    console.log('Loading tile data:', JSON.stringify(tile, null, 2));
    
    setName(tile.title || '');
    setDescription(tile.description || '');
    
    // Determine UI tile type from config.uiType or map from backend type
    if (tile.config?.uiType) {
      // If we stored the UI type in the config, use that
      // Make sure to map 'text' to 'query' since we've removed the 'text' option
      const uiType = tile.config.uiType;
      setTileType(uiType === 'text' ? 'query' : uiType as 'chart' | 'table' | 'metric' | 'query');
    } else {
      // Otherwise map from backend type
      switch(tile.type) {
        case 'chart': 
          setTileType('chart');
          break;
        case 'text':
          // Map all text tiles to 'query' type since that's our new combined type
          setTileType('query');
          break;
        case 'kpi':
          setTileType('metric');
          break;
        default:
          setTileType('chart');
      }
    }
    
    // Set connection ID if it exists
    if (tile.connectionId) {
      setConnectionId(tile.connectionId);
    }
    
    if (tile.config) {
      // Load chart type
      if (tile.config.chartType) {
        setChartType(tile.config.chartType);
      }
      
      // Load dimensions and measures
      if (tile.config.dimensions) {
        setDimensions(tile.config.dimensions);
      }
      
      if (tile.config.measures) {
        setMeasures(tile.config.measures);
      }
      
      // Load text rows
      if (tile.config.textRows) {
        setTextRows(tile.config.textRows);
      }
      
      // Load query mode settings
      if (tile.config.isQueryMode !== undefined) {
        setIsQueryMode(tile.config.isQueryMode);
      }
      
      if (tile.config.customQuery) {
        setCustomQuery(tile.config.customQuery);
      }
    }
  }, [tile, open]);
  
  // Load database fields when connection is selected
  useEffect(() => {
    if (connectionId) {
      loadConnectionSchema();
    } else {
      // Reset fields when no connection is selected
      setDatabaseFields([]);
      setFieldTableMap(new Map<string, string>());
    }
  }, [connectionId]);

  const loadConnectionSchema = async () => {
    if (!connectionId) return;
    
    try {
      setLoading(true);
      setError('');
      setDatabaseFields([]); // Clear previous fields
      
      const authHeaders = await getAuthHeaders();
      // Make sure to use the correct API_URL with http://localhost:3000
      const response = await axios.get(`http://localhost:3000/api/connections/${connectionId}/schema`, { headers: authHeaders });
      console.log('Schema response:', response.data);
      
      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || 'Failed to fetch schema data');
      }
      
      // Extract fields from schema, handling different response formats
      let schemaData;
      if (response.data.success && response.data.data) {
        schemaData = response.data.data;
      } else if (response.data.schema) {
        schemaData = response.data.schema;
      } else {
        schemaData = response.data;
      }
      
      // Convert schema to a flat list of database fields
      const fields: DatabaseField[] = [];
      const fieldTableMapTemp = new Map<string, string>();
      
      // Based on the network response format you shared
      if (schemaData.schemas && schemaData.tables) {
        // Handle the specific format from your API
        const schemas = schemaData.schemas;
        const tables = schemaData.tables;
        
        // For each schema, process tables in sequence to avoid race conditions
        for (const schema of schemas) {
          // Get tables for this schema
          const schemaTables = tables[schema] || [];
          
          // For each table in this schema, process in sequence
          for (const tableName of schemaTables) {
            try {
              // Fetch table columns - using the correct API endpoint with full URL
              const columnsResponse = await axios.get(
                `http://localhost:3000/api/connections/${connectionId}/schema/${schema}/${tableName}`, 
                { headers: authHeaders }
              );
              
              if (columnsResponse.data.success && columnsResponse.data.data) {
                const columns = columnsResponse.data.data;
                const tableFields: DatabaseField[] = [];
                
                // Add each column as a field
                columns.forEach((column: any) => {
                  const field: DatabaseField = {
                    name: column.name || column.column_name,
                    type: column.type || column.data_type,
                    table: `${schema}.${tableName}`,
                    description: column.description || ''
                  };
                  
                  tableFields.push(field);
                  // Store the mapping for SQL generation
                  fieldTableMapTemp.set(field.name, field.table);
                });
                
                // Update state with the new fields
                fields.push(...tableFields);
              }
            } catch (err) {
              console.error(`Error loading columns for ${schema}.${tableName}:`, err);
              // Continue with other tables even if one fails
            }
          }
        }
        
        // After processing all tables, update the state once
        setDatabaseFields(fields);
        setFieldTableMap(fieldTableMapTemp);
      } else if (Array.isArray(schemaData)) {
        // Handle array of tables format
        schemaData.forEach((table: any) => {
          const tableName = table.name || table.table_name;
          if (table.columns) {
            table.columns.forEach((column: any) => {
              const field: DatabaseField = {
                name: column.name || column.column_name,
                type: column.type || column.data_type,
                table: tableName,
                description: column.description || ''
              };
              fields.push(field);
              fieldTableMapTemp.set(field.name, field.table);
            });
          }
        });
        setDatabaseFields(fields);
        setFieldTableMap(fieldTableMapTemp);
      } else if (typeof schemaData === 'object') {
        // Handle object format with tables as keys
        Object.keys(schemaData).forEach(tableName => {
          const columns = schemaData[tableName];
          if (Array.isArray(columns)) {
            columns.forEach(column => {
              const field: DatabaseField = {
                name: column.name || column.column_name,
                type: column.type || column.data_type,
                table: tableName,
                description: column.description || ''
              };
              fields.push(field);
              fieldTableMapTemp.set(field.name, field.table);
            });
          }
        });
        setDatabaseFields(fields);
        setFieldTableMap(fieldTableMapTemp);
      }
    } catch (err) {
      console.error('Error loading connection schema:', err);
      setError(`Failed to load database schema: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDatabaseFields([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value as 'bar' | 'line' | 'pie' | 'donut' | 'table');
  };

  const handleConnectionChange = (event: SelectChangeEvent) => {
    const connectionValue = event.target.value;
    setConnectionId(connectionValue);
    
    // Reset fields since the connection changed
    setDimensions([]);
    setMeasures([]);
    
    // Find and set the selected connection object
    if (connectionValue) {
      const connection = connections.find(c => c.id === connectionValue);
      if (connection) {
        setSelectedConnection(connection);
      } else {
        setSelectedConnection(null);
      }
    } else {
      setSelectedConnection(null);
    }
  };

  const handleAddDimension = (field: DatabaseField) => {
    const fieldId = `${field.table}.${field.name}`;
    const dimension: DimensionField = {
      fieldId,
      fieldName: field.name
    };
    
    // Check if field is already added
    if (!dimensions.some(d => d.fieldId === fieldId)) {
      setDimensions([...dimensions, dimension]);
      // Store table name for this field ID
      fieldTableMap.set(fieldId, field.table);
    }
  };

  const handleRemoveDimension = (index: number) => {
    const newDimensions = [...dimensions];
    newDimensions.splice(index, 1);
    setDimensions(newDimensions);
  };

  const handleAddMeasure = (field: DatabaseField) => {
    if (!isNumericField(field)) {
      // Only allow adding numeric fields as measures
      return;
    }
    
    // Check if measure already exists
    const exists = measures.some(m => m.fieldId === field.name);
    
    if (!exists) {
      const newMeasure: MeasureField = {
        fieldId: field.name,
        fieldName: field.name,
        aggregation: 'sum',
        alias: `${field.name}_sum` // Add alias property
      };
      
      setMeasures([...measures, newMeasure]);
      // Store table name for this field ID
      fieldTableMap.set(newMeasure.fieldId, field.table);
    }
  };

  const handleRemoveMeasure = (index: number) => {
    const newMeasures = [...measures];
    newMeasures.splice(index, 1);
    setMeasures(newMeasures);
  };

  const handleMeasureAggregationChange = (index: number, aggregation: string) => {
    setMeasures(prev => {
      const updated: MeasureField[] = [...prev];
      updated[index].aggregation = aggregation;
      return updated;
    });
  };

  // Functions for handling text tile rows
  const handleAddTextRow = () => {
    const newRow: TextRow = {
      id: uuidv4(), // Generate unique ID
      type: 'text',
      content: '',
      isQuery: false
    };
    
    setTextRows([...textRows, newRow]);
  };
  
  const handleTextRowContentChange = (id: string, content: string) => {
    setTextRows(textRows.map(row => 
      row.id === id ? { ...row, content } : row
    ));
  };
  
  const handleToggleRowQueryMode = (id: string) => {
    setTextRows(textRows.map(row => 
      row.id === id ? { ...row, isQuery: !row.isQuery } : row
    ));
  };
  
  const handleRemoveTextRow = (id: string) => {
    setTextRows(prev => prev.filter(row => row.id !== id));
  };
  
  const handleTextRowTypeChange = (id: string, type: 'header' | 'subheader' | 'text') => {
    setTextRows(prev => prev.map(row =>
      row.id === id ? { ...row, type } : row
    ));
  };
  
  // SQL generation is handled by the implementation below

  // Helper function to check if a field is numeric for measure selection
  const isNumericField = (field: DatabaseField): boolean => {
    if (!field || !field.type) return false;
    const numericTypes = ['int', 'integer', 'number', 'float', 'double', 'decimal', 'numeric', 'bigint', 'smallint', 'real'];
    return numericTypes.some(type => field.type.toLowerCase().includes(type));
  };

  // Function to generate SQL query based on dimensions and measures
  const generateSqlQuery = (): string => {
    if (!connectionId || dimensions.length === 0 || measures.length === 0) {
      return 'No query available';
    }

    const dimensionFields = dimensions.map(d => `${d.table}.${d.fieldName}`).join(', ');
    const measureFields = measures.map(m => `${m.aggregation}(${m.table}.${m.fieldName}) as ${m.fieldName}_${m.aggregation}`).join(', ');
    const tables = [...new Set([...dimensions.map(d => d.table), ...measures.map(m => m.table)])].join(', ');
    
    return `SELECT ${dimensionFields}, ${measureFields}\nFROM ${tables}\nGROUP BY ${dimensionFields}\nORDER BY ${dimensions[0].fieldName}`;
  };

  // Save the tile with proper type mapping between UI and backend
  const handleSave = async () => {
    if (!isValid()) {
      setError('Invalid tile configuration');
      setSaving(false);
      return;
    }
    setError('');
    setSaving(true);
    
    try {
      // Generate final config object based on tile type
      let config: TileConfig = {};
      
      switch (tileType) {
        case 'chart':
          config = {
            chartType: chartType === 'table' ? 'bar' : chartType, // Ensure backend compatibility
            dimensions,
            measures,
            uiType: 'chart', // Store original UI type
            metadata: {
              sqlQuery: generateSqlQuery()
            }
          };
          break;
        case 'table':
          // For table, we need to use a backend-compatible chartType
          // but store 'table' as uiChartType
          config = {
            chartType: 'bar', // Use a supported backend chart type
            uiChartType: 'table', // Store UI-specific chart type
            dimensions,
            measures,
            uiType: 'table', // Store original UI type
            metadata: {
              sqlQuery: generateSqlQuery()
            }
          };
          break;
        case 'metric':
          if (measures.length === 0) {
            setError('At least one measure is required for a metric tile');
            setSaving(false);
            return;
          }
          config = {
            measure: measures[0],
            uiType: 'metric', // Store original UI type
            metadata: {
              sqlQuery: generateSqlQuery()
            }
          };
          break;
          
        case 'text':
        case 'query':
          const isTextQueryMode = tileType === 'query' && isQueryMode;
          config = {
            textRows,
            uiType: tileType, // Store original UI type
            isQueryMode: isTextQueryMode,
            connectionId: isTextQueryMode ? connectionId : undefined,
            customQuery: isTextQueryMode ? customQuery : undefined
          };
          break;
      }
      
      // Add connection ID to config if available
      if (connectionId) {
        config.connectionId = connectionId;
      }
      
      // Map UI tile type to backend-accepted type
      // Backend only accepts 'chart', 'text', 'kpi'
      let backendType: 'chart' | 'text' | 'kpi';
      switch (tileType) {
        case 'chart':
        case 'table':
          backendType = 'chart';
          break;
        case 'metric':
          backendType = 'kpi';
          break;
        case 'text':
        case 'query':
          backendType = 'text';
          break;
        default:
          backendType = 'chart'; // Default fallback
      }
      
      // Create tile data object with the mapped type
      const tileData: CreateTileDto = {
        title: name,
        description: description || undefined,
        type: backendType, // Use the mapped backend type
        dashboardId,
        connectionId: connectionId || undefined,
        config: config
      };
      
      console.log('Saving tile with data:', JSON.stringify(tileData, null, 2));
      
      // Create or update tile
      if (tile?.id) {
        // Update existing tile
        await projectService.updateTile(tile.id, tileData);
      } else {
        // Create new tile
        await projectService.createTile(tileData);
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving tile:', err);
      setError(`Failed to save tile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Get the appropriate icon for chart type
  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChartIcon />;
      case 'line':
        return <LineChartIcon />;
      case 'pie':
        return <PieChartIcon />;
      case 'donut':
        return <PieChartIcon />;
      default:
        return <BarChartIcon />;
    }
  };
  
  // These functions are already defined above
  // Removed duplicate declarations

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {tile ? `Edit ${tile?.title || 'Tile'}` : 'Create New Tile'}
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
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tile Type</InputLabel>
                <Select
                  value={tileType}
                  onChange={(e) => setTileType(e.target.value as 'chart' | 'table' | 'metric' | 'text' | 'query')}
                  label="Tile Type"
                >
                  <MenuItem value="chart">Chart</MenuItem>
                  <MenuItem value="table">Table</MenuItem>
                  <MenuItem value="metric">Metric</MenuItem>
                  <MenuItem value="query">Free Text / Database Query</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required={tileType !== 'text' && tileType !== 'query'} error={!connectionId && error !== '' && tileType !== 'text' && tileType !== 'query'}>
                <InputLabel>Database Connection</InputLabel>
                <Select
                  value={connectionId}
                  onChange={handleConnectionChange}
                  label="Database Connection"
                >
                  <MenuItem value="">
                    <em>Select a database connection</em>
                  </MenuItem>
                  {connections.map((connection) => (
                    <MenuItem key={connection.id} value={connection.id}>
                      {connection.name}
                    </MenuItem>
                  ))}
                </Select>
                {!connectionId && error && tileType !== 'text' && (
                  <FormHelperText>Please select a database connection</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {tileType === 'chart' && (
              <Grid item xs={12}>
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
                    <MenuItem value="donut">Donut Chart</MenuItem>
                  </Select>
                  <FormHelperText>Select the type of visualization</FormHelperText>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Data Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Different UI based on tile type */}
          {tileType === 'query' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isQueryMode}
                      onChange={(e) => setIsQueryMode(e.target.checked)}
                      color="primary"
                      disabled={!connectionId}
                    />
                  }
                  label="Database Query Mode"
                />
                <Typography variant="caption" color="textSecondary" display="block">
                  {isQueryMode ? 'Write a custom SQL query' : 'Add formatted text content'}
                </Typography>
              </Grid>
              
              {isQueryMode ? (
                <Grid item xs={12}>
                  <FormControl fullWidth required={isQueryMode} error={isQueryMode && !customQuery.trim()}>
                    <TextField
                      label="SQL Query"
                      multiline
                      rows={8}
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      variant="outlined"
                      placeholder="SELECT * FROM table WHERE condition"
                      InputProps={{
                        sx: { fontFamily: 'monospace' }
                      }}
                    />
                    {isQueryMode && !customQuery.trim() && (
                      <FormHelperText>Please enter a SQL query</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Text Content</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      size="small"
                      onClick={handleAddTextRow}
                    >
                      Add Row
                    </Button>
                  </Box>
                  
                  {textRows.map((row) => (
                    <Paper
                      key={row.id}
                      variant="outlined"
                      sx={{ p: 2, mb: 2 }}
                    >
                      <Grid container spacing={2}>
                        {/* Row Controls */}
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <ToggleButtonGroup
                              value={row.type}
                              exclusive
                              onChange={(_, newType) => newType && handleTextRowTypeChange(row.id, newType as 'header' | 'subheader' | 'text')}
                              size="small"
                            >
                              <ToggleButton value="header">
                                <TitleIcon fontSize="small" />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  Header
                                </Typography>
                              </ToggleButton>
                              <ToggleButton value="subheader">
                                <SubtitlesIcon fontSize="small" />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  Subheader
                                </Typography>
                              </ToggleButton>
                              <ToggleButton value="text">
                                <TextFieldsIcon fontSize="small" />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  Text
                                </Typography>
                              </ToggleButton>
                            </ToggleButtonGroup>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveTextRow(row.id)}
                              disabled={textRows.length <= 1}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                        
                        {/* Content */}
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={row.type === 'text' ? 4 : 1}
                            placeholder={`Enter ${row.type} content...`}
                            value={row.content}
                            onChange={(e) => handleTextRowContentChange(row.id, e.target.value)}
                            variant="outlined"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
          
          {/* Chart or Table tile types */}
          {(tileType === 'chart' || tileType === 'table') && (
            <Grid container spacing={3}>
              {/* For chart/table tile types, show dimensions and measures */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Dimensions</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    {dimensions.length > 0 ? (
                      dimensions.map((dimension, index) => (
                        <Chip
                          key={index}
                          label={dimension.fieldName}
                          onDelete={() => handleRemoveDimension(index)}
                          sx={{ m: 0.5 }}
                        />
                      ))
                    ) : (
                      <Typography color="text.secondary">
                        No dimensions selected. Select fields from the list below.
                      </Typography>
                    )}
                  </Paper>
                  
                  <Typography variant="subtitle2" gutterBottom>Available Fields</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    {databaseFields.map((field) => (
                      <Chip
                        key={field.name + field.table}
                        label={`${field.table}.${field.name}`}
                        onClick={() => handleAddDimension(field)}
                        sx={{ m: 0.5, cursor: 'pointer' }}
                        variant="outlined"
                      />
                    ))}
                    {databaseFields.length === 0 && (
                      <Typography color="text.secondary">
                        {loading ? 'Loading fields...' : 'Select a connection to view available fields'}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Measures</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    {measures.length > 0 ? (
                      measures.map((measure, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={`${measure.aggregation}(${measure.fieldName})`}
                            onDelete={() => handleRemoveMeasure(index)}
                            sx={{ mr: 1 }}
                          />
                          <Select
                            value={measure.aggregation}
                            onChange={(e) => handleMeasureAggregationChange(index, e.target.value)}
                            size="small"
                            sx={{ minWidth: 100 }}
                          >
                            <MenuItem value="sum">Sum</MenuItem>
                            <MenuItem value="avg">Average</MenuItem>
                            <MenuItem value="min">Min</MenuItem>
                            <MenuItem value="max">Max</MenuItem>
                            <MenuItem value="count">Count</MenuItem>
                          </Select>
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary">
                        No measures selected. Select fields from the list below.
                      </Typography>
                    )}
                  </Paper>

                  <Typography variant="subtitle2" gutterBottom>Available Numeric Fields</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    {databaseFields.filter(isNumericField).map((field) => (
                      <Chip
                        key={field.name + field.table}
                        label={`${field.table}.${field.name}`}
                        onClick={() => handleAddMeasure(field)}
                        sx={{ m: 0.5, cursor: 'pointer' }}
                        variant="outlined"
                      />
                    ))}
                    {databaseFields.filter(isNumericField).length === 0 && (
                      <Typography color="text.secondary">
                        {loading ? 'Loading fields...' : 'No numeric fields available for measures'}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Grid>

              {/* SQL Preview */}
              {dimensions.length > 0 && measures.length > 0 && connectionId && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Generated SQL Preview</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto' }}>
                      {generateSqlQuery()}
                    </pre>
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Note: This is a preview of the SQL query that will be generated. Actual JOIN conditions will be determined based on foreign key relationships.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
        
        {/* Visualization Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            {/* Preview content */}
            <Typography variant="h6" gutterBottom>Preview</Typography>
            
            {/* Render preview based on tile type */}
            {tileType === 'chart' && dimensions.length > 0 && measures.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, minHeight: 300 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                  {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      {getChartIcon(chartType)}
                      <Typography sx={{ mt: 1 }}>Chart Preview</Typography>
                      <Typography variant="caption" color="text.secondary">Data will be loaded when the tile is viewed on the dashboard</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )}
            
            {/* Query tile (non-database mode) with text rows */}
            {tileType === 'query' && !isQueryMode && textRows.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                {textRows.map((row, index) => {
                  switch (row.type) {
                    case 'header':
                      return <Typography key={index} variant="h5" sx={{ mt: 1 }}>{row.content}</Typography>;
                    case 'subheader':
                      return <Typography key={index} variant="h6" sx={{ mt: 1 }}>{row.content}</Typography>;
                    default:
                      return <Typography key={index} variant="body1" sx={{ mt: 1 }}>{row.content}</Typography>;
                  }
                })}
              </Paper>
            )}
            
            {tileType === 'query' && (
              <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                <Typography variant="body2" color="primary" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <StorageIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Database Query Results Preview
                </Typography>
                {isQueryMode ? (
                  <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{customQuery}</Typography>
                  </Box>
                ) : (
                  textRows.map((row, index) => (
                    <Box key={index} sx={{ mt: 1 }}>
                      {row.isQuery && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CodeIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.content}</Typography>
                        </Box>
                      )}
                    </Box>
                  ))
                )}
              </Paper>
            )}
            
            {tileType === 'metric' && measures.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                <Typography variant="h3" sx={{ my: 2 }}>123</Typography>
                <Typography variant="body2" color="text.secondary">Sample metric value</Typography>
              </Paper>
            )}
            
            {((tileType === 'chart' && (dimensions.length === 0 || measures.length === 0)) ||
              (tileType === 'query' && textRows.length === 0) ||
              (tileType === 'metric' && measures.length === 0)) && (
              <Typography color="text.secondary">
                Complete the configuration to see a preview.
              </Typography>
            )}
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!isValid() || saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default TileEditor;
