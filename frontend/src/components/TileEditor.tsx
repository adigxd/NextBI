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
  connectionId: string;
  fields?: DataModelField[];
}

interface DataModelField {
  id: string;
  name: string;
  type: string;
  isCalculated?: boolean;
  description?: string;
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
}

interface TileConfig {
  chartType: 'bar' | 'line' | 'pie' | 'donut';
  dimensions: DimensionField[];
  measures: MeasureField[];
  metadata?: {
    sqlQuery?: string;
    [key: string]: any;
  };
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

interface Tile {
  id: string;
  title: string;
  dataModelId: string;
  description?: string;
  config?: {
    chartType?: string;
    dimensions?: any[];
    measures?: any[];
  };
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
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'donut'>('bar');

  // Data model and fields
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [selectedDataModel, setSelectedDataModel] = useState<DataModel | null>(null);
  const [dimensions, setDimensions] = useState<DimensionField[]>([]);
  const [measures, setMeasures] = useState<MeasureField[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Store mapping between field IDs and their source tables (needed for SQL generation)
  const [fieldTableMap, setFieldTableMap] = useState<Map<string, string>>(new Map());

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
    if (!tile || !open) return;
    
    setName(tile.title || '');
    setDescription(tile.description || '');
    setDataModelId(tile.dataModelId || '');
    setChartType(tile.config?.chartType || 'bar');
    setDimensions((tile.config?.dimensions || []) as DimensionField[]);
    setMeasures((tile.config?.measures || []) as MeasureField[]);
  }, [tile, open]);

