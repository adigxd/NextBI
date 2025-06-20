# SurveyRock Setup Guide

This document provides detailed instructions for setting up the SurveyRock application for both development and production environments.

## Prerequisites

- Node.js (v16+)
- MySQL or PostgreSQL database
- npm or yarn

## Development Setup

### 1. Database Setup

1. Create a new MySQL or PostgreSQL database for the application
2. Note down the database credentials (host, port, database name, username, password)

### 2. Environment Configuration

1. Navigate to the backend directory
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit the `.env` file with your database credentials:
   ```
   # Database Configuration
   DB_DIALECT=mysql # or postgres
   DB_HOST=localhost
   DB_PORT=3306 # or 5432 for PostgreSQL
   DB_NAME=surveyrock
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # JWT Configuration
   JWT_SECRET=your_secure_random_string
   ```

4. Navigate to the frontend directory
5. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
6. Edit the `.env` file with your API URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### 3. Install Dependencies

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### 4. Initialize Database

Run the database initialization script to create tables and an admin user:
```bash
npm run init-db
```

### 5. Start Development Servers

Start both backend and frontend development servers:
```bash
npm run dev:all
```

Or use the provided start script:
```bash
./start.bat
```

## Production Setup

### 1. Database Setup

1. Create a production database
2. Configure environment variables for production

### 2. Build the Application

Run the build script:
```bash
./build.bat
```

Or manually:
```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..
```

### 3. Start Production Server

```bash
npm run prod
```

## Default Admin User

After running the database initialization script, a default admin user will be created:

- Username: admin
- Email: admin@example.com
- Password: admin123

**Important:** Change the default admin password immediately after first login.

## Troubleshooting

### Database Connection Issues

1. Verify database credentials in the `.env` file
2. Ensure the database server is running
3. Check that the database exists and is accessible

### Frontend API Connection Issues

1. Verify the API URL in the frontend `.env` file
2. Ensure the backend server is running
3. Check for CORS issues in the browser console

### Migration Issues

If you encounter issues with the Sequelize migration:

1. Check the database logs
2. Verify that the database user has sufficient privileges
3. Try running with `{ force: true }` in development to recreate tables (warning: this will delete all data)
