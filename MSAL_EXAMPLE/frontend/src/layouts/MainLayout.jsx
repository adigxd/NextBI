import React, { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Poll as PollIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import AuthContext from '../context/AuthContext';

const drawerWidth = 240;

const MainLayout = ({ darkMode, toggleDarkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define menu items based on user role
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/app',
      roles: ['admin', 'user'], // Both roles can access dashboard
    },
    {
      text: 'All Surveys',
      icon: <PollIcon />,
      path: '/app/surveys',
      roles: ['admin'], // Only admins can view all surveys
    },
    {
      text: 'My Assigned Surveys',
      icon: <PollIcon />,
      path: '/app/surveys/assigned',
      roles: ['user'], // Only users see their assigned surveys
    },
    {
      text: 'Create Survey',
      icon: <AddIcon />,
      path: '/app/surveys/create',
      roles: ['admin'], // Only admins can create surveys
    },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          SurveyRock
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems
          // Filter menu items based on user role
          .filter(item => !item.roles || item.roles.includes(user?.role))
          .map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            SurveyRock
          </Typography>
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Account settings">
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
                <Avatar alt={user?.username || 'User'}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
