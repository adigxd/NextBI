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
  Add as AddIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import axios from 'axios';
import surveyService from '../services/surveyService';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    activeSurveys: 0,
    totalResponses: 0,
  });
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all surveys (pagination can be added later)
        const { surveys } = await surveyService.getSurveys(1, 5);
        
        setStats({
          totalSurveys: surveys.length,
          activeSurveys: surveys.filter(s => s.isPublished).length,
          totalResponses: surveys.reduce((sum, s) => sum + (s.responseCount || 0), 0)
        });
        
        // Show all surveys in the recent surveys list for admin
        setRecentSurveys(surveys.slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2A356D', fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
          Welcome, {user?.username || 'User'}!
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(42, 53, 109, 0.7)' }}>
          Here's an overview of your surveys and responses.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            borderRadius: 2,
            transition: 'transform 0.3s',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-5px)'
            },
            background: 'linear-gradient(135deg, #2A356D 0%, #1A254D 100%)',
          }}>
            <CardContent sx={{ color: 'white', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                Total Surveys
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '2.5rem', sm: '3rem' } }}>{stats.totalSurveys}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            borderRadius: 2,
            transition: 'transform 0.3s',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-5px)'
            },
            background: 'linear-gradient(135deg, #85CDD5 0%, #65BDC5 100%)',
          }}>
            <CardContent sx={{ color: 'white', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                Active Surveys
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '2.5rem', sm: '3rem' } }}>{stats.activeSurveys}</Typography>
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
          {/* Only show Create Survey button for admins */}
          {user?.role === 'admin' && (
            <Grid item>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/app/surveys/create"
                sx={{ 
                  backgroundColor: '#2A356D',
                  '&:hover': {
                    backgroundColor: '#1A254D'
                  },
                  borderRadius: 2,
                  padding: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Create Survey
              </Button>
            </Grid>
          )}
          
          {/* Show different buttons based on user role */}
          {user?.role === 'admin' ? (
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<PollIcon />}
                component={RouterLink}
                to="/app/surveys"
                sx={{ 
                  borderColor: '#2A356D',
                  color: '#2A356D',
                  '&:hover': {
                    borderColor: '#1A254D',
                    backgroundColor: 'rgba(42, 53, 109, 0.04)'
                  },
                  borderRadius: 2,
                  padding: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                View All Surveys
              </Button>
            </Grid>
          ) : (
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
                View My Assigned Surveys
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Recent Surveys - Only show for admin users */}
      {user?.role === 'admin' && (
        <Paper sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          backgroundColor: '#F7F7FA'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2A356D' }}>
            Recent Surveys
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {recentSurveys.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              You haven't created any surveys yet.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {recentSurveys.map((survey) => (
                <Grid item xs={12} key={survey.id}>
                  <Card variant="outlined" sx={{ 
                    borderRadius: 2, 
                    borderColor: 'rgba(42, 53, 109, 0.2)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      borderColor: '#85CDD5'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6" sx={{ color: '#2A356D', fontWeight: 500 }}>{survey.title}</Typography>
                          <Typography variant="body2" sx={{ color: survey.isPublished ? '#4caf50' : '#ff9800', fontWeight: 500, mt: 1 }}>
                            Status: {survey.isPublished ? 'Published' : 'Draft'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(42, 53, 109, 0.7)', mt: 0.5 }}>
                            Created: {new Date(survey.createdAt).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body1" sx={{ 
                            color: '#2A356D', 
                            fontWeight: 500,
                            mt: { xs: 1, sm: 0 }
                          }}>
                            {survey.responseCount} Responses
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: { xs: 'wrap', md: 'nowrap' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 2, sm: 0 } }}>
                            <Button
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              to={`/app/surveys/edit/${survey.id}`}
                              sx={{ 
                                borderColor: '#2A356D',
                                color: '#2A356D',
                                mb: { xs: 1, md: 0 },
                                '&:hover': {
                                  borderColor: '#1A254D',
                                  backgroundColor: 'rgba(42, 53, 109, 0.04)'
                                }
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              to={`/app/surveys/results/${survey.id}`}
                              startIcon={<AssessmentIcon />}
                              sx={{ 
                                borderColor: '#85CDD5',
                                color: '#2A356D',
                                '&:hover': {
                                  borderColor: '#65BDC5',
                                  backgroundColor: 'rgba(133, 205, 213, 0.1)'
                                }
                              }}
                            >
                              Results
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;
