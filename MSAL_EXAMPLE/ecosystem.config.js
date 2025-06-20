module.exports = {
  apps: [
    {
      name: 'surveyrock-api',
      script: './backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        
        // Database configuration
        DB_DIALECT: 'mysql',
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_NAME: 'surveyrock',
        DB_USER: 'root',
        DB_PASSWORD: 'root8752',
        DB_FORCE_SYNC: 'false',
        
        // JWT configuration
        JWT_SECRET: 'secret8752',
        JWT_EXPIRATION: '24h',
        
        // CORS settings
        CORS_ORIGIN: 'https://surveys.dynpro.com',
        
        // Azure AD Configuration for MSAL
        AZURE_CLIENT_ID: '89f530d5-021e-4699-8d28-ce86b207158c',
        AZURE_TENANT_ID: '02c5b066-c072-4b82-9474-43accc1385c6',
        
        // Logging
        LOG_LEVEL: 'error'
      }
    }
  ]
};
