import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import DateRangeIcon from '@mui/icons-material/DateRange';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';

const SurveyResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch survey details
        const surveyData = await surveyService.getSurveyById(id);
        setSurvey(surveyData);
        
        // Fetch responses for this survey
        const responsesData = await responseService.getResponsesBySurveyId(id);
        setResponses(responsesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching survey results:', err);
        setError('Failed to load survey results. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Find the answer for a specific question in a response
  const findAnswer = (response, questionId) => {
    if (!response.answers) return 'No answer';
    
    const answer = response.answers.find(a => a.questionId === questionId);
    return answer ? answer.value : 'No answer';
  };
  
  // Format the answer based on question type
  const formatAnswer = (question, answerValue) => {
    if (!answerValue || answerValue === 'No answer') return 'No answer';
    
    switch (question.type) {
      case 'multiple-choice':
      case 'single-choice':
      case 'multiple_choice':
      case 'multi_select':
      case 'dropdown':
        // For choice questions, try to find the option text
        if (question.options && question.options.length > 0) {
          // Handle comma-separated IDs for multiple choice
          const optionIds = answerValue.split(',');
          return optionIds.map(id => {
            const option = question.options.find(opt => opt.id.toString() === id.trim());
            return option ? option.text : id;
          }).join(', ');
        }
        return answerValue;
        
      case 'rating':
        return `${answerValue} stars`;
        
      default:
        return answerValue;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/app/surveys')}
          >
            Return to Surveys
          </Button>
        </Box>
      </Box>
    );
  }
  
  if (!survey) {
    return null;
  }
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>Survey Results</Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/app/surveys')}
        >
          Back to Surveys
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>{survey.title}</Typography>
        {survey.description && (
          <Typography variant="body1" sx={{ mb: 2 }}>{survey.description}</Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip 
            label={`${responses.length} Responses`} 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`${survey.questions?.length || 0} Questions`} 
            color="secondary" 
            variant="outlined" 
          />
        </Box>
      </Paper>
      
      <Typography variant="h5" sx={{ mb: 2 }}>Response Summary</Typography>
      
      {responses.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No responses have been submitted for this survey yet.
        </Alert>
      ) : (
        <>
          {/* Per-Question Summary */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Question Breakdown</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {survey.questions && survey.questions.map(question => (
              <Accordion key={question.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    <strong>Q{question.order || question.id}:</strong> {question.text}
                    {question.isRequired && <span style={{ color: 'red' }}> *</span>}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Type: {question.type}
                  </Typography>
                  
                  {/* For choice questions, show option breakdown */}
                  {(question.type === 'multiple-choice' || 
                    question.type === 'single-choice' || 
                    question.type === 'multiple_choice' || 
                    question.type === 'dropdown') && question.options && (
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Option</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {question.options.map(option => {
                            // Count how many responses selected this option
                            const count = responses.filter(response => {
                              const answer = findAnswer(response, question.id);
                              return answer.includes(option.id.toString());
                            }).length;
                            
                            const percentage = responses.length > 0 
                              ? Math.round((count / responses.length) * 100) 
                              : 0;
                              
                            return (
                              <TableRow key={option.id}>
                                <TableCell>{option.text}</TableCell>
                                <TableCell align="right">{count}</TableCell>
                                <TableCell align="right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  {/* For text questions, show a sample of answers */}
                  {(question.type === 'text' || question.type === 'free_text') && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Sample Responses:</Typography>
                      {responses.slice(0, 5).map(response => {
                        const answer = findAnswer(response, question.id);
                        return answer !== 'No answer' ? (
                          <Paper key={response.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                            <Typography variant="body2">"{answer}"</Typography>
                            <Typography variant="caption" color="text.secondary">
                              - {response.respondentEmail} ({formatDate(response.submittedAt)})
                            </Typography>
                          </Paper>
                        ) : null;
                      })}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
          
          {/* Individual Responses */}
          <Typography variant="h6" sx={{ mb: 2 }}>Individual Responses</Typography>
          <Grid container spacing={3}>
            {responses.map(response => (
              <Grid item xs={12} md={6} key={response.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} color="action" />
                        <Typography variant="subtitle1">{response.respondentEmail}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DateRangeIcon sx={{ mr: 1 }} color="action" />
                        <Typography variant="body2">{formatDate(response.submittedAt)}</Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          {survey.questions && survey.questions.map(question => (
                            <TableRow key={question.id}>
                              <TableCell sx={{ width: '40%', verticalAlign: 'top' }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {question.text}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatAnswer(question, findAnswer(response, question.id))}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default SurveyResults;
