// MSAL configuration for Azure AD authentication
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "your-client-id",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
    protocolMode: "AAD",
    validateAuthority: true
  },
  cache: {
    cacheLocation: "localStorage", // Using localStorage for persistent login between sessions
    storeAuthStateInCookie: false, // Set to false to rely solely on localStorage
  },
  system: {
    allowRedirectInIframe: true,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case 0: console.error(message); break;
          case 1: console.warn(message); break;
          case 2: console.info(message); break;
          case 3: console.debug(message); break;
          default: console.log(message); break;
        }
      },
      logLevel: 3, // Verbose logging during development
    }
  }
};

// Add scopes here for the resources you want to access
export const loginRequest = {
  scopes: ["User.Read"], // Default Microsoft Graph scope for user profile
};

// Optional: Add here scopes for silent token acquisition
export const silentRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

// Helper function to extract user information from MSAL account
export const getUserInfo = (account) => {
  if (!account) return null;
  
  return {
    id: account.localAccountId,
    username: account.name || account.username,
    email: account.username,
    role: account.idTokenClaims?.roles?.[0] || "user", // Get role from claims if available
  };
};
