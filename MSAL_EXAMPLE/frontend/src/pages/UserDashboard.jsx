import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Poll as PollIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import surveyAssignmentService from '../services/surveyAssignmentService';
import { AuthContext } from '../context/AuthContext';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [assignedSurveys, setAssignedSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedSurveys = async () => {
      try {
        setLoading(true);
        // Fetch surveys assigned to the current user
        const response = await surveyAssignmentService.getAssignedSurveys();
        console.log('API response from service:', response);
        
        // The response is the array of surveys directly
        const allSurveys = response || [];
        
        // Filter out completed surveys
        const incompleteSurveys = allSurveys.filter(survey => !survey.completed);
        console.log('Incomplete surveys:', incompleteSurveys);
        
        setAssignedSurveys(incompleteSurveys);
      } catch (error) {
        console.error('Error fetching assigned surveys:', error);
        setAssignedSurveys([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedSurveys();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.username || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here are the surveys assigned to you.
        </Typography>
      </Box>

      {/* Stats Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            borderRadius: 2,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)'
            },
            background: 'linear-gradient(135deg, #2A356D 0%, #1A254D 100%)',
          }}>
            <CardContent sx={{ color: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Assigned Surveys
              </Typography>
              <Typography variant="h3">{assignedSurveys.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 4, 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        backgroundColor: '#F7F7FA'
      }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#2A356D' }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PollIcon />}
              component={RouterLink}
              to="/app/user-surveys"
              sx={{ 
                borderColor: '#2A356D',
                color: '#2A356D',
                '&:hover': {
                  borderColor: '#1A254D',
                  backgroundColor: 'rgba(42, 53, 109, 0.04)'
                }
              }}
            >
              View All Assigned Surveys
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Assigned Surveys */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        backgroundColor: '#F7F7FA'
      }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#2A356D' }}>
          Your Assigned Surveys
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {assignedSurveys.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            You don't have any surveys assigned to you yet.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {assignedSurveys.slice(0, 5).map((survey) => (
              <Grid item xs={12} key={survey.id}>
                <Card variant="outlined" sx={{ 
                  borderRadius: 2, 
                  borderColor: 'rgba(42, 53, 109, 0.2)',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }
                }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={8} md={9}>
                        <Typography variant="h6" sx={{ color: '#2A356D' }}>{survey.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {survey.description && survey.description.length > 100 
                            ? `${survey.description.substring(0, 100)}...` 
                            : survey.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 2, sm: 0 } }}>
                          <Button
                            size="small"
                            variant="contained"
                            component={RouterLink}
                            to={`/app/surveys/respond/${survey.id}`}
                            sx={{ 
                              backgroundColor: '#2A356D',
                              '&:hover': {
                                backgroundColor: '#1A254D'
                              }
                            }}
                          >
                            Take Survey
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {assignedSurveys.length > 5 && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    variant="text" 
                    component={RouterLink} 
                    to="/app/user-surveys"
                    sx={{ 
                      color: '#2A356D',
                      '&:hover': {
                        backgroundColor: 'rgba(42, 53, 109, 0.04)'
                      }
                    }}
                  >
                    View All Assigned Surveys
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default UserDashboard;
