import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar,
  Divider,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  SwipeableDrawer
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Event as EventIcon,
  Forum as ForumIcon,
  Description as DocumentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Assignment as SurveyIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

// Drawer width
const drawerWidth = 240;
const drawerCollapsedWidth = 56;

// Company branding colors
const primaryColor = '#2A356D';
const secondaryColor = '#85CDD5';
const backgroundColor = '#F7F7FA';

const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  // Get user role from AuthContext
  const { user } = useContext(AuthContext);
  const isAdmin = user && user.role === 'admin';
  
  // Common menu items for all users
  const commonMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/app/dashboard' },
  ];
  
  // Admin-only menu items
  const adminMenuItems = [
    { text: 'Manage Surveys', icon: <SurveyIcon />, path: '/app/surveys' },
  ];
  
  // User-only menu items
  const userMenuItems = [
    { text: 'Available Surveys', icon: <SurveyIcon />, path: '/app/user-surveys' },
  ];
  
  // Combine appropriate menu items based on user role
  const menuItems = [
    ...commonMenuItems,
    ...(isAdmin ? adminMenuItems : userMenuItems),
  ];

  const bottomMenuItems = [
    { text: 'Logout', icon: <LogoutIcon />, action: () => {
        logout();
        navigate('/login');
      }
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Render different drawer types based on screen size
  const DrawerComponent = isMobile ? SwipeableDrawer : Drawer;
  const drawerVariant = isMobile ? 'temporary' : 'permanent';
  
  // Sidebar content to be reused in both mobile and desktop versions
  const sidebarContent = (
    <Box sx={{ overflow: 'auto' }}>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button="true"
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{ 
              bgcolor: location.pathname === item.path ? `rgba(42, 53, 109, 0.08)` : 'transparent',
              '&:hover': {
                bgcolor: `rgba(42, 53, 109, 0.12)`,
              },
              borderLeft: location.pathname === item.path ? `4px solid ${primaryColor}` : '4px solid transparent',
              py: 1.5,
              px: { xs: 2, sm: 3 }
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? '#2A356D' : 'inherit',
                minWidth: open ? 56 : 'auto',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                color: location.pathname === item.path ? '#2A356D' : 'inherit',
                display: !open && !isMobile ? 'none' : 'block',
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {bottomMenuItems.map((item) => (
          <ListItem 
            button="true"
            key={item.text}
            onClick={item.action ? item.action : () => handleNavigation(item.path)}
            sx={{ 
              bgcolor: location.pathname === item.path ? `rgba(42, 53, 109, 0.08)` : 'transparent',
              '&:hover': {
                bgcolor: `rgba(42, 53, 109, 0.12)`,
              },
              borderLeft: location.pathname === item.path ? `4px solid ${primaryColor}` : '4px solid transparent',
              py: 1.5,
              px: { xs: 2, sm: 3 }
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? '#2A356D' : 'inherit',
                minWidth: open ? 56 : 'auto',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                color: location.pathname === item.path ? '#2A356D' : 'inherit',
                display: !open && !isMobile ? 'none' : 'block',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
    <DrawerComponent
      variant={drawerVariant}
      open={open}
      onClose={isMobile ? () => handleNavigation('/app/dashboard') : undefined}
      onOpen={isMobile ? () => {} : undefined}
      sx={{
        width: open ? drawerWidth : drawerCollapsedWidth,
        flexShrink: 0,
        display: { xs: isMobile && !open ? 'none' : 'block' },
        [`& .MuiDrawer-paper`]: { 
          width: open ? drawerWidth : drawerCollapsedWidth, 
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: backgroundColor,
          boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
          ...(!open && !isMobile && {
            width: drawerCollapsedWidth,
            overflowX: 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }),
          ...(open && !isMobile && {
            width: drawerWidth,
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        },
      }}
    >
      <Toolbar />
      {sidebarContent}
    </DrawerComponent>
  );
};

export default Sidebar;
