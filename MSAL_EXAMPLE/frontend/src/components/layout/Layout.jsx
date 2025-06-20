import React, { useState, useEffect } from 'react';
import { Box, Toolbar, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Close sidebar by default on mobile devices
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar open={sidebarOpen} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', md: `calc(100% - ${sidebarOpen ? 240 : 56}px)` },
          ml: { xs: 0, md: `${sidebarOpen ? 240 : 56}px` },
          transition: theme => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* This creates space below the app bar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
