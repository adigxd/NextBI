import React, { useState, useContext } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Avatar, 
  Box,
  Chip,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import { 
  Menu as MenuIcon,
  AccountCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// Company branding colors
const primaryColor = '#2A356D';
const secondaryColor = '#85CDD5';
const backgroundColor = '#F7F7FA';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);
  const isAdmin = user && user.role === 'admin';
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // No notifications in this version

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };
  
  const handleViewProfile = () => {
    handleMenuClose();
    navigate('/app/profile');
  };
  
  // No notification handling in this version

  // No notification items in this version

  
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: primaryColor,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={toggleSidebar}
          sx={{ 
            mr: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              component="img"
              src="/logo192.png" 
              alt="DynPro Logo" 
              sx={{ 
                height: { xs: '32px', sm: '36px' }, 
                width: { xs: '32px', sm: '36px' },
                mr: { xs: 1, sm: 2 },
                borderRadius: '50%',
                backgroundColor: 'white',
                padding: '2px',
                objectFit: 'cover',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.2)'
              }}
            />
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{ 
                display: { xs: isMobile ? 'none' : 'block', sm: 'block' },
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              DynPro Surveys
            </Typography>
          </Box>
          {isAdmin && (
            <Chip 
              label="ADMIN" 
              size="small" 
              sx={{ 
                ml: { xs: 1, sm: 2 }, 
                fontWeight: 'bold',
                backgroundColor: secondaryColor,
                color: primaryColor,
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                height: { xs: 20, sm: 24 }
              }} 
            />
          )}
        </Box>
        
        {/* No notifications in this version */}
        
        {/* Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              mr: 1, 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 500
            }}
          >
            {user?.username || 'User'}
          </Typography>
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ 
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <AccountCircle sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }} />
          </IconButton>
        </Box>
      </Toolbar>
      
      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
            minWidth: 180
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${backgroundColor}` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: primaryColor }}>
            {user?.username || 'User'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        <MenuItem 
          onClick={handleViewProfile}
          sx={{ 
            py: 1.5,
            '&:hover': { backgroundColor: backgroundColor }
          }}
        >
          <Typography variant="body2">My Profile</Typography>
        </MenuItem>
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5,
            color: '#f44336',
            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
          }}
        >
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
      
      {/* No notification menu in this version */}
    </AppBar>
  );
};

export default Navbar;
