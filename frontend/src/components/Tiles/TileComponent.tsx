import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { databaseConnectionService } from '../../services/databaseConnectionService';

// Text row interface for Text & Query tiles
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
  connectionId: string;
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

interface TileComponentProps {
  tile: TileData;
  onEdit: (tile: TileData) => void;
  onDelete: (tileId: string) => void;
}

const TileComponent: React.FC<TileComponentProps> = ({ tile, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [queryResults, setQueryResults] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleEdit = () => {
    handleMenuClose();
    onEdit(tile);
  };
  
  const handleDelete = () => {
    handleMenuClose();
    onDelete(tile.id);
  };

  // Load table data when tile is a Table type
  useEffect(() => {
    if (tile.type === 'Table' && 
        tile.content.tableConfig?.selectedTable && 
        tile.content.tableConfig.columns.length > 0) {
      loadTableData();
    }
  }, [tile]);

  // Load query data for Text & Query tiles that have queries
  useEffect(() => {
    if (tile.type === 'Text & Query' && tile.content.textRows) {
      const queryRows = tile.content.textRows.filter(row => row.isQuery && row.content);
      if (queryRows.length > 0) {
        loadQueryResults(queryRows);
      }
    }
  }, [tile]);

  // Load table data for Table tiles
  const loadTableData = async () => {
    if (!tile.connectionId || !tile.content.tableConfig?.selectedTable) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tableName = tile.content.tableConfig.selectedTable;
      const columns = tile.content.tableConfig.columns;
      
      const query = `SELECT ${columns.join(', ')} FROM ${tableName} LIMIT 100`;
      const result = await databaseConnectionService.executeQuery(tile.connectionId, query);
      
      setTableData(result.data || []);
    } catch (err) {
      console.error('Failed to load table data:', err);
      setError('Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  // Load query results for Text & Query tiles
  const loadQueryResults = async (queryRows: TextRow[]) => {
    if (!tile.connectionId) return;
    
    setLoading(true);
    
    const results: {[key: string]: any} = {};
    
    for (const row of queryRows) {
      if (!row.content) continue;
      
      try {
        const result = await databaseConnectionService.executeQuery(tile.connectionId, row.content);
        results[row.id] = result.data;
      } catch (err) {
        console.error(`Failed to execute query for row ${row.id}:`, err);
        results[row.id] = { error: 'Query execution failed' };
      }
    }
    
    setQueryResults(results);
    setLoading(false);
  };

  // Render query results for Text & Query tiles
  const renderQueryResult = (rowId: string) => {
    const result = queryResults[rowId];
    
    if (!result) {
      return <CircularProgress size={20} />;
    }
    
    if (result.error) {
      return <Typography color="error">{result.error}</Typography>;
    }
    
    if (Array.isArray(result) && result.length > 0) {
      return (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {Object.keys(result[0]).map(key => (
                  <TableCell key={key}>{key}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {result.slice(0, 5).map((row, idx) => (
                <TableRow key={idx}>
                  {Object.keys(result[0]).map(key => (
                    <TableCell key={key}>{row[key]?.toString() || ''}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {result.length > 5 && (
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption">
                Showing 5 of {result.length} results
              </Typography>
            </Box>
          )}
        </TableContainer>
      );
    }
    
    return (
      <Typography variant="body2" color="text.secondary">
        Query returned no results
      </Typography>
    );
  };

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      elevation={1}
    >
      {/* Tile header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{tile.title}</Typography>
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>

      {/* Tile content */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        
        {error && (
          <Box sx={{ p: 2, bgcolor: 'error.lightest', borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {/* Text & Query tile content */}
        {tile.type === 'Text & Query' && !loading && !error && tile.content.textRows && (
          <Box>
            {tile.content.textRows.map(row => (
              <Box key={row.id} sx={{ mb: 2 }}>
                {!row.isQuery ? (
                  <>
                    {row.type === 'header' && (
                      <Typography variant="h4">{row.content}</Typography>
                    )}
                    {row.type === 'subheader' && (
                      <Typography variant="h5">{row.content}</Typography>
                    )}
                    {row.type === 'text' && (
                      <Typography variant="body1">{row.content}</Typography>
                    )}
                  </>
                ) : (
                  <Box>
                    {renderQueryResult(row.id)}
                    <Typography variant="caption" color="text.secondary">
                      Query: {row.content}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
        
        {/* Table tile content */}
        {tile.type === 'Table' && !loading && !error && tableData && (
          <TableContainer sx={{ height: '100%' }}>
            <Table stickyHeader size="small">
              {tableData.length > 0 && (
                <>
                  <TableHead>
                    <TableRow>
                      {tile.content.tableConfig?.columns.map(column => (
                        <TableCell key={column}>
                          <Typography variant="subtitle2">{column}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index}>
                        {tile.content.tableConfig?.columns.map(column => (
                          <TableCell key={column}>{row[column]?.toString() || ''}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
            
            {tableData.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            )}
          </TableContainer>
        )}
        
        {/* Empty state */}
        {((tile.type === 'Text & Query' && (!tile.content.textRows || tile.content.textRows.length === 0)) ||
          (tile.type === 'Table' && (!tile.content.tableConfig?.selectedTable || !tableData))) && 
          !loading && !error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {tile.type === 'Text & Query' 
                ? 'This tile has no content. Click edit to add text or queries.' 
                : 'This table has not been configured. Click edit to select a table.'}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TileComponent;
