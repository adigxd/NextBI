# SurveyRock

## Overview
SurveyRock is a comprehensive survey management application built with Node.js, Express, and React, utilizing a SQL database for secure and scalable survey management.

## Architecture
- **Frontend**: React with Vite
- **Backend**: Node.js Express API
- **Database**: MySQL/PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based authentication

## Features
- Secure user authentication
- Create surveys with complex configurations
- Support for various question types
- Targeting specific audiences
- Anonymity options
- Scheduling and recurrence
- Enterprise-grade security and scalability

## Prerequisites
- Node.js (v16+)
- MySQL or PostgreSQL database
- npm or yarn

## Setup
1. Create a MySQL/PostgreSQL database
2. Configure environment variables
3. Install dependencies
4. Run the application

## Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```
3. Configure `.env` files in both backend and frontend directories
4. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
5. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 3000)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 3306 for MySQL)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT tokens
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Frontend (.env)
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:3000/api)

## API Endpoints
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `POST /api/surveys`: Create a new survey
- `PUT /api/surveys/:id`: Update a survey
- `GET /api/surveys/:id`: Get a specific survey
- `GET /api/surveys`: List surveys
- `POST /api/surveys/:id/clone`: Clone a survey
- `POST /api/surveys/:id/cancel`: Cancel a survey

## Authentication

The application uses JWT (JSON Web Token) for authentication. All authenticated API requests require a valid JWT bearer token in the Authorization header.

### Authentication Flow

1. User registers or logs in
2. Server validates credentials and returns a JWT token
3. Client stores the token in localStorage
4. Client includes the token in the Authorization header for subsequent requests
5. Server validates the token for protected routes

## Deployment
1. Set up a production database
2. Configure environment variables for production
3. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
4. Deploy the backend to your server
5. Serve the frontend build directory

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License.
