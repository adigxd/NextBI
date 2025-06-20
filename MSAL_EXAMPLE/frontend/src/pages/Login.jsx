import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { Microsoft as MicrosoftIcon } from '@mui/icons-material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
// Manual login is now handled by AuthContext

const Login = () => {
  const { login, manualLogin, isAuthenticated, loading } = useContext(AuthContext);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const navigate = useNavigate();

  // Check for token on component mount and redirect if found
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Only navigate if we have both token and user data
    if ((token && user) || isAuthenticated) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        console.log('Navigating to dashboard after authentication check');
        navigate('/app/dashboard');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
      // The navigation will happen automatically in the useEffect above
    } catch (error) {
      console.error('Login error:', error);
      setIsLoggingIn(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setManualLoading(true);
      const user = await manualLogin(email, password);
      
      if (user) {
        // Manually navigate after a short delay to ensure state is updated
        setTimeout(() => {
          console.log('Manual login successful, navigating to dashboard');
          navigate('/app/dashboard', { replace: true });
        }, 300);
      }
    } catch (error) {
      console.error('Manual login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setManualLoading(false);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        p: 3,
      }}
    >
      <Paper 
        elevation={3} 
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Welcome to SurveyRock
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Sign in with your Microsoft account to continue
        </Typography>
        
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<MicrosoftIcon />}
          onClick={handleMicrosoftLogin}
          disabled={loading || manualLoading}
          sx={{
            mt: 2,
            mb: 3,
            backgroundColor: '#2f2f2f',
            '&:hover': {
              backgroundColor: '#1f1f1f',
            },
            py: 1.2,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Microsoft'}
        </Button>
        
        <Divider sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Sign in with email and password
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleManualLogin} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={manualLoading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={manualLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={manualLoading}
          >
            {manualLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>

        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
