import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Button,
  Rating,
  Alert,
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import surveyAssignmentService from '../services/surveyAssignmentService';

const SurveyRespond = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Fetch survey data and check if user is assigned to it
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        
        // Get survey data first to check if it's anonymous
        const surveyData = await surveyService.getSurveyById(id);
        setSurvey(surveyData);
        
        // If not anonymous, check if user is assigned
        if (!surveyData.isAnonymous && user) {
          // Get assigned surveys to check if user has access
          const assignedSurveys = await surveyAssignmentService.getAssignedSurveys();
          const isAssigned = assignedSurveys.some(survey => survey.id === parseInt(id));
          
          if (!isAssigned) {
            setError('You do not have access to this survey. It may have been removed from your list.');
            setLoading(false);
            return;
          }
        }
        
        // Initialize answers object
        const initialAnswers = {};
        surveyData.questions.forEach(question => {
          if (question.type === 'multiple-choice' || question.type === 'multi_select') {
            initialAnswers[question.id] = [];
          } else {
            initialAnswers[question.id] = '';
          }
        });
        setAnswers(initialAnswers);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load survey. It may not exist or you may not have permission to access it.');
        setLoading(false);
      }
    };
    
    fetchSurvey();
  }, [id, user]);
  
  // Handle input changes
  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Handle Other text input changes for single-select questions
  const handleOtherTextChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [`${questionId}_other_text`]: value
    }));
  };
  
  // Handle checkbox changes for multiple choice questions
  const handleCheckboxChange = (questionId, optionValue, checked) => {
    setAnswers(prev => {
      const currentValues = [...(prev[questionId] || [])];
      
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, optionValue]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter(val => val !== optionValue)
        };
      }
    });
  };
  
  // Handle Other checkbox for multi-select questions
  const handleOtherCheckboxChange = (questionId, checked) => {
    setAnswers(prev => {
      const currentValues = [...(prev[questionId] || [])];
      
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, 'OTHER'],
          [`${questionId}_other_selected`]: true
        };
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter(val => val !== 'OTHER'),
          [`${questionId}_other_selected`]: false
        };
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    try {
      // If not anonymous, check if user is still assigned to the survey before submitting
      if (!survey.isAnonymous && user) {
        const assignedSurveys = await surveyAssignmentService.getAssignedSurveys();
        const isStillAssigned = assignedSurveys.some(s => s.id === parseInt(id));
        
        if (!isStillAssigned) {
          setSubmitError('You no longer have access to this survey. Your response cannot be submitted.');
          return;
        }
      }
      
      // Validate required fields
      const requiredQuestions = survey.questions.filter(q => q.isRequired);
      const unansweredQuestions = requiredQuestions.filter(q => {
        const answer = answers[q.id];
        return answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);
      });
      
      if (unansweredQuestions.length > 0) {
        setSubmitError(`Please answer all required questions before submitting.`);
        return;
      }
      
      // Process answers with 'Other' option
      const processedAnswers = {};
      
      // Process all answers
      Object.entries(answers).forEach(([key, value]) => {
        // Check if this is a main question ID (not an _other_text or _other_selected field)
        if (!key.includes('_other_')) {
          const questionId = parseInt(key);
          const question = survey.questions.find(q => q.id === questionId);
          
          if (question) {
            // For single-select questions with 'Other' selected
            if (question.type === 'single-choice' && value === 'OTHER') {
              const otherText = answers[`${key}_other_text`] || '';
              processedAnswers[key] = `OTHER: ${otherText}`;
            }
            // For multi-select questions that include 'Other'
            else if (question.type === 'multiple-choice' && Array.isArray(value) && value.includes('OTHER')) {
              const otherText = answers[`${key}_other_text`] || '';
              const otherValues = value.filter(v => v !== 'OTHER');
              if (otherText) {
                otherValues.push(`OTHER: ${otherText}`);
              }
              processedAnswers[key] = otherValues.join(',');
            }
            // For regular answers
            else {
              processedAnswers[key] = Array.isArray(value) ? value.join(',') : value;
            }
          }
        }
      });
      
      // Log questions and options to debug issues
      console.log('Survey questions:', survey.questions);
      
      // Prepare data for submission
      const responseData = {
        surveyId: survey.id,
        answers: Object.entries(processedAnswers).map(([questionId, value]) => {
          // Validate questionId is a number
          const parsedQuestionId = parseInt(questionId, 10);
          if (isNaN(parsedQuestionId)) {
            console.error(`Invalid question ID: ${questionId}`);
          }
          return {
            questionId: parsedQuestionId,
            value: value || '' // Ensure value is never null or undefined
          };
        }).filter(answer => !isNaN(answer.questionId)) // Remove any answers with invalid questionIds
      };
      
      // Log the data being submitted
      console.log('Submitting response data:', responseData);
      
      await responseService.submitResponse(responseData);
      setCompleted(true);
    } catch (err) {
      console.error('Error submitting response:', err);
      setSubmitError('Failed to submit your response. Please try again later.');
    }
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Render question based on its type
  const renderQuestion = (question) => {
    const { id, text, type, isRequired, hasOther, options = [] } = question;
    
    // Helper function to determine if a question should use checkboxes (multi-select)
    const isMultiSelectType = (type) => {
      // Return true for all question types that should use checkboxes
      return type === 'multiple-choice' || type === 'multi_select';
    };
    
    // Helper function to determine if a question should use radio buttons (single-select)
    const isSingleSelectType = (type) => {
      return type === 'single-choice' || type === 'multiple_choice';
    };
    
    return (
      <FormControl component="fieldset" fullWidth required={isRequired}>
        <FormLabel component="legend" sx={{ 
          color: '#2A356D',
          '&.Mui-focused': {
            color: '#2A356D'
          }
        }}>
          {text}
          {isRequired && <Typography component="span" color="error">*</Typography>}
        </FormLabel>
        
        {isSingleSelectType(type) && (
          <>
            <RadioGroup
              aria-label={text}
              name={`question-${id}`}
              value={answers[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
              sx={{ mt: 1 }}
            >
              {options.map((option, optIdx) => (
                <FormControlLabel
                  key={optIdx}
                  value={option.id ? String(option.id) : option}
                  control={
                    <Radio 
                      sx={{ 
                        '&.Mui-checked': {
                          color: '#2A356D'
                        }
                      }}
                    />
                  }
                  label={option.text || option}
                />
              ))}
              
              {hasOther && (
                <FormControlLabel
                  value="OTHER"
                  control={
                    <Radio 
                      sx={{ 
                        '&.Mui-checked': {
                          color: '#2A356D'
                        }
                      }}
                    />
                  }
                  label="Other"
                />
              )}
            </RadioGroup>
            
            {/* Show text field for 'Other' option when selected */}
            {hasOther && answers[id] === 'OTHER' && (
              <TextField
                value={answers[`${id}_other_text`] || ''}
                onChange={(e) => handleOtherTextChange(id, e.target.value)}
                placeholder="Please specify"
                size="small"
                sx={{ mt: 1, ml: 4, width: '80%' }}
                inputProps={{ maxLength: 200 }}
              />
            )}
          </>
        )}
        
        {isMultiSelectType(type) && (
          <>
            <FormGroup sx={{ mt: 1 }}>
              {options.map((option, optIdx) => {
                const optionText = option.text || option;
                const optionValue = option.id ? String(option.id) : option;
                const checked = Array.isArray(answers[id]) && answers[id].includes(optionValue);
                
                return (
                  <FormControlLabel
                    key={optIdx}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(e) => handleCheckboxChange(id, optionValue, e.target.checked)}
                        sx={{ 
                          '&.Mui-checked': {
                            color: '#2A356D'
                          }
                        }}
                      />
                    }
                    label={optionText}
                  />
                );
              })}
              
              {/* Add 'Other' checkbox for multi-select questions */}
              {hasOther && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={answers[`${id}_other_selected`] || false}
                      onChange={(e) => handleOtherCheckboxChange(id, e.target.checked)}
                      sx={{ 
                        '&.Mui-checked': {
                          color: '#2A356D'
                        }
                      }}
                    />
                  }
                  label="Other"
                />
              )}
            </FormGroup>
            
            {/* Show text field for 'Other' option when selected in multi-select */}
            {hasOther && answers[`${id}_other_selected`] && (
              <TextField
                value={answers[`${id}_other_text`] || ''}
                onChange={(e) => handleOtherTextChange(id, e.target.value)}
                placeholder="Please specify"
                size="small"
                sx={{ mt: 1, ml: 4, width: '80%' }}
                inputProps={{ maxLength: 200 }}
              />
            )}
          </>
        )}
        
        {type === 'text' && (
          <TextField
            value={answers[id] || ''}
            onChange={(e) => handleInputChange(id, e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Your answer"
          />
        )}
        
        {type === 'number' && (
          <TextField
            type="number"
            value={answers[id] || ''}
            onChange={(e) => handleInputChange(id, e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Your answer"
          />
        )}
        
        {type === 'date' && (
          <TextField
            type="date"
            value={answers[id] || ''}
            onChange={(e) => handleInputChange(id, e.target.value)}
            fullWidth
            margin="normal"
          />
        )}
        
        {type === 'rating' && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Rating
              name={`question-${id}`}
              value={Number(answers[id]) || 0}
              onChange={(_, newValue) => handleInputChange(id, newValue.toString())}
              sx={{ 
                '& .MuiRating-iconFilled': {
                  color: '#2A356D'
                }
              }}
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {answers[id] ? `${answers[id]} out of 5` : ''}
            </Typography>
          </Box>
        )}
      </FormControl>
    );
  };
  
  // If completed, show thank you message
  if (completed) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 1, sm: 2 } }}>
        <Paper sx={{ 
          p: { xs: 3, sm: 4 }, 
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backgroundColor: '#F7F7FA'
        }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#2A356D' }}>Thank You!</Typography>
          <Typography variant="body1" paragraph>
            Your response has been successfully submitted.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/app/dashboard')}
            sx={{ 
              backgroundColor: '#2A356D',
              '&:hover': {
                backgroundColor: '#1A254D'
              }
            }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 1, sm: 2 } }}>
        <Alert severity="error" sx={{ borderRadius: 1 }}>{error}</Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/app/dashboard')}
            sx={{ 
              backgroundColor: '#2A356D',
              '&:hover': {
                backgroundColor: '#1A254D'
              }
            }}
          >
            Return to Dashboard
          </Button>
        </Box>
      </Box>
    );
  }
  
  // If survey doesn't exist or hasn't loaded yet
  if (!survey) {
    return null;
  }
  
  // Group questions by step (for this example, we'll put 5 questions per step)
  const questionsPerStep = 5;
  const steps = [];
  for (let i = 0; i < survey.questions.length; i += questionsPerStep) {
    steps.push(survey.questions.slice(i, i + questionsPerStep));
  }
  
  // If there's only one step, don't show the stepper
  const showStepper = steps.length > 1;
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 1, sm: 2 } }}>
      <Paper sx={{ 
        p: { xs: 2, sm: 4 },
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: '#F7F7FA'
      }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ color: '#2A356D' }}>
          {survey.title}
        </Typography>
        
        {survey.description && (
          <Typography variant="body1" paragraph align="center">
            {survey.description}
          </Typography>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        {showStepper && (
          <>
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: 4,
                display: { xs: 'none', sm: 'flex' } // Hide on mobile
              }}
            >
              {steps.map((_, index) => (
                <Step key={index}>
                  <StepLabel StepIconProps={{
                    sx: {
                      color: '#85CDD5',
                      '&.Mui-active': { color: '#2A356D' },
                      '&.Mui-completed': { color: '#2A356D' }
                    }
                  }}>
                    Step {index + 1}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Mobile step indicator */}
            <Box sx={{ 
              display: { xs: 'flex', sm: 'none' },
              justifyContent: 'center',
              mb: 3
            }}>
              <Typography variant="subtitle1">
                Step {activeStep + 1} of {steps.length}
              </Typography>
            </Box>
          </>
        )}
        
        <form onSubmit={handleSubmit}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}
          
          {steps[activeStep].map(question => (
            <Box key={question.id} sx={{ mb: 3 }}>
              {renderQuestion(question)}
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {showStepper && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0}
                sx={{ 
                  borderColor: '#2A356D',
                  color: '#2A356D',
                  '&:hover': {
                    borderColor: '#1A254D',
                    backgroundColor: 'rgba(42, 53, 109, 0.04)'
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                Back
              </Button>
            )}
            
            <Box sx={{ flex: '1 1 auto' }} />
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                type="submit"
                sx={{ 
                  backgroundColor: '#2A356D',
                  '&:hover': {
                    backgroundColor: '#1A254D'
                  }
                }}
              >
                Submit
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ 
                  backgroundColor: '#2A356D',
                  '&:hover': {
                    backgroundColor: '#1A254D'
                  }
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default SurveyRespond;
