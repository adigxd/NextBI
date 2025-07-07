import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  FormControlLabel,
  Switch,
  IconButton,
  Divider,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
// MUI imports
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TitleIcon from '@mui/icons-material/Title';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CodeIcon from '@mui/icons-material/Code';
import TableChartIcon from '@mui/icons-material/TableChart';
import { v4 as uuidv4 } from 'uuid';
import { databaseConnectionService } from '../../services/databaseConnectionService';

// Extend the databaseConnectionService interface temporarily
declare module '../../services/databaseConnectionService' {
  interface DatabaseConnectionService {
    getDatabaseSchema(connectionId: string): Promise<{ tables: DatabaseTable[] }>;
  }
}

// Define the text row interface for Text & Query tiles
interface TextRow {
  id: string;
  type: 'header' | 'subheader' | 'text';
  content: string;
  isQuery: boolean;
}

// Backend tile data structure
export interface TileData {
  id: string;
  title: string;
  type: 'Text & Query' | 'Table';
  connectionId: string; // Required for all tile types
  dashboardId: string;
  content: {
    textRows?: TextRow[];
    tableConfig?: {
      selectedTable: string;
      columns: string[];
    };
  };
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface TileEditorProps {
  open: boolean;
  tile?: TileData;
  dashboardId: string;
  onClose: () => void;
  onSave: (tileData: TileData) => void;
  // Connection ID is required and cannot be changed after creation
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Database schema structure
interface DatabaseTable {
  name: string;
  columns: { name: string; type: string }[];
}

// TabPanel component for managing editor tabs
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tile-editor-tab-${index}`}
      aria-labelledby={`tile-editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TileEditor: React.FC<TileEditorProps> = ({
  open,
  tile,
  onClose,
  onSave
}) => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Tile data state
  const [title, setTitle] = useState('');
  const [textRows, setTextRows] = useState<TextRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Database schema state
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Initialize form data when editing an existing tile
  useEffect(() => {
    if (open) {
      console.log('[DEBUG] TileEditor - Opening editor with tile data:', JSON.stringify(tile, null, 2));
      
      if (tile) {
        setTitle(tile.title);
        
        // Set text rows for Text & Query tiles
        if (tile.type === 'Text & Query') {
          console.log('[DEBUG] TileEditor - Text & Query tile detected, textRows:', 
            JSON.stringify(tile.content.textRows, null, 2));
          setTextRows(tile.content.textRows || []);
        }
        
        // Set table configuration for Table tiles
        if (tile.type === 'Table') {
          if (tile.content.tableConfig) {
            setSelectedTable(tile.content.tableConfig.selectedTable || '');
            setSelectedColumns(tile.content.tableConfig.columns || []);
          }
        }
        
        // Load database schema on open if we have a connectionId
        // Connection ID is required for all tile types
        if (tile.connectionId) {
          loadDatabaseSchema();
        } else {
          setError('Database connection is required but not provided');
        }
      } else {
        // Initialize with defaults for a new tile
        setTitle('');
        setTextRows([]);
        setSelectedTable('');
        setSelectedColumns([]);
      }
    }
  }, [tile, open]);
  
  // Load database schema for the connected database
  const loadDatabaseSchema = async () => {
    if (!tile?.connectionId) {
      setError('Database connection is required');
      return;
    }
    
    setLoadingSchema(true);
    setError('');
    
    try {
      const schemaData = await databaseConnectionService.getDatabaseSchema(tile.connectionId);
      setTables(schemaData.tables || []);
      setLoadingSchema(false);
    } catch (err) {
      console.error('Error loading database schema:', err);
      setError('Failed to load database schema');
      setLoadingSchema(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle table selection for Table tiles
  const handleTableChange = (event: SelectChangeEvent) => {
    const tableName = event.target.value;
    setSelectedTable(tableName);
    setSelectedColumns([]); // Reset column selection when table changes
  };

  // Handle column selection for Table tiles
  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(col => col !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };

  // Text row management functions for Text & Query tiles
  const addTextRow = () => {
    const newRow: TextRow = {
      id: uuidv4(),
      type: 'text',
      content: '',
      isQuery: false
    };
    console.log('[DEBUG] TileEditor addTextRow - Adding new row:', newRow);
    setTextRows([...textRows, newRow]);
  };

  const removeTextRow = (id: string) => {
    setTextRows(textRows.filter(row => row.id !== id));
  };

  const updateTextRowContent = (id: string, content: string) => {
    console.log(`[DEBUG] TileEditor updateTextRowContent - Updating row ${id} with content:`, content);
    setTextRows(textRows.map(row => 
      row.id === id ? { ...row, content } : row
    ));
  };

  const updateTextRowType = (id: string, type: 'header' | 'subheader' | 'text') => {
    console.log(`[DEBUG] TileEditor updateTextRowType - Updating row ${id} with type:`, type);
    setTextRows(textRows.map(row => 
      row.id === id ? { ...row, type } : row
    ));
  };

  const toggleQueryMode = (id: string) => {
    const targetRow = textRows.find(row => row.id === id);
    console.log(`[DEBUG] TileEditor toggleQueryMode - Toggling query mode for row ${id} from ${targetRow?.isQuery} to ${!targetRow?.isQuery}`);
    setTextRows(textRows.map(row => 
      row.id === id ? { ...row, isQuery: !row.isQuery } : row
    ));
  };

  // Form validation
  const isValid = (): boolean => {
    if (!title.trim()) return false;
    
    if (tile?.type === 'Text & Query' && textRows.length === 0) {
      return false;
    }
    
    if (tile?.type === 'Table' && (!selectedTable || selectedColumns.length === 0)) {
      return false;
    }
    
    return true;
  };

  // Handle save button click
  const handleSave = () => {
    console.log('[DEBUG] TileEditor handleSave - Starting save process');
    console.log('[DEBUG] TileEditor handleSave - Current state:', {
      title,
      textRows: JSON.stringify(textRows, null, 2),
      selectedTable,
      selectedColumns,
      tileId: tile?.id,
      tileType: tile?.type
    });
    
    if (!title.trim()) {
      console.log('[DEBUG] TileEditor handleSave - Validation failed: Title is required');
      setError('Title is required');
      return;
    }
    
    // Validate that we have a connection ID
    if (!tile?.connectionId) {
      console.log('[DEBUG] TileEditor handleSave - Validation failed: Connection ID is required');
      setError('Database connection is required');
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare the tile data based on the type
      const updatedTile: TileData = {
        id: tile?.id || uuidv4(),
        title: title.trim(),
        type: tile?.type || 'Table', // Default to Table if not specified
        dashboardId: tile?.dashboardId || '',
        connectionId: tile.connectionId, // Use the existing connection ID, cannot be changed
        position: tile?.position || { x: 0, y: 0, w: 6, h: 4 },
        content: {
          // Include appropriate content based on tile type
          ...(tile?.type === 'Text & Query' ? { textRows } : {}),
          ...(tile?.type === 'Table' ? { 
            tableConfig: {
              selectedTable,
              columns: selectedColumns
            } 
          } : {})
        }
      };
      
      console.log('[DEBUG] TileEditor handleSave - Prepared tile data for saving:', JSON.stringify(updatedTile, null, 2));
      console.log('[DEBUG] TileEditor handleSave - Text rows count:', textRows.length);
      if (textRows.length > 0) {
        console.log('[DEBUG] TileEditor handleSave - First text row:', JSON.stringify(textRows[0], null, 2));
      }
      
      onSave(updatedTile);
      console.log('[DEBUG] TileEditor handleSave - onSave callback called');
      onClose();
    } catch (err) {
      console.error('[ERROR] TileEditor handleSave - Error saving tile:', err);
      setError('Failed to save tile');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {tile ? `Edit ${tile.type} Tile` : 'Create New Tile'}
        {tile?.connectionId && <Typography variant="caption" display="block">Connected to database</Typography>}
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tile editor tabs">
          <Tab label="Settings" id="tile-editor-tab-0" />
          <Tab label="Content" id="tile-editor-tab-1" />
          <Tab label="Preview" id="tile-editor-tab-2" />
        </Tabs>
      </Box>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Tile Name"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                error={!title}
                helperText={!title ? 'Tile name is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Tile Type</Typography>
                <Typography variant="body1">
                  {tile?.type || 'Not set'}
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Tile type cannot be changed after creation
                  </Typography>
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Database Connection</Typography>
                <Typography variant="body1">
                  {tile?.connectionId || 'Not set'}
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Database connection cannot be changed after creation
                  </Typography>
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {tile?.type === 'Text & Query' && (
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={addTextRow}
                >
                  Add Text Row
                </Button>
              </Grid>
              
              {textRows.map((row, index) => (
                <Grid item xs={12} key={row.id}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">Row {index + 1}</Typography>
                        <IconButton 
                          color="error" 
                          onClick={() => removeTextRow(row.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth disabled={row.isQuery}>
                          <InputLabel>Text Type</InputLabel>
                          <Select
                            value={row.type}
                            label="Text Type"
                            onChange={(e) => updateTextRowType(row.id, e.target.value as 'header' | 'subheader' | 'text')}
                          >
                            <MenuItem value="header">
                              <Box display="flex" alignItems="center">
                                <TitleIcon sx={{ mr: 1 }} /> Header
                              </Box>
                            </MenuItem>
                            <MenuItem value="subheader">
                              <Box display="flex" alignItems="center">
                                <SubtitlesIcon sx={{ mr: 1 }} /> Subheader
                              </Box>
                            </MenuItem>
                            <MenuItem value="text">
                              <Box display="flex" alignItems="center">
                                <TextFieldsIcon sx={{ mr: 1 }} /> Normal Text
                              </Box>
                            </MenuItem>
                          </Select>
                          <FormHelperText>
                            {row.isQuery ? 'Text type cannot be changed in query mode' : ''}
                          </FormHelperText>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={row.isQuery}
                              onChange={() => toggleQueryMode(row.id)}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center">
                              {row.isQuery ? (
                                <>
                                  <CodeIcon sx={{ mr: 1 }} /> Query Mode
                                </>
                              ) : (
                                <>
                                  <TextFieldsIcon sx={{ mr: 1 }} /> Text Mode
                                </>
                              )}
                            </Box>
                          }
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={row.isQuery ? 4 : 2}
                          label={row.isQuery ? 'SQL Query' : 'Content'}
                          value={row.content}
                          onChange={(e) => updateTextRowContent(row.id, e.target.value)}
                          placeholder={row.isQuery ? 'SELECT * FROM table' : 'Enter text content here'}
                          InputProps={{
                            startAdornment: row.isQuery ? <CodeIcon sx={{ mr: 1, color: 'text.secondary' }} /> : undefined
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
              
              {textRows.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No text rows added yet. Click "Add Text Row" to add content.</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
          
          {tile?.type === 'Table' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!selectedTable}>
                  <InputLabel>Select Table</InputLabel>
                  <Select
                    value={selectedTable}
                    label="Select Table"
                    onChange={handleTableChange}
                    disabled={loadingSchema}
                  >
                    {tables.map((table) => (
                      <MenuItem key={table.name} value={table.name}>
                        {table.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {selectedTable && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Select Columns</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                    {tables
                      .find(t => t.name === selectedTable)?.columns
                      .map((column) => (
                        <FormControlLabel
                          key={column.name}
                          control={
                            <Switch
                              checked={selectedColumns.includes(column.name)}
                              onChange={() => handleColumnToggle(column.name)}
                            />
                          }
                          label={`${column.name} (${column.type})`}
                          sx={{ display: 'block', mb: 1 }}
                        />
                      ))}
                  </Paper>
                </Grid>
              )}
              
              {!selectedTable && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Select a table to display</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {tile && tile.type === 'Text & Query' && (
            <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
              {textRows.length > 0 ? (
                <Box>
                  {textRows.map((row) => (
                    <Box key={row.id} sx={{ mb: 2 }}>
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
                          <Typography variant="subtitle2" color="primary" gutterBottom>Query Result Preview</Typography>
                          <Typography variant="body2" component="code" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {row.content ? 'Query results would display here' : 'No query defined'}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                            SQL: {row.content || 'No query defined'}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No content added yet. Add text rows in the Content tab.
                </Typography>
              )}
            </Paper>
          )}
          
          {tile && tile.type === 'Table' && (
            <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
              {selectedTable && selectedColumns.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Table Preview</Typography>
                  <TableChartIcon sx={{ fontSize: 60, color: 'action.active', display: 'block', mx: 'auto', my: 2 }} />
                  <Typography variant="body2" align="center">
                    Displaying table: <b>{selectedTable}</b>
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    Selected columns: <b>{selectedColumns.join(', ')}</b>
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No table or columns selected. Configure your table in the Content tab.
                </Typography>
              )}
            </Paper>
          )}
        </TabPanel>
      </DialogContent>
      
      {error && (
        <Box sx={{ px: 3, py: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!isValid() || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TileEditor;
