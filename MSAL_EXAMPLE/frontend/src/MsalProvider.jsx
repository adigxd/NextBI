import React from 'react';
import { MsalProvider as MSALProvider, MsalAuthenticationTemplate } from '@azure/msal-react';
import { PublicClientApplication, InteractionType, EventType, BrowserCacheLocation } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './config/msalConfig';
import { CircularProgress, Box, Typography } from '@mui/material';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Register event callbacks for login/logout success and failure
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log("Login successful", event);
  } else if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error("Login failed", event);
  } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
    console.log("Logout successful", event);
  }
});

// Loading component for initial auth check
const Loading = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <CircularProgress />
    <Typography variant="body1" sx={{ mt: 2 }}>
      Authenticating...
    </Typography>
  </Box>
);

// Error component for auth errors
const ErrorComponent = ({ error }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <Typography variant="h6" color="error">
      Authentication Error
    </Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      {error?.message || "Unknown authentication error"}
    </Typography>
  </Box>
);

// MSAL Provider component - simplified to avoid initialization issues
const MsalProvider = ({ children }) => {
  return (
    <MSALProvider instance={msalInstance}>
      {children}
    </MSALProvider>
  );
};

// Authentication template for protected routes
export const MsalAuthTemplate = ({ children }) => {
  return (
    <MsalAuthenticationTemplate 
      interactionType={InteractionType.Redirect}
      authenticationRequest={loginRequest}
      loadingComponent={Loading}
      errorComponent={ErrorComponent}
    >
      {children}
    </MsalAuthenticationTemplate>
  );
};

export default MsalProvider;
