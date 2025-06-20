require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const database = require('./config/database');
const surveyRoutes = require('./routes/surveyRoutes');
const authRoutes = require('./routes/authRoutes');
const responseRoutes = require('./routes/responseRoutes');
const dataRetentionRoutes = require('./routes/dataRetentionRoutes');
const surveyAssignmentRoutes = require('./routes/surveyAssignmentRoutes');
const csvRoutes = require('./routes/csvRoutes');

// Import both authentication middlewares
const { authMiddleware, requireRole: jwtRequireRole } = require('./middleware/authMiddleware');
const { msalAuthMiddleware, requireRole: msalRequireRole } = require('./middleware/msalAuthMiddleware');

const app = express();
const PORT = process.env.PORT || 3001; // Changed to match Nginx proxy_pass configuration

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Survey Routes
// app.use('/api/surveys', surveyRoutes);

// Database Connection
(async () => {
  try {
    await database.connect();
    await database.sync();
    console.log('Database connected and synchronized');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
})();

// Custom middleware to handle authentication
const authenticationMiddleware = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Authentication middleware - token:', token ? token.substring(0, 20) + '...' : 'none');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Always use the standard JWT authentication
  // This works with both our own JWT tokens and tokens exchanged from MSAL
  console.log('Using standard JWT authentication middleware');
  return authMiddleware(req, res, next);
};

// Custom middleware to check roles from either auth method
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // The user object will be set by either msalAuthMiddleware or authMiddleware
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden: no user' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    
    next();
  };
};

// Protected Routes
app.use('/api/surveys', 
  authenticationMiddleware,  // Try both auth methods
  surveyRoutes  // Role checks are done in the route handlers
);

// Response Routes
app.use('/api/responses',
  authenticationMiddleware,  // Try both auth methods
  // Remove global role middleware to allow route-specific role checks
  responseRoutes
);

// Data Retention Routes (admin only)
app.use('/api/data-retention', 
  authenticationMiddleware,  // Try both auth methods
  roleMiddleware(['admin']),  // Admin only
  dataRetentionRoutes
);

// Survey Assignment Routes
app.use('/api/survey-assignments',
  authenticationMiddleware,  // Try both auth methods
  surveyAssignmentRoutes  // Role checks are done in the route handlers
);

// CSV Import/Export Routes
app.use('/api/csv',
  authenticationMiddleware,  // Try both auth methods
  csvRoutes
);

// Add debugging for API routes in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/*', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Serve static files from the React frontend app in production
// IMPORTANT: This must come AFTER all API routes
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // CRITICAL: REMOVE ANY CATCH-ALL ROUTE THAT MIGHT INTERCEPT API REQUESTS
  // In Express, routes are processed in the order they're registered
  
  // Add a proper 404 handler for API routes that specifically checks for API routes that don't exist
  app.use('/api/*', (req, res) => {
    console.log(`API 404 for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'API endpoint not found' });
  });
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Handle ALL React routing - this MUST be after API routes
  // This serves index.html for ANY path that isn't an API or static file
  app.use('*', function(req, res) {
    console.log(`Serving React app for: ${req.method} ${req.originalUrl}`);
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
