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
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  RestoreFromTrash as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dataRetentionService from '../services/dataRetentionService';
import { toast } from 'react-toastify';

const ArchivedSurveys = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [openPurgeDialog, setOpenPurgeDialog] = useState(false);

  useEffect(() => {
    fetchArchivedSurveys();
  }, [page, rowsPerPage]);

  const fetchArchivedSurveys = async () => {
    try {
      setLoading(true);
      const data = await dataRetentionService.getArchivedSurveys(page + 1, rowsPerPage);
      setSurveys(data.surveys);
      setTotalCount(data.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to load archived surveys: ' + err.message);
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

  const handleRestoreClick = (survey) => {
    setSelectedSurvey(survey);
    setOpenRestoreDialog(true);
  };

  const handlePurgeClick = (survey) => {
    setSelectedSurvey(survey);
    setOpenPurgeDialog(true);
  };

  const handleRestore = async () => {
    try {
      await dataRetentionService.restoreSurvey(selectedSurvey.id);
      toast.success(`Survey "${selectedSurvey.title}" has been restored`);
      setOpenRestoreDialog(false);
      fetchArchivedSurveys();
    } catch (err) {
      toast.error('Failed to restore survey: ' + err.message);
    }
  };

  const handlePurge = async () => {
    try {
      await dataRetentionService.purgeSurvey(selectedSurvey.id);
      toast.success(`Survey "${selectedSurvey.title}" has been permanently deleted`);
      setOpenPurgeDialog(false);
      fetchArchivedSurveys();
    } catch (err) {
      toast.error('Failed to delete survey: ' + err.message);
    }
  };

  const handleViewAuditLogs = (surveyId) => {
    navigate(`/app/audit-logs/survey/${surveyId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading && surveys.length === 0) {
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
      <Typography variant="h4" gutterBottom>Archived Surveys</Typography>
      
      {surveys.length === 0 ? (
        <Alert severity="info">No archived surveys found.</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Archived Date</TableCell>
                  <TableCell>Retention End Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {surveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>{survey.title}</TableCell>
                    <TableCell>
                      {survey.description ? 
                        (survey.description.length > 50 ? 
                          `${survey.description.substring(0, 50)}...` : 
                          survey.description) : 
                        'No description'}
                    </TableCell>
                    <TableCell>{formatDate(survey.archivedAt)}</TableCell>
                    <TableCell>
                      {survey.retentionEndDate ? (
                        <Chip 
                          label={formatDate(survey.retentionEndDate)} 
                          color={new Date(survey.retentionEndDate) < new Date() ? "error" : "default"}
                        />
                      ) : (
                        'Not set'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          title="Restore Survey"
                          onClick={() => handleRestoreClick(survey)}
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          title="Permanently Delete"
                          onClick={() => handlePurgeClick(survey)}
                        >
                          <DeleteForeverIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="info" 
                          title="View Audit Logs"
                          onClick={() => handleViewAuditLogs(survey.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Restore Dialog */}
      <Dialog
        open={openRestoreDialog}
        onClose={() => setOpenRestoreDialog(false)}
      >
        <DialogTitle>Restore Survey</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore the survey "{selectedSurvey?.title}"? 
            This will make it visible again in the main surveys list.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
          <Button onClick={handleRestore} color="primary" variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purge Dialog */}
      <Dialog
        open={openPurgeDialog}
        onClose={() => setOpenPurgeDialog(false)}
      >
        <DialogTitle>Permanently Delete Survey</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>Warning: This action cannot be undone.</strong> Are you sure you want to permanently delete the survey "{selectedSurvey?.title}" and all its responses? 
            This data will be irreversibly removed from the system.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPurgeDialog(false)}>Cancel</Button>
          <Button onClick={handlePurge} color="error" variant="contained">
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArchivedSurveys;
