import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import surveyService from '../services/surveyService';
// Removed responseService import as we won't be using it
import surveyAssignmentService from '../services/surveyAssignmentService';

const UserSurveys = () => {
  const navigate = useNavigate();
  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Removed completedSurveys state since we won't be showing them

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        
        // Get surveys assigned to the user
        console.log('Fetching assigned surveys...');
        const assignedSurveys = await surveyAssignmentService.getAssignedSurveys();
        console.log('Assigned surveys received:', assignedSurveys);
        
        // Only show published surveys
        const available = assignedSurveys.filter(survey => survey.isPublished);
        console.log('Available surveys:', available.length);
        
        setAvailableSurveys(available);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching surveys:', err);
        setError('Failed to load surveys. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchSurveys();
  }, []);

  // Filter surveys based on search term
  const filteredAvailableSurveys = availableSurveys.filter(survey => 
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days remaining for a survey
  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, sm: 8 } }}>
        <CircularProgress sx={{ color: '#2A356D' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 1, sm: 0 } }}>
        <Alert severity="error" sx={{ borderRadius: 1 }}>{error}</Alert>
      </Box>
    );
  }
  
  // If no surveys are available, show a message
  if (availableSurveys.length === 0) {
    return (
      <Box sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 1, sm: 0 } }}>
        <Alert severity="info" sx={{ borderRadius: 1, backgroundColor: 'rgba(133, 205, 213, 0.1)', color: '#2A356D' }}>
          You don't have any surveys assigned to you at this time. Please check back later or contact an administrator.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 0 } }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#2A356D' }}>Available Surveys</Typography>
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search surveys..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#2A356D' }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#2A356D',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2A356D',
              },
            },
          }}
        />
        
        {filteredAvailableSurveys.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 1, backgroundColor: 'rgba(133, 205, 213, 0.1)', color: '#2A356D' }}>
            No available surveys found. Check back later for new surveys.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredAvailableSurveys.map(survey => {
              const daysRemaining = getDaysRemaining(survey.endDateTime);
              return (
                <Grid item xs={12} sm={6} md={4} key={survey.id}>
                  <Card 
                    elevation={3}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      borderRadius: 2,
                      backgroundColor: '#F7F7FA',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(42, 53, 109, 0.15)'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AssignmentIcon sx={{ mr: 1, color: '#2A356D' }} />
                        <Typography variant="h6" component="h2" noWrap sx={{ color: '#2A356D' }}>
                          {survey.title}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {survey.description || 'No description provided.'}
                      </Typography>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip 
                          label={`${survey.questions?.length || 0} Questions`} 
                          size="small" 
                          sx={{ 
                            borderColor: '#2A356D',
                            color: '#2A356D'
                          }}
                          variant="outlined"
                        />
                        {survey.endDateTime && (
                          <Chip 
                            label={`${Math.max(0, getDaysRemaining(survey.endDateTime))} days left`} 
                            size="small" 
                            sx={{ 
                              borderColor: getDaysRemaining(survey.endDateTime) < 3 ? '#f44336' : '#85CDD5',
                              color: getDaysRemaining(survey.endDateTime) < 3 ? '#f44336' : '#2A356D'
                            }}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        fullWidth 
                        variant="contained"
                        onClick={() => survey.completed ? null : navigate(`/app/surveys/respond/${survey.id}`)}
                        disabled={survey.completed}
                        sx={{ 
                          backgroundColor: survey.completed ? '#e0e0e0' : '#2A356D',
                          color: survey.completed ? '#757575' : 'white',
                          '&:hover': {
                            backgroundColor: survey.completed ? '#e0e0e0' : '#1A254D'
                          },
                          cursor: survey.completed ? 'default' : 'pointer'
                        }}
                      >
                        {survey.completed ? 'Completed' : 'Take Survey'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default UserSurveys;
