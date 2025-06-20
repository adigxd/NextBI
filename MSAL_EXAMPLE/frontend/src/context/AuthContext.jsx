import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated, useMsalAuthentication } from '@azure/msal-react';
import { InteractionType, InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';
import { loginRequest, silentRequest, getUserInfo } from '../config/msalConfig';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authMethod, setAuthMethod] = useState(null); // 'msal' or 'manual'
  
  // Attempt silent authentication on mount
  const { result, error: msalError } = useMsalAuthentication(InteractionType.Silent, silentRequest);

  // Get access token for API calls
  const getAccessToken = useCallback(async () => {
    if (accounts.length === 0) return null;
    
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      return tokenResponse.accessToken;
    } catch (error) {
      // If silent token acquisition fails, fallback to interactive method
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const tokenResponse = await instance.acquireTokenPopup(loginRequest);
          return tokenResponse.accessToken;
        } catch (err) {
          console.error('Error acquiring token interactively:', err);
          return null;
        }
      }
      console.error('Error acquiring token silently:', error);
      return null;
    }
  }, [instance, accounts]);

  // Set up axios interceptor to add token to requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      // Use JWT token from localStorage instead of MSAL token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Adding JWT token to request');
      } else if (isAuthenticated) {
        // If no JWT token but MSAL is authenticated, we might need to exchange tokens
        console.log('No JWT token found, but MSAL is authenticated');
      }
      return config;
    }, (error) => Promise.reject(error));
    
    return () => axios.interceptors.request.eject(interceptor);
  }, [isAuthenticated]);

  // Exchange MSAL token for JWT token
  const exchangeTokenForJWT = useCallback(async (userInfo) => {
    try {
      console.log('Exchanging MSAL token for JWT token, user info:', userInfo);
      
      if (!userInfo || !userInfo.email) {
        console.error('No email found in user info');
        setError('Failed to get user email from Microsoft account');
        return null;
      }
      
      console.log('Sending token exchange request for email:', userInfo.email);
      
      const response = await axios.post('/auth/msal-exchange', {
        email: userInfo.email
      });
      
      // Get the user data from the response
      const userData = response.data.user;
      
      // Check if there's an existing user in localStorage with admin role
      const existingUserStr = localStorage.getItem('user');
      if (existingUserStr) {
        try {
          const existingUser = JSON.parse(existingUserStr);
          // If the existing user has admin role but the new user doesn't,
          // preserve the admin role
          if (existingUser.role === 'admin' && userData.role !== 'admin' && 
              existingUser.email === userData.email) {
            console.log('Preserving admin role from previous session');
            userData.role = 'admin';
          }
        } catch (err) {
          console.error('Error parsing existing user data:', err);
        }
      }
      
      // Store the JWT token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update user state with the user info from the backend
      setUser(userData);
      console.log('Token exchange successful', userData);
      
      return userData;
    } catch (error) {
      console.error('Token exchange error:', error);
      setError('Failed to authenticate with backend');
      return null;
    }
  }, []);

  // Update user state when accounts change or on initial load
  useEffect(() => {
    const handleAccountChange = async () => {
      // First check if we have a valid JWT token in localStorage
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedAuthMethod = localStorage.getItem('authMethod');
      
      if (storedToken && storedUser) {
        // If we have a stored token and user, restore the session
        // without showing an authentication error
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAuthMethod(storedAuthMethod || 'manual'); // Default to manual if not set
          console.log(`Restored user session from localStorage using ${storedAuthMethod || 'manual'} auth`);
          setLoading(false);
          setError(null); // Clear any existing errors
        } catch (err) {
          console.error('Error parsing stored user:', err);
          localStorage.removeItem('token'); // Remove invalid token
          localStorage.removeItem('user'); // Remove invalid user data
          localStorage.removeItem('authMethod'); // Remove auth method
          setLoading(false);
        }
      } else if (accounts.length > 0 && (!storedAuthMethod || storedAuthMethod === 'msal')) {
        // If MSAL has accounts and we're not using manual auth, proceed with MSAL flow
        const userInfo = getUserInfo(accounts[0]);
        console.log('MSAL authenticated user:', userInfo);
        
        // Exchange MSAL token for JWT token
        await exchangeTokenForJWT(userInfo);
        localStorage.setItem('authMethod', 'msal');
        setAuthMethod('msal');
        setLoading(false);
      } else if (msalError && localStorage.getItem('loginAttempted') && (!storedAuthMethod || storedAuthMethod === 'msal')) {
        // Only show authentication failed if user has attempted to login with MSAL
        // and we don't have a valid token in localStorage
        setError('Authentication failed');
        setLoading(false);
        // Clear any partial authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('authMethod');
      } else {
        // Just set loading to false without error on initial load
        setLoading(false);
        if (!isAuthenticated && !loading && (!storedAuthMethod || storedAuthMethod === 'msal')) {
          setUser(null);
          // Clear local storage on logout only if using MSAL auth
          if (storedAuthMethod === 'msal') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('authMethod');
          }
        }
      }
    };
    
    handleAccountChange();
  }, [accounts, msalError, isAuthenticated, loading, exchangeTokenForJWT]);

  // MSAL Login function - using redirect flow instead of popup
  const login = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any existing errors
      
      // Set flag to indicate login was attempted
      localStorage.setItem('loginAttempted', 'true');
      localStorage.setItem('authMethod', 'msal');
      setAuthMethod('msal');
      
      // Make sure MSAL is initialized before attempting to login
      if (!instance) {
        throw new Error('Authentication not initialized');
      }
      
      // Use loginRedirect instead of loginPopup
      console.log('Starting MSAL login redirect with request:', loginRequest);
      
      // Important: Don't set loading to false before redirect
      // as we're about to leave the page
      await instance.loginRedirect(loginRequest);
      
      // The function will not continue past this point until after the redirect completes
      // User state will be updated by the useEffect that watches accounts
      console.log('MSAL login redirect initiated');
      return null;
    } catch (err) {
      // Only set error if we're still on the page (redirect failed)
      setError('Login failed');
      console.error('MSAL login error:', err);
      setLoading(false); // Only set loading to false if there's an error
      throw err;
    }
  };
  
  // Manual login function - completely separate from MSAL
  const manualLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null); // Clear any existing errors
      
      console.log('Starting manual login for:', email);
      
      // Make API call to login endpoint
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.token && response.data.user) {
        // First update the state
        const userData = response.data.user;
        
        // Update user state with the user info from the backend
        setUser(userData);
        setAuthMethod('manual');
        
        // Then store in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authMethod', 'manual');
        
        console.log('Manual login successful:', userData);
        
        // Small delay to ensure state is fully updated
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return userData;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      console.error('Manual login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function - handles both MSAL and manual logout
  const logout = async () => {
    try {
      const currentAuthMethod = localStorage.getItem('authMethod');
      console.log(`Logging out with auth method: ${currentAuthMethod || 'unknown'}`);
      
      // Clear all authentication data from localStorage
      localStorage.removeItem('loginAttempted');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authMethod');
      
      // Reset user state
      setUser(null);
      setAuthMethod(null);
      
      // If using MSAL auth, also log out from Microsoft
      if (currentAuthMethod === 'msal' && instance) {
        console.log('Starting MSAL logout redirect');
        // Use logoutRedirect to clear MSAL cache and redirect to logout page
        await instance.logoutRedirect({
          postLogoutRedirectUri: window.location.origin,
        });
        // The function might not continue past this point due to redirect
      } else {
        // For manual login, just redirect to login page
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, ensure localStorage and state are cleared
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginAttempted');
      localStorage.removeItem('authMethod');
      setUser(null);
      setAuthMethod(null);
      // Redirect to login page as fallback
      window.location.href = '/login';
    }
  };

  // Check if user is authenticated based on JWT token
  const isJwtAuthenticated = !!user || (!!localStorage.getItem('token') && !!localStorage.getItem('user'));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        manualLogin,
        logout,
        authMethod,
        isAuthenticated: isJwtAuthenticated, // Use JWT-based authentication status
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
