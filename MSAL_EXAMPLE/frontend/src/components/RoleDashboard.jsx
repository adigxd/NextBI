import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import UserDashboard from '../pages/UserDashboard';
import { Box, CircularProgress } from '@mui/material';

// Role-based dashboard component that renders the appropriate dashboard based on user role
const RoleDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return user?.role === 'admin' ? <Dashboard /> : <UserDashboard />;
};

export default RoleDashboard;
