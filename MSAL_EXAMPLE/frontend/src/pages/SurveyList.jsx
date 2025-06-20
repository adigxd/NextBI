import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  FormControlLabel,
  Switch,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assessment as ResultsIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  CloudUpload as CloudUploadIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ContentCopy as CloneIcon,
} from '@mui/icons-material';
import surveyService from '../services/surveyService';
import dataRetentionService from '../services/dataRetentionService';
import SurveyAssignmentManager from '../components/SurveyAssignmentManager';
import ImportSurveyModal from '../components/ImportSurveyModal';

// Status colors are now simplified since we only have published/draft states

const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [isAssignmentManagerOpen, setIsAssignmentManagerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const { surveys, totalCount } = await surveyService.getSurveys(page + 1, rowsPerPage, showPublishedOnly);
        setSurveys(surveys);
        setTotalCount(totalCount);
      } catch (error) {
        console.error('Error fetching surveys:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, [page, rowsPerPage, showPublishedOnly]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDeleteSurvey = async (id) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await surveyService.deleteSurvey(id);
        setSurveys(surveys.filter(survey => survey.id !== id));
        setTotalCount(prevCount => prevCount - 1);
      } catch (error) {
        console.error('Error deleting survey:', error);
      }
    }
  };

  const handleCloneSurvey = async (id) => {
    try {
      const clonedSurvey = await surveyService.cloneSurvey(id);
      setSurveys([clonedSurvey, ...surveys]);
      setTotalCount(prevCount => prevCount + 1);
    } catch (error) {
      console.error('Error cloning survey:', error);
    }
  };

  const handleToggleArchiveClick = async (survey) => {
    try {
      const result = await surveyService.toggleArchiveStatus(survey.id);
      
      // Update the survey in the local state
      setSurveys(prevSurveys => 
        prevSurveys.map(s => 
          s.id === survey.id ? { ...s, isPublished: result.isPublished } : s
        )
      );
      
      // Show success message
      alert(result.message);
    } catch (error) {
      alert(`Failed to toggle publish status: ${error.message}`);
    }
  };
  
  const handleShowPublishedOnlyChange = (event) => {
    setShowPublishedOnly(event.target.checked);
    setPage(0); // Reset to first page when toggling published view
  };
  
  const handleOpenAssignmentManager = (surveyId) => {
    setSelectedSurveyId(surveyId);
    setIsAssignmentManagerOpen(true);
  };
  
  const handleCloseAssignmentManager = () => {
    setIsAssignmentManagerOpen(false);
    setSelectedSurveyId(null);
  };
  
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    setAddMenuAnchorEl(null);
  };
  
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };
  
  const handleAddMenuClick = (event) => {
    setAddMenuAnchorEl(event.currentTarget);
  };
  
  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };
  
  const handleCreateSurvey = () => {
    navigate('/app/surveys/new');
    setAddMenuAnchorEl(null);
  };

  if (loading && surveys.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Filter surveys based on search term and publication status
  const filteredSurveys = surveys.filter(survey => {
    // First filter by search term
    const matchesSearch = 
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Then filter by publication status if showPublishedOnly is true
    // If showPublishedOnly is false, show all surveys that match the search
    return matchesSearch && (!showPublishedOnly || survey.isPublished);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Surveys
        </Typography>
        <div>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleAddMenuClick}
          >
            Create Survey
          </Button>
          <Menu
            anchorEl={addMenuAnchorEl}
            open={Boolean(addMenuAnchorEl)}
            onClose={handleAddMenuClose}
          >
            <MenuItem onClick={handleCreateSurvey}>Create New Survey</MenuItem>
            <MenuItem onClick={handleOpenImportModal}>Import from CSV</MenuItem>
          </Menu>
        </div>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={showPublishedOnly}
                onChange={handleShowPublishedOnlyChange}
                color="primary"
              />
            }
            label="Show Published Only"
          />
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search surveys..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Responses</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSurveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No surveys found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSurveys
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <Typography variant="body1">{survey.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {survey.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={survey.isPublished ? 'Published' : 'Draft'}
                          color={survey.isPublished ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{survey.responseCount}</TableCell>
                      <TableCell>
                        {new Date(survey.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {/* Date fields removed from schema */}
                        Not scheduled
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/app/surveys/${survey.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color={survey.isPublished ? "warning" : "info"}
                            onClick={() => handleToggleArchiveClick(survey)}
                          >
                            {survey.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteSurvey(survey.id)}
                          >
                            Delete
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => navigate(`/app/surveys/results/${survey.id}`)}
                          >
                            Results
                          </Button>
                          <Tooltip title={survey.isPublic ? "Public surveys are automatically available to all users" : ""}>
                            <span> {/* Wrapper needed for disabled buttons with tooltips */}
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                startIcon={<PeopleIcon />}
                                onClick={() => handleOpenAssignmentManager(survey.id)}
                                disabled={survey.isPublic}
                              >
                                Manage Users
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSurveys.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Survey Assignment Manager */}
      <SurveyAssignmentManager
        surveyId={selectedSurveyId}
        isOpen={isAssignmentManagerOpen}
        onClose={handleCloseAssignmentManager}
      />
      
      {/* Import Survey Modal */}
      <ImportSurveyModal
        open={isImportModalOpen}
        onClose={handleCloseImportModal}
      />
    </Box>
  );
};

export default SurveyList;
