import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import surveyAssignmentService from '../services/surveyAssignmentService';
import surveyService from '../services/surveyService';

const SurveyAssignmentManager = ({ surveyId, isOpen, onClose }) => {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isAnonymousSurvey, setIsAnonymousSurvey] = useState(false);

  // Load assigned users when the component mounts or surveyId changes
  useEffect(() => {
    if (surveyId && isOpen) {
      checkSurveyType();
      loadAssignedUsers();
    }
  }, [surveyId, isOpen]);
  
  // Check if the survey is anonymous
  const checkSurveyType = async () => {
    try {
      const survey = await surveyService.getSurveyById(surveyId);
      setIsAnonymousSurvey(survey.isAnonymous);
    } catch (err) {
      console.error('Error checking survey type:', err);
      setError('Failed to determine survey type. Please try again.');
    }
  };

  const loadAssignedUsers = async () => {
    if (!surveyId) return;
    
    setLoading(true);
    try {
      const users = await surveyAssignmentService.getUsersBySurveyId(surveyId);
      setAssignedUsers(users);
      setError(null);
    } catch (err) {
      console.error('Error loading assigned users:', err);
      setError('Failed to load assigned users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      // Now works with empty query too
      const results = await surveyAssignmentService.searchUsers(searchQuery);
      // Filter out users that are already assigned
      const filteredResults = results.filter(
        user => !assignedUsers.some(assignedUser => assignedUser.id === user.id)
      );
      setSearchResults(filteredResults);
      setError(null);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAssignUser = async (userIdOrEmail) => {
    try {
      await surveyAssignmentService.assignUserToSurvey(surveyId, userIdOrEmail);
      
      // Find the user in search results to add to assigned users
      let userToAssign;
      
      // Check if this is a placeholder user (with an email instead of ID)
      if (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
        // For placeholder users, we need to reload the assigned users list
        // since the backend will create a new user with a real ID
        await loadAssignedUsers();
        setSuccess('User assigned successfully');
        return;
      } else {
        // Regular user with an ID
        userToAssign = searchResults.find(user => user.id === userIdOrEmail);
        if (userToAssign) {
          setAssignedUsers(prev => [...prev, userToAssign]);
          // Remove from search results
          setSearchResults(prev => prev.filter(user => user.id !== userIdOrEmail));
        }
      }
      
      setSuccess('User assigned successfully');
    } catch (err) {
      console.error('Error assigning user:', err);
      setError('Failed to assign user. Please try again.');
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await surveyAssignmentService.removeUserFromSurvey(surveyId, userId);
      // Remove user from assigned users list
      setAssignedUsers(prev => prev.filter(user => user.id !== userId));
      setSuccess('User removed successfully');
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Failed to remove user. Please try again.');
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      const result = await surveyAssignmentService.autoAssignUsers(surveyId);
      await loadAssignedUsers(); // Reload the list after auto-assignment
      setSuccess(`${result.assignmentCount} users auto-assigned successfully`);
      // Close search dialog if open to show updated assigned users
      if (isSearchDialogOpen) {
        closeSearchDialog();
      }
    } catch (err) {
      console.error('Error auto-assigning users:', err);
      setError('Failed to auto-assign users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openSearchDialog = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchDialogOpen(true);
    // Automatically load initial users when dialog opens
    handleSearch();
  };

  const closeSearchDialog = () => {
    setIsSearchDialogOpen(false);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSnackbarClose = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="survey-assignment-dialog-title"
    >
      <DialogTitle id="survey-assignment-dialog-title">
        Manage Survey Assignments
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Manage which users have access to this survey
          </Typography>
          
          {isAnonymousSurvey && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This is an anonymous survey. User assignments are only used to determine who can access the survey. 
              Responses will not be linked to user identities.
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={openSearchDialog}
            >
              Add Users
            </Button>
            
            <Tooltip title="Assign to all users with 'user' role">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<GroupAddIcon />}
                onClick={handleAutoAssign}
              >
                Auto-Assign All Users
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Assigned Users {assignedUsers.length > 0 && `(${assignedUsers.length})`}
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : assignedUsers.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No users are currently assigned to this survey.
          </Alert>
        ) : (
          <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
            <List dense>
              {assignedUsers.map((user) => (
                <ListItem key={user.id}>
                  <ListItemText
                    primary={`${user.firstName || ''} ${user.lastName || ''} (${user.username})`}
                    secondary={user.email}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<PersonRemoveIcon />}
                    onClick={() => handleRemoveUser(user.id)}
                  >
                    Remove
                  </Button>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
      
      {/* User Search Dialog */}
      <Dialog
        open={isSearchDialogOpen}
        onClose={closeSearchDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Users to Survey</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Search Users"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Debounce search as user types
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(() => {
                  handleSearch();
                }, 300);
              }}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSearch}
                      disabled={searchLoading}
                    >
                      {searchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              placeholder="Type to search users or enter a @dynpro.com email to create a placeholder user"
            />
            
            {searchLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={40} />
              </Box>
            ) : searchResults.length > 0 ? (
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {searchResults.map((user) => (
                    <ListItem key={user.id || user.email}>
                      <ListItemText
                        primary={user.isNewPlaceholder 
                          ? `${user.email} (New placeholder user)` 
                          : `${user.firstName || ''} ${user.lastName || ''} (${user.username})`}
                        secondary={user.isNewPlaceholder 
                          ? 'Will be created when user logs in' 
                          : user.email}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleAssignUser(user.isNewPlaceholder ? user.email : user.id)}
                      >
                        Add
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Alert severity="info">
                No matching users found. Try a different search term or clear the search to see all available users.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSearchDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default SurveyAssignmentManager;
