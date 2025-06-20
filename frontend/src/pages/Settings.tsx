import React from 'react';
import { Box, Typography, Paper, Divider, Switch, FormControlLabel, TextField, Button } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          User Preferences
        </Typography>
        <Box sx={{ ml: 2 }}>
          <FormControlLabel 
            control={<Switch defaultChecked />} 
            label="Dark Mode" 
          />
          <FormControlLabel 
            control={<Switch />} 
            label="Email Notifications" 
          />
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" sx={{ mb: 2 }}>
          Account Settings
        </Typography>
        <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '500px' }}>
          <TextField 
            label="Display Name" 
            variant="outlined" 
            defaultValue="User"
          />
          <TextField 
            label="Email" 
            variant="outlined" 
            defaultValue="user@example.com"
            disabled
          />
          <Button variant="contained" color="primary" sx={{ mt: 1, alignSelf: 'flex-start' }}>
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
