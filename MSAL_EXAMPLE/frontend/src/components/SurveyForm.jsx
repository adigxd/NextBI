import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  IconButton,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward, FileDownload } from '@mui/icons-material';
import axios from 'axios';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice (Select One)' },
  { value: 'multi_select', label: 'Multi-Select (Select Multiple)' },
  { value: 'free_text', label: 'Free Text' }
];

const defaultQuestion = () => ({
  type: 'multiple_choice',
  text: '',
  options: [''],
  isRequired: false,
  hasOther: false
});

// Convert backend question type to frontend format
const normalizeQuestionType = (backendType) => {
  switch(backendType) {
    case 'single-choice': return 'multiple_choice';
    case 'multiple-choice': return 'multi_select';
    case 'text': return 'free_text';
    // Add mappings for other types as needed
    default: return backendType && backendType.includes('-') 
      ? backendType.replace('-', '_') 
      : backendType || 'multiple_choice';
  }
};

const SurveyForm = ({ initialData = {}, onSubmit, submitLabel = 'Save Survey' }) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [isAnonymous, setIsAnonymous] = useState(initialData.isAnonymous || false);
  const [isPublic, setIsPublic] = useState(initialData.isPublic || false);
  
  // Normalize question types from backend format to frontend format
  const normalizedQuestions = initialData.questions 
    ? initialData.questions.map(q => ({
        ...q,
        type: normalizeQuestionType(q.type),
        // Ensure options is an array of strings for choice questions
        options: q.options 
          ? q.options.map(opt => typeof opt === 'object' ? opt.text : opt)
          : ['', ''],
        // Ensure isRequired is a boolean
        isRequired: q.isRequired === true,
        // Ensure hasOther is a boolean
        hasOther: q.hasOther === true
      }))
    : [defaultQuestion()];
  
  const [questions, setQuestions] = useState(normalizedQuestions);
  const [error, setError] = useState(null);

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const newOptions = q.options.map((opt, oi) => oi === optIdx ? value : opt);
      return { ...q, options: newOptions };
    }));
  };

  const addOption = (qIdx) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ''] } : q));
  };

  const removeOption = (qIdx, optIdx) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const newOptions = q.options.filter((_, oi) => oi !== optIdx);
      return { ...q, options: newOptions };
    }));
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, defaultQuestion()]);
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx, direction) => {
    setQuestions(prev => {
      const newQs = [...prev];
      const [removed] = newQs.splice(idx, 1);
      newQs.splice(direction === 'up' ? idx - 1 : idx + 1, 0, removed);
      return newQs;
    });
  };

  const handleTypeChange = (idx, newType) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      if (newType === 'free_text') return { ...q, type: newType, options: [] };
      if (q.type === 'free_text') return { ...q, type: newType, options: [''] };
      return { ...q, type: newType };
    }));
  };

  const validate = () => {
    if (!title.trim()) return 'Survey title is required.';
    if (questions.length === 0) return 'At least one question is required.';
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) return `Question ${i + 1} text is required.`;
      if ((q.type === 'multiple_choice' || q.type === 'multi_select')) {
        if (!q.options || q.options.length < 2) return `Question ${i + 1} must have at least 2 options.`;
        if (q.options.some(opt => !opt.trim())) return `All options in question ${i + 1} must be filled.`;
      }
    }
    return null;
  };

  // Convert frontend question type to backend format
  const mapQuestionType = (type) => {
    switch(type) {
      case 'multiple_choice': return 'single-choice';
      case 'multi_select': return 'multiple-choice';
      case 'free_text': return 'text';
      // Handle any other frontend types
      default: return type && type.includes('_')
        ? type.replace('_', '-')
        : type || 'text';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (onSubmit) {
      const surveyData = {
        title,
        description,
        isAnonymous,
        isPublic,
        isPublished: false, // Default to unpublished
        questions: questions.map(q => ({
          text: q.text,
          type: mapQuestionType(q.type),
          isRequired: q.isRequired === true,
          hasOther: q.hasOther === true,
          options: (q.type === 'multiple_choice' || q.type === 'multi_select' || q.type === 'dropdown')
            ? q.options.map(opt => ({ text: opt }))
            : undefined,
        }))
      };
      onSubmit(surveyData);
    }
  };


  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3, 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        backgroundColor: '#F7F7FA'
      }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#2A356D' }}>Survey Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
          {!initialData.id && (
            <>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Anonymous Survey (responses cannot be traced back to individual users)"
                  sx={{ mb: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPublic}
                      onChange={e => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Public Survey (available to all users without requiring assignment)"
                  sx={{ mb: 1 }}
                />
              </Grid>
            </>
          )}
          {initialData.id && (
            <>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Anonymous Survey:</strong> {isAnonymous ? 'Yes' : 'No'} (cannot be changed after creation)
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Public Survey:</strong> {isPublic ? 'Yes' : 'No'} (cannot be changed after creation)
                </Typography>
              </Grid>
            </>
          )}
          {(!initialData.id && isAnonymous) && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Anonymous Survey:</strong> When enabled, responses will be completely anonymous. The system will track that a user has submitted a response to prevent duplicate submissions, but will not link the specific answers to the user's identity.
                </Typography>
              </Alert>
            </Grid>
          )}
          {(!initialData.id && isPublic) && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Public Survey:</strong> When enabled, this survey will be visible to all users without requiring individual assignment. It will appear in every user's survey list as long as it's published.
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h5" gutterBottom sx={{ mt: 4, color: '#2A356D' }}>Questions</Typography>
      {questions.map((q, idx) => (
        <Paper key={idx} sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          backgroundColor: '#F7F7FA',
          border: '1px solid rgba(42, 53, 109, 0.1)'
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                label={`Question ${idx + 1}`}
                value={q.text}
                onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                fullWidth
                required
              />
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={q.isRequired}
                        onChange={(e) => handleQuestionChange(idx, 'isRequired', e.target.checked)}
                        sx={{ 
                          '&.Mui-checked': {
                            color: '#2A356D',
                          }
                        }}
                      />
                    }
                    label="Required"
                  />
                  {(q.type === 'multiple_choice' || q.type === 'multi_select') && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={q.hasOther}
                          onChange={(e) => handleQuestionChange(idx, 'hasOther', e.target.checked)}
                          sx={{ 
                            '&.Mui-checked': {
                              color: '#2A356D',
                            }
                          }}
                        />
                      }
                      label="Add 'Other' option"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Type"
                value={q.type}
                onChange={e => handleTypeChange(idx, e.target.value)}
                fullWidth
              >
                {QUESTION_TYPES.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {(q.type === 'multiple_choice' || q.type === 'multi_select' || q.type === 'dropdown') && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>Options</Typography>
                {q.options.map((opt, optIdx) => (
                  <Box key={optIdx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField
                      label={`Option ${optIdx + 1}`}
                      value={opt}
                      onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                      sx={{ flex: 1 }}
                      required
                    />
                    <IconButton
                      aria-label="remove option"
                      onClick={() => removeOption(idx, optIdx)}
                      disabled={q.options.length <= 2}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addOption(idx)}
                  sx={{ 
                    mt: 1,
                    borderColor: '#2A356D',
                    color: '#2A356D',
                    '&:hover': {
                      borderColor: '#1A254D',
                      backgroundColor: 'rgba(42, 53, 109, 0.04)'
                    }
                  }}
                >
                  Add Option
                </Button>
              </Grid>
            )}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <IconButton
                aria-label="move up"
                onClick={() => moveQuestion(idx, 'up')}
                disabled={idx === 0}
                sx={{ 
                  color: '#2A356D',
                  '&.Mui-disabled': {
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
              >
                <ArrowUpward />
              </IconButton>
              <IconButton
                aria-label="move down"
                onClick={() => moveQuestion(idx, 'down')}
                disabled={idx === questions.length - 1}
                sx={{ 
                  color: '#2A356D',
                  '&.Mui-disabled': {
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
              >
                <ArrowDownward />
              </IconButton>
              <IconButton
                aria-label="delete question"
                onClick={() => removeQuestion(idx)}
                disabled={questions.length === 1}
                sx={{ 
                  color: '#f44336',
                  '&.Mui-disabled': {
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={addQuestion}
        sx={{ 
          mb: 2,
          backgroundColor: '#2A356D',
          '&:hover': {
            backgroundColor: '#1A254D'
          }
        }}
      >
        Add Question
      </Button>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {initialData.id && (
          <Tooltip title="Export survey questions to CSV">
            <Button 
              variant="outlined" 
              startIcon={<FileDownload />}
              onClick={() => {
                // Create a direct download link for the CSV export
                window.open(`/csv/export/${initialData.id}`, '_blank');
              }}
              sx={{ 
                borderColor: '#2A356D',
                color: '#2A356D',
                '&:hover': {
                  borderColor: '#1A254D',
                  backgroundColor: 'rgba(42, 53, 109, 0.04)'
                }
              }}
            >
              Export to CSV
            </Button>
          </Tooltip>
        )}
        <Button 
          type="submit" 
          variant="contained"
          sx={{ 
            backgroundColor: '#2A356D',
            '&:hover': {
              backgroundColor: '#1A254D'
            }
          }}
        >
          {submitLabel}
        </Button>
      </Box>
    </Box>
  );
};

export default SurveyForm;
