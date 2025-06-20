import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  ListItemIcon,
  Avatar, 
  IconButton, 
  Divider, 
  Paper,
  Tabs,
  Tab,
  Badge,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Button
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Announcement as AnnouncementIcon,
  Event as EventIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

const Notifications = () => {
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // TODO: Fetch notifications from backend if available
  const [allNotifications, setAllNotifications] = useState([]);
  
  useEffect(() => {
    // Fetch notifications from backend if available
    // For now, just set an empty array
    setAllNotifications([]);
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleMenuOpen = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleMarkAsRead = () => {
    // In a real app, this would call an API to update the notification status
    handleMenuClose();
  };
  
  const handleDeleteNotification = () => {
    // In a real app, this would call an API to delete the notification
    handleMenuClose();
  };
  
  const getFilteredNotifications = () => {
    switch (tabValue) {
      case 0: // All
        return allNotifications;
      case 1: // Unread
        return allNotifications.filter(notification => !notification.read);
      case 2: // Announcements
        return allNotifications.filter(notification => notification.type === 'announcement');
      case 3: // Events
        return allNotifications.filter(notification => notification.type === 'event');
      default:
        return allNotifications;
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <AnnouncementIcon />;
      case 'event':
        return <EventIcon />;
      case 'alert':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <NotificationsIcon />;
    }
  };
  
  const getNotificationColor = (type) => {
    switch (type) {
      case 'announcement':
        return '#1976d2'; // blue
      case 'event':
        return '#388e3c'; // green
      case 'alert':
        return '#d32f2f'; // red
      case 'info':
        return '#f57c00'; // orange
      default:
        return '#757575'; // grey
    }
  };
  
  const filteredNotifications = getFilteredNotifications();
  const unreadCount = allNotifications.filter(n => !n.read).length;
  
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Notifications
      </Typography>
      
      <Paper elevation={2} sx={{ borderRadius: 2, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ flexGrow: 1 }}
          >
            <Tab label="All" />
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  Unread
                </Badge>
              } 
            />
            <Tab label="Announcements" />
            <Tab label="Events" />
          </Tabs>
          <Tooltip title="Filter options">
            <IconButton sx={{ mr: 1 }}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {filteredNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications to display
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    py: 2,
                    bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                  }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="more options"
                      onClick={(event) => handleMenuOpen(event, notification)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography 
                          variant="subtitle1" 
                          component="span"
                          fontWeight={notification.read ? "regular" : "medium"}
                        >
                          {notification.title}
                        </Typography>
                        <Chip 
                          label={notification.type} 
                          size="small" 
                          sx={{ 
                            ml: 1,
                            bgcolor: `${getNotificationColor(notification.type)}20`,
                            color: getNotificationColor(notification.type),
                            fontWeight: 'medium',
                            textTransform: 'capitalize'
                          }} 
                        />
                        {!notification.read && (
                          <Box 
                            component="span" 
                            sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: 'primary.main',
                              display: 'inline-block',
                              ml: 1
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {notification.timestamp}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {filteredNotifications.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            startIcon={<CheckCircleIcon />}
          >
            Mark All as Read
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
          >
            Clear All
          </Button>
        </Box>
      )}
      
      {/* Notification Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkAsRead}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {selectedNotification?.read ? 'Mark as Unread' : 'Mark as Read'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteNotification}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Notifications;
