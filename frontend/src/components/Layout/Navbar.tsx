import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Box, 
  Avatar, 
  Tooltip, 
  Switch, 
  FormControlLabel
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Navbar = ({ sidebarOpen, toggleSidebar }: NavbarProps) => {
  const { userData, logout } = useAuth();
  const { mode, toggleThemeMode } = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/settings');
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.primary.main,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          79BI
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={toggleThemeMode}
                color="default"
              />
            }
            label={mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
          />
          
          <Tooltip title={userData?.displayName || 'User'}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {userData?.displayName ? (
                <Avatar 
                  sx={{ width: 32, height: 32, backgroundColor: 'secondary.main' }}
                >
                  {userData.displayName[0]}
                </Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Tooltip>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
