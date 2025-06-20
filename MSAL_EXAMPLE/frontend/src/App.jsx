import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './config/msalConfig';
import { AuthProvider } from './context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Layout
import Layout from './components/layout/Layout';
import RoleDashboard from './components/RoleDashboard';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import SurveyList from './pages/SurveyList';
import SurveyCreate from './pages/SurveyCreate';
import SurveyEdit from './pages/SurveyEdit';
import SurveyResults from './pages/SurveyResults';
import SurveyRespond from './pages/SurveyRespond';
import UserSurveys from './pages/UserSurveys';
import ArchivedSurveys from './pages/ArchivedSurveys';
import AuditLogs from './pages/AuditLogs';

// Create theme instances for different roles
const userTheme = createTheme({
  palette: {
    primary: {
      main: '#2A356D', // Company primary color
    },
    secondary: {
      main: '#85CDD5', // Company secondary color
    },
    background: {
      default: '#F7F7FA', // Company background color
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Admin theme with light orange color
const adminTheme = createTheme({
  palette: {
    primary: {
      main: '#2A356D', // Company primary color
    },
    secondary: {
      main: '#85CDD5', // Company secondary color
    },
    background: {
      default: '#F7F7FA', // Company background color
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    // Add a subtle indicator for admin theme
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(to right, #2A356D, #1A254D)',
        },
      },
    },
  },
});

// Auth guard component
const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  
  // Only log on first render or when auth state changes
  useEffect(() => {
    console.log('[PrivateRoute] Authentication state:', { user, loading, isAuthenticated });
  }, [user, loading, isAuthenticated]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Check for token in localStorage as a fallback
  const hasToken = localStorage.getItem('token') && localStorage.getItem('user');
  
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin guard component
const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  console.log('[AdminRoute] user:', user, 'loading:', loading, 'isAuthenticated:', isAuthenticated);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    console.log('AdminRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  if (!user || user.role !== 'admin') {
    console.log('AdminRoute: User not admin, redirecting to dashboard', user);
    return <Navigate to="/app/dashboard" />;
  }
  
  console.log('AdminRoute: Admin access granted');
  return children;
};

// Dynamic theme provider based on user role
const DynamicThemeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user && user.role === 'admin';
  
  // Use admin theme if user is admin, otherwise use user theme
  const theme = isAdmin ? adminTheme : userTheme;
  
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Initialize MSAL
        await msalInstance.initialize();
        
        // Handle any redirect promises
        await msalInstance.handleRedirectPromise();
        
        setIsInitialized(true);
      } catch (err) {
        console.error('MSAL initialization error:', err);
        setError(err);
      }
    };
    
    initializeMsal();
  }, []);

  // Loading component while MSAL initializes
  if (!isInitialized && !error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Initializing authentication...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Typography variant="h5" color="error" gutterBottom>Authentication Error</Typography>
        <Typography variant="body1">{error.message || 'Failed to initialize authentication'}</Typography>
      </Box>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <DynamicThemeProvider>
          <CssBaseline />
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<Navigate to="/login" replace />} />
              
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
              
              {/* Legacy routes - redirect to /app/ equivalents */}
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/surveys" element={<Navigate to="/app/surveys" replace />} />
              <Route path="/surveys/create" element={<Navigate to="/app/surveys/create" replace />} />
              <Route path="/surveys/:id/edit" element={<Navigate to="/app/surveys/:id/edit" replace />} />
              <Route path="/surveys/results/:id" element={<Navigate to="/app/surveys/results/:id" replace />} />
              
              {/* Protected /app routes with nested structure */}
              <Route path="/app" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                {/* Dashboard based on user role */}
                <Route path="dashboard" element={<RoleDashboard />} />
                <Route path="user-surveys" element={<UserSurveys />} />
                <Route path="surveys/respond/:id" element={<SurveyRespond />} />
                
                {/* Admin only routes */}
                <Route path="surveys" element={
                  <AdminRoute>
                    <SurveyList />
                  </AdminRoute>
                } />
                <Route path="surveys/create" element={
                  <AdminRoute>
                    <SurveyCreate />
                  </AdminRoute>
                } />
                <Route path="surveys/:id/edit" element={
                  <AdminRoute>
                    <SurveyEdit />
                  </AdminRoute>
                } />
                <Route path="surveys/results/:id" element={
                  <AdminRoute>
                    <SurveyResults />
                  </AdminRoute>
                } />
                <Route path="surveys/archived" element={
                  <AdminRoute>
                    <ArchivedSurveys />
                  </AdminRoute>
                } />
                <Route path="audit-logs" element={
                  <AdminRoute>
                    <AuditLogs />
                  </AdminRoute>
                } />
                <Route path="audit-logs/survey/:surveyId" element={
                  <AdminRoute>
                    <AuditLogs />
                  </AdminRoute>
                } />
                
                {/* Default route within /app */}
                <Route index element={<Dashboard />} />
              </Route>
              
              {/* Redirect to dashboard if route doesn't exist */}
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Routes>
          </Router>
          
          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </DynamicThemeProvider>
      </AuthProvider>
    </MsalProvider>
  );
}

export default App;
