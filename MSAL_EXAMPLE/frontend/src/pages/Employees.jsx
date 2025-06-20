import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Avatar, 
  Button, 
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Send as SendIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Mock data - in a real app, this would come from an API
  const employees = [
    { 
      id: 1, 
      name: 'John Smith', 
      position: 'Software Engineer',
      department: 'Engineering',
      email: 'john.smith@dynpro.org',
      phone: '(555) 123-4567',
      location: 'New York Office',
      avatar: 'JS'
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      position: 'Product Manager',
      department: 'Product',
      email: 'sarah.johnson@dynpro.org',
      phone: '(555) 234-5678',
      location: 'San Francisco Office',
      avatar: 'SJ'
    },
    { 
      id: 3, 
      name: 'Michael Chen', 
      position: 'UX Designer',
      department: 'Design',
      email: 'michael.chen@dynpro.org',
      phone: '(555) 345-6789',
      location: 'Remote',
      avatar: 'MC'
    },
    { 
      id: 4, 
      name: 'Emily Wilson', 
      position: 'Marketing Specialist',
      department: 'Marketing',
      email: 'emily.wilson@dynpro.org',
      phone: '(555) 456-7890',
      location: 'Chicago Office',
      avatar: 'EW'
    },
    { 
      id: 5, 
      name: 'David Rodriguez', 
      position: 'Sales Manager',
      department: 'Sales',
      email: 'david.rodriguez@dynpro.org',
      phone: '(555) 567-8901',
      location: 'Miami Office',
      avatar: 'DR'
    },
    { 
      id: 6, 
      name: 'Lisa Thompson', 
      position: 'HR Specialist',
      department: 'Human Resources',
      email: 'lisa.thompson@dynpro.org',
      phone: '(555) 678-9012',
      location: 'New York Office',
      avatar: 'LT'
    },
    { 
      id: 7, 
      name: 'Robert Kim', 
      position: 'Data Scientist',
      department: 'Engineering',
      email: 'robert.kim@dynpro.org',
      phone: '(555) 789-0123',
      location: 'Remote',
      avatar: 'RK'
    },
    { 
      id: 8, 
      name: 'Jennifer Lee', 
      position: 'Financial Analyst',
      department: 'Finance',
      email: 'jennifer.lee@dynpro.org',
      phone: '(555) 890-1234',
      location: 'Boston Office',
      avatar: 'JL'
    }
  ];
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleOpenDialog = (employee) => {
    setSelectedEmployee(employee);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getRandomColor = (id) => {
    const colors = ['#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2', '#0288d1', '#c2185b', '#689f38'];
    return colors[id % colors.length];
  };
  
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Employee Directory
      </Typography>
      
      {/* Search and Filter */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, position, or department..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ maxWidth: 500 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={() => setSearchTerm('')}
                  edge="end"
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          sx={{ ml: 2, height: 56 }}
        >
          Filter
        </Button>
      </Box>
      
      {/* Employee Grid */}
      <Grid container spacing={3}>
        {filteredEmployees.map((employee) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={employee.id}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: getRandomColor(employee.id),
                    fontSize: 32
                  }}
                >
                  {employee.avatar}
                </Avatar>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {employee.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {employee.position}
                </Typography>
                <Chip 
                  label={employee.department} 
                  size="small" 
                  sx={{ 
                    bgcolor: `${getRandomColor(employee.id)}20`,
                    color: getRandomColor(employee.id),
                    fontWeight: 'medium'
                  }} 
                />
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleOpenDialog(employee)}
                >
                  View Profile
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<SendIcon />}
                  onClick={() => window.location.href = `mailto:${employee.email}`}
                >
                  Contact
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Employee Detail Dialog */}
      {selectedEmployee && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            Employee Profile
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: getRandomColor(selectedEmployee.id),
                  fontSize: 40,
                  mr: { xs: 0, sm: 3 },
                  mb: { xs: 2, sm: 0 }
                }}
              >
                {selectedEmployee.avatar}
              </Avatar>
              <Box>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  {selectedEmployee.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {selectedEmployee.position}
                </Typography>
                <Chip 
                  label={selectedEmployee.department} 
                  size="small" 
                  sx={{ 
                    bgcolor: `${getRandomColor(selectedEmployee.id)}20`,
                    color: getRandomColor(selectedEmployee.id),
                    fontWeight: 'medium'
                  }} 
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email"
                  secondary={selectedEmployee.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Phone"
                  secondary={selectedEmployee.phone}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Location"
                  secondary={selectedEmployee.location}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Department"
                  secondary={selectedEmployee.department}
                />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            <Button 
              variant="contained" 
              startIcon={<SendIcon />}
              onClick={() => window.location.href = `mailto:${selectedEmployee.email}`}
            >
              Send Message
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Employees;