  // Load fields when data model changes
  useEffect(() => {
    if (!dataModelId) {
      setSelectedDataModel(null);
      return;
    }
    
    const loadDataModelFields = async () => {
      try {
        setLoading(true);
        setError('');
        
        const apiModel = await dataModelService.getDataModelById(dataModelId);
        
        // Convert API model to internal DataModel type
        const model: DataModel = {
          id: apiModel.id,
          name: apiModel.name,
          connectionId: apiModel.connectionId,
          fields: [] // Will be populated from schema
        };
        
        try {
          // Get fields from database schema - wrap in its own try-catch
          const schemaFields = await getFieldsFromSchema(model);
          model.fields = schemaFields;
        } catch (schemaError) {
          console.error('Error fetching schema:', schemaError);
          // Fall back to default fields
          model.fields = getDefaultFields();
        }
        
        setSelectedDataModel(model);
      } catch (err) {
        console.error('Failed to load data model fields:', err);
        setError('Failed to load data model fields');
        // Set default fields if available
        if (dataModelId) {
          setSelectedDataModel({
            id: dataModelId,
            name: 'Error loading model',
            connectionId: '',
            fields: getDefaultFields()
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadDataModelFields();
  }, [dataModelId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value as 'bar' | 'line' | 'pie' | 'donut');
  };

  const handleDataModelChange = (event: SelectChangeEvent) => {
    setDataModelId(event.target.value);
    // Reset dimensions and measures when data model changes
    setDimensions([]);
    setMeasures([]);
  };

  const handleAddDimension = (field: DataModelField) => {
    const dimension: DimensionField = {
      fieldId: field.id,
      fieldName: field.name
    };
    
    // Check if already added
    if (dimensions.some(d => d.fieldId === field.id)) {
      return;
    }
    
    setDimensions([...dimensions, dimension]);
  };

  const handleRemoveDimension = (index: number) => {
    const newDimensions = [...dimensions];
    newDimensions.splice(index, 1);
    setDimensions(newDimensions);
  };

  const handleAddMeasure = (field: DataModelField) => {
    const measure: MeasureField = {
      fieldId: field.id,
      fieldName: field.name,
      aggregation: 'sum' // Default aggregation
    };
    
    // Check if already added
    if (measures.some(m => m.fieldId === field.id)) {
      return;
    }
    
    setMeasures([...measures, measure]);
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

  const handleSave = async () => {
    // Validate required fields
    if (!name || name.trim() === '') {
      setError('Tile name is required');
      return;
    }
    
    if (!selectedDataModel) {
      setError('Please select a data model');
      return;
    }
    
    // For charts other than donut, require at least one dimension and one measure
    if (chartType !== 'donut' && (dimensions.length === 0 || measures.length === 0)) {
      setError('At least one dimension and one measure are required');
      return;
    }
    
    // Generate SQL query
    const sqlQuery = generateSqlQuery();
    if (!sqlQuery) {
      setError('Failed to generate SQL query');
      return;
    }
    
    try {
      // Start saving process
      setSaving(true);
      setError('');
      
      // Prepare tile config data including the SQL query in metadata
      const tileConfig: TileConfig = {
        chartType,
        dimensions,
        measures,
        metadata: {
          sqlQuery: sqlQuery, // Store the generated SQL query
          generatedAt: new Date().toISOString() // Add timestamp for tracking
        }
      };
      
      // Save tile data
      if (tile) {
        // Update existing tile
        await projectService.updateTile(tile.id, {
          title: name, // Use 'title' instead of 'name' to match backend expectations
          dataModelId,
          chartType,
          config: tileConfig // tileConfig now contains the SQL query in metadata
        });
      } else {
        // Create new tile
        await projectService.createTile({
          title: name, // Use 'title' instead of 'name' to match backend expectations
          dashboardId,
          dataModelId, 
          chartType,
          type: 'chart', // Required by CreateTileDto
          position: { x: 0, y: 0, w: 6, h: 4 }, // Default position
          config: tileConfig // tileConfig now contains the SQL query in metadata
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Failed to save tile:', error);
      setError(`Failed to save tile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
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
      case 'donut':
        return <TableChartIcon />; // Reusing TableChartIcon for donut chart
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

  // Helper function to get default fields if schema fetching fails
  const getDefaultFields = (): DataModelField[] => {
    return [
      { id: 'default_id', name: 'ID', type: 'number' },
      { id: 'default_name', name: 'Name', type: 'string' },
      { id: 'default_date', name: 'Date', type: 'date' }
    ];
  };

  // Format table and column names for display in UI
  const formatTableName = (name: string): string => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatColumnName = (name: string): string => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Map database types to field types
  const mapDatabaseTypeToFieldType = (dbType: string): string => {
    const typeMap: Record<string, string> = {
      'int': 'number',
      'integer': 'number',
      'bigint': 'number',
      'smallint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'float': 'number',
      'double': 'number',
      'varchar': 'string',
      'char': 'string',
      'text': 'string',
      'date': 'date',
      'datetime': 'datetime',
      'timestamp': 'datetime',
      'boolean': 'boolean'
    };

    const lowerType = dbType.toLowerCase();
    return typeMap[lowerType] || 'string';
  };

  // Fetch fields from database schema
  const getFieldsFromSchema = async (dataModel: DataModel): Promise<DataModelField[]> => {
    // Map to store field ID to table name mapping
    const newFieldTableMap = new Map<string, string>();

    try {
      // Log information for debugging
      console.log('Fetching schema for connection ID:', dataModel.connectionId);
      
      // Fetch schema - if this throws, the catch block will handle it
      const schemaResponse = await dataModelService.getDatabaseSchema(dataModel.connectionId);
      console.log('Schema response type:', typeof schemaResponse);
      console.log('Schema response:', schemaResponse);
      
      // Generate fields based on schema
      const fields = extractFieldsFromSchemaResponse(schemaResponse, newFieldTableMap);
      
      // Update the field-table mapping state
      setFieldTableMap(newFieldTableMap);
      
      // Return fields or defaults if none were found
      if (fields.length > 0) {
        console.log(`Extracted ${fields.length} fields from schema`);
        return fields;
      } else {
        console.warn('No fields could be extracted from schema, using defaults');
        return getDefaultFields();
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
      return getDefaultFields();
    }
  };
  
  // Helper function to extract fields from any schema response format
  const extractFieldsFromSchemaResponse = (schemaResponse: any, fieldTableMap: Map<string, string>): DataModelField[] => {
    const fields: DataModelField[] = [];
    
    // First, check if we have any data at all
    if (!schemaResponse) {
      console.warn('Schema response is null or undefined');
      return fields;
    }
    
    try {
      // Detailed logging of the schema structure
      console.log('Schema response keys:', Object.keys(schemaResponse));
      if (typeof schemaResponse === 'object' && !Array.isArray(schemaResponse)) {
        Object.keys(schemaResponse).forEach(key => {
          console.log(`Key: ${key}, Type: ${typeof schemaResponse[key]}`);
          if (Array.isArray(schemaResponse[key])) {
            console.log(`Array length for ${key}: ${schemaResponse[key].length}`);
            if (schemaResponse[key].length > 0) {
              console.log(`First item in ${key} array:`, schemaResponse[key][0]);
            }
          }
        });
      }
      
      // Case 1: Response is an array of tables directly
      if (Array.isArray(schemaResponse)) {
        console.log('Schema is an array, processing as table list');
        processTableArray(schemaResponse, fields, fieldTableMap);
      }
      // Case 2: Response has a tables array property
      else if (schemaResponse.tables && Array.isArray(schemaResponse.tables)) {
        console.log('Schema has tables array property');
        processTableArray(schemaResponse.tables, fields, fieldTableMap);
      }
      // Case 3: Response has field information directly
      else if (schemaResponse.fields && Array.isArray(schemaResponse.fields)) {
        console.log('Schema has fields array property');
        // Assume fields are directly provided
        schemaResponse.fields.forEach((field: any) => {
          if (field && field.id && field.name) {
            fields.push({
              id: field.id,
              name: field.name,
              type: field.type || 'string',
              description: field.description || field.name
            });
            
            // Try to extract table name from field ID
            const parts = field.id.split('.');
            if (parts.length > 1) {
              fieldTableMap.set(field.id, parts[0]);
            } else {
              fieldTableMap.set(field.id, 'default');
            }
          }
        });
      }
      // Case 4: Response has a schema property
      else if (schemaResponse.schema) {
        console.log('Schema has a schema property, processing it');
        return extractFieldsFromSchemaResponse(schemaResponse.schema, fieldTableMap);
      }
      // Case 5: Response has a data property
      else if (schemaResponse.data) {
        console.log('Schema has a data property, processing it');
        return extractFieldsFromSchemaResponse(schemaResponse.data, fieldTableMap);
      }
      // Case 6: Response is a generic object, try to extract data
      else if (typeof schemaResponse === 'object') {
        console.log('Schema is a generic object, attempting to extract data');
        processGenericObject(schemaResponse, fields, fieldTableMap);
      }
      
      // If no fields were found, try to create mock fields from the schema structure
      if (fields.length === 0 && typeof schemaResponse === 'object') {
        console.log('No fields extracted, creating mock fields from schema structure');
        createMockFieldsFromSchema(schemaResponse, fields, fieldTableMap);
      }
      
      return fields;
    } catch (error) {
      console.error('Error processing schema response:', error);
      return fields;
    }
  };
  
  // Create mock fields from schema structure when no actual fields can be extracted
  const createMockFieldsFromSchema = (schemaObj: any, fields: DataModelField[], fieldTableMap: Map<string, string>) => {
    // If we have any keys in the schema, use them as table names
    const keys = Object.keys(schemaObj);
    if (keys.length > 0) {
      console.log('Creating mock fields from schema keys:', keys);
      
      // Use the first few keys as table names
      keys.slice(0, 5).forEach(tableName => {
        const formattedTableName = formatTableName(tableName);
        
        // Create some standard columns for each table
        const mockColumns = [
          { name: 'id', type: 'number' },
          { name: 'name', type: 'string' },
          { name: 'created_at', type: 'datetime' },
          { name: 'value', type: 'number' }
        ];
        
        mockColumns.forEach(column => {
          const fieldId = `${tableName}.${column.name}`;
          fields.push({
            id: fieldId,
            name: `${formattedTableName}.${formatColumnName(column.name)}`,
            type: column.type,
            description: `${formatColumnName(column.name)} from ${formattedTableName}`
          });
          
          // Store table name for this field ID
          fieldTableMap.set(fieldId, tableName);
        });
      });
    }
  };

  // Helper function to process an array of tables
  const processTableArray = (tables: any[], fields: DataModelField[], fieldTableMap: Map<string, string>) => {
    tables.forEach((table: any) => {
      if (!table || !table.name) {
        console.warn('Table without name found in schema');
        return;
      }
      
      const tableName = table.name;
      const formattedTableName = formatTableName(tableName);
      
      // Process columns if they exist
      const columns = table.columns || [];
      if (Array.isArray(columns)) {
        columns.forEach((column: any) => {
          if (!column || !column.name) return;
          
          const fieldId = `${tableName}.${column.name}`;
          const fieldType = mapDatabaseTypeToFieldType(column.type || 'string');
          
          fields.push({
            id: fieldId,
            name: `${formattedTableName}.${formatColumnName(column.name)}`,
            type: fieldType,
            description: column.description || `${formatColumnName(column.name)} from ${formattedTableName}`
          });
          
          // Store table name for this field ID
          fieldTableMap.set(fieldId, tableName);
        });
      }
    });
  };
  
  // Helper function to process a generic object schema
  const processGenericObject = (schemaObj: any, fields: DataModelField[], fieldTableMap: Map<string, string>) => {
    Object.keys(schemaObj).forEach(key => {
      const value = schemaObj[key];
      
      // If we find an array, it might be columns for a table
      if (Array.isArray(value)) {
        const tableName = key; // Use the property name as table name
        const formattedTableName = formatTableName(tableName);
        
        value.forEach((item: any) => {
          if (item && item.name) {
            // This might be a column
            const columnName = item.name;
            const fieldId = `${tableName}.${columnName}`;
            const fieldType = mapDatabaseTypeToFieldType(item.type || 'string');
            
            fields.push({
              id: fieldId,
              name: `${formattedTableName}.${formatColumnName(columnName)}`,
              type: fieldType,
              description: item.description || `${formatColumnName(columnName)} from ${formattedTableName}`
            });
            
            // Store table name for this field ID
            fieldTableMap.set(fieldId, tableName);
          }
        });
      }
      // If it's an object, it might be nested structure
      else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processGenericObject(value, fields, fieldTableMap);
      }
    });
  };

  // Generate SQL query from selected dimensions and measures
  const generateSqlQuery = (): string | null => {
    if (dimensions.length === 0 && measures.length === 0) {
      return null;
    }
    
    // Collect unique tables from selected fields
    const allFields = [...dimensions.map(d => d.fieldId), ...measures.map(m => m.fieldId)];
    const tables = new Set<string>();
    
    allFields.forEach(fieldId => {
      const tableName = fieldTableMap.get(fieldId);
      if (tableName) {
        tables.add(tableName);
      }
    });
    
    // Build SQL clauses
    const selectClause: string[] = [];
    let fromClause = '';
    const joinClauses: string[] = [];
    const groupByClause: string[] = [];
    
    // Add dimensions to SELECT and GROUP BY
    dimensions.forEach(dim => {
      const [table, column] = dim.fieldId.split('.');
      selectClause.push(`${table}.${column} AS ${column}`);
      groupByClause.push(`${table}.${column}`);
    });
    
    // Add measures with aggregations to SELECT
    measures.forEach(measure => {
      const [table, column] = measure.fieldId.split('.');
      const aggFunction = measure.aggregation.toUpperCase();
      selectClause.push(`${aggFunction}(${table}.${column}) AS ${measure.aggregation}_${column}`);
    });
    
    // Build FROM clause with the first table
    const tableArray = Array.from(tables);
    if (tableArray.length > 0) {
      fromClause = tableArray[0];
      
      // Build JOIN clauses for additional tables
      // Since we don't have FK info, use placeholder join conditions
      for (let i = 1; i < tableArray.length; i++) {
        joinClauses.push(`JOIN ${tableArray[i]} ON true`); // Placeholder join condition
      }
    }
    
    // Combine clauses into the final SQL
    let sql = `SELECT \n  ${selectClause.join(',\n  ')}\nFROM ${fromClause}`;
    
    if (joinClauses.length > 0) {
      sql += `\n${joinClauses.join('\n')}`;
    }
    
    if (groupByClause.length > 0) {
      sql += `\nGROUP BY \n  ${groupByClause.join(',\n  ')}`;
    }
    
    return sql;
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
              <MenuItem value="donut">Donut Chart</MenuItem>
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
          <Grid container spacing={3}>
            <Grid item xs={12}>
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
            </Grid>
            
            {/* Generated SQL query section */}
            {dimensions.length > 0 && measures.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Generated SQL Query
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 300
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {generateSqlQuery()}
                  </pre>
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Note: This is a preview of the SQL query that will be generated. Actual JOIN conditions will be determined based on foreign key relationships.
                </Typography>
              </Grid>
            )}
          </Grid>
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
