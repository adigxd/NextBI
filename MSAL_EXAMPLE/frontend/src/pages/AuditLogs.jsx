import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import { useParams } from 'react-router-dom';
import dataRetentionService from '../services/dataRetentionService';
import surveyService from '../services/surveyService';

const AuditLogs = () => {
  const theme = useTheme();
  const { surveyId } = useParams();
  const [logs, setLogs] = useState([]);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyAuditLogs();
      fetchSurveyDetails();
    } else {
      fetchAllAuditLogs();
    }
  }, [surveyId, page, rowsPerPage]);

  const fetchSurveyAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await dataRetentionService.getSurveyAuditLogs(surveyId);
      setLogs(data);
      setTotalCount(data.length);
      setLoading(false);
    } catch (err) {
      setError('Failed to load audit logs: ' + err.message);
      setLoading(false);
    }
  };

  const fetchSurveyDetails = async () => {
    try {
      const data = await surveyService.getSurveyById(surveyId);
      setSurvey(data);
    } catch (err) {
      console.error('Failed to load survey details:', err);
    }
  };

  const fetchAllAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await dataRetentionService.getAllAuditLogs(page + 1, rowsPerPage);
      setLogs(data.logs);
      setTotalCount(data.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to load audit logs: ' + err.message);
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
      case 'purge':
        return 'error';
      case 'archive':
        return 'warning';
      case 'restore':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Filter logs based on tab value
  const filteredLogs = tabValue === 0 
    ? logs 
    : logs.filter(log => {
        if (tabValue === 1) return ['create', 'update'].includes(log.action);
        if (tabValue === 2) return ['archive', 'restore'].includes(log.action);
        if (tabValue === 3) return ['delete', 'purge'].includes(log.action);
        return true;
      });

  if (loading && logs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {surveyId ? `Audit Logs for Survey: ${survey?.title || surveyId}` : 'All Audit Logs'}
      </Typography>
      
      {survey && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Survey Details</Typography>
            <Typography variant="body1"><strong>Title:</strong> {survey.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Description:</strong> {survey.description || 'No description'}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2">
                <strong>Status:</strong> <Chip size="small" label={survey.status} />
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {formatDate(survey.createdAt)}
              </Typography>
              {survey.isArchived && (
                <Typography variant="body2">
                  <strong>Archived:</strong> {formatDate(survey.archivedAt)}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="All Actions" />
        <Tab label="Create/Update" />
        <Tab label="Archive/Restore" />
        <Tab label="Delete" />
      </Tabs>

      {filteredLogs.length === 0 ? (
        <Alert severity="info">No audit logs found for the selected filter.</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Entity Type</TableCell>
                  <TableCell>Entity ID</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Date/Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Chip 
                        label={log.action.charAt(0).toUpperCase() + log.action.slice(1)} 
                        color={getActionColor(log.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.user ? log.user.username : log.userId}</TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>{log.entityId}</TableCell>
                    <TableCell>
                      {log.details && (
                        <Box sx={{ 
                          maxWidth: 300, 
                          maxHeight: 100, 
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          p: 1,
                          borderRadius: 1,
                          bgcolor: theme.palette.grey[50]
                        }}>
                          <pre style={{ margin: 0 }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default AuditLogs;
