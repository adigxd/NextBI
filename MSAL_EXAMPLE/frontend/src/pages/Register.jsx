import React, { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Grid,
  Link,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear previous errors
    setServerError('');
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      navigate('/app');
    } catch (error) {
      setServerError(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={formData.username}
        onChange={handleChange}
        error={!!formErrors.username}
        helperText={formErrors.username}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        error={!!formErrors.email}
        helperText={formErrors.email}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange}
        error={!!formErrors.password}
        helperText={formErrors.password}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={!!formErrors.confirmPassword}
        helperText={formErrors.confirmPassword}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Sign Up
      </Button>
      
      <Grid container justifyContent="flex-end">
        <Grid item>
          <Link component={RouterLink} to="/login" variant="body2">
            {"Already have an account? Sign In"}
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Register;
