import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import SurveyForm from '../components/SurveyForm';
import surveyService from '../services/surveyService';

const SurveyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        setError(null);
        const survey = await surveyService.getSurveyById(id);
        setInitialData(survey);
      } catch (err) {
        setError('Failed to load survey');
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id]);

  const handleSubmit = async (surveyData) => {
    try {
      setError(null);
      await surveyService.updateSurvey(id, surveyData);
      navigate('/app/surveys');
    } catch (err) {
      setError('Failed to update survey');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Edit Survey</Typography>
      {loading ? (
        <Typography>Loading survey data...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <SurveyForm initialData={initialData || {}} onSubmit={handleSubmit} />
      )}
    </Box>
  );
};

export default SurveyEdit;
