import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import SurveyForm from '../components/SurveyForm';

import surveyService from '../services/surveyService';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const SurveyCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = async (surveyData) => {
    try {
      setError(null);
      await surveyService.createSurvey(surveyData);
      navigate('/app/surveys'); // Redirect to survey list with correct prefix
    } catch (err) {
      setError(err.message || 'Failed to create survey');
    }
  };


  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create New Survey</Typography>
      <Paper sx={{ p: 3 }}>
        <SurveyForm onSubmit={handleSubmit} submitLabel="Create Survey" />
      </Paper>
    </Box>
  );
};

export default SurveyCreate;
