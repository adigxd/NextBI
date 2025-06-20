import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  TextField,
  Box,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ImportSurveyModal = ({ open, onClose }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    // Validate file type
    if (selectedFile && !selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are allowed');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    if (!title.trim()) {
      setError('Survey title is required');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('isAnonymous', isAnonymous);
    formData.append('isPublic', isPublic);

    try {
      const response = await axios.post('/csv/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setLoading(false);
      onClose();
      
      // Navigate to the edit page for the newly created survey
      navigate(`/app/surveys/edit/${response.data.surveyId}`);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to import survey');
      console.error('Error importing survey:', err);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setIsAnonymous(false);
    setIsPublic(false);
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogTitle sx={{ color: '#2A356D', fontWeight: 500 }}>Import Survey from CSV</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Upload a CSV file to import survey questions and options. The CSV must have columns for 
          questionText, questionType, and options (for choice questions).
        </DialogContentText>
        
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>}
        
        <TextField
          autoFocus
          margin="dense"
          label="Survey Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          label="Survey Description (Optional)"
          fullWidth
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Typography variant="body2">Survey Settings:</Typography>
          <div>
            <input
              type="checkbox"
              id="isAnonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <label htmlFor="isAnonymous" style={{ marginLeft: '8px' }}>
              Anonymous Survey (responses cannot be traced back to individual users)
            </label>
          </div>
          
          <div>
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="isPublic" style={{ marginLeft: '8px' }}>
              Public Survey (available to all users without requiring assignment)
            </label>
          </div>
        </Box>
        
        <Box sx={{ 
          border: '1px dashed #2A356D', 
          p: { xs: 2, sm: 3 }, 
          textAlign: 'center',
          borderRadius: 1,
          backgroundColor: '#F7F7FA'
        }}>
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ 
                backgroundColor: '#2A356D',
                '&:hover': {
                  backgroundColor: '#1A254D'
                }
              }}
            >
              Select CSV File
            </Button>
          </label>
          
          {file && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption">
            Note: The CSV file should include columns for question text, question type, options for choice questions.
            Example format: questionText, questionType, options (pipe-separated)
          </Typography>
          <Typography variant="caption">
            Valid question types: single-choice, multiple-choice, text
          </Typography>
          <Button 
            variant="text" 
            size="small" 
            href="/sample-survey-import.csv"
            download
            sx={{ 
              alignSelf: 'flex-start',
              color: '#2A356D',
              '&:hover': {
                backgroundColor: 'rgba(42, 53, 109, 0.04)'
              }
            }}
          >
            Download Sample CSV Template
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ 
            color: '#2A356D',
            '&:hover': {
              backgroundColor: 'rgba(42, 53, 109, 0.04)'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!file || !title || loading}
          startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null}
          sx={{ 
            backgroundColor: '#2A356D',
            '&:hover': {
              backgroundColor: '#1A254D'
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(42, 53, 109, 0.3)'
            }
          }}
        >
          {loading ? 'Importing...' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportSurveyModal;
