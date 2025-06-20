# SurveyRock API Endpoints Documentation

This document provides a comprehensive list of all API endpoints available in the SurveyRock application, organized by role (admin and user) and functionality. This documentation is intended for integration with Workato or other automation platforms.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Authentication Endpoints

| Endpoint | Method | Description | Role | Request Body | Response |
|----------|--------|-------------|------|-------------|----------|
| `/api/auth/register` | POST | Register a new user (legacy) | Public | `{ username, email, password }` | `{ token, user }` |
| `/api/auth/login` | POST | Login with email and password | Public | `{ email, password }` | `{ token, user }` |
| `/api/auth/me` | GET | Get current user info | Authenticated | None | `{ user }` |
| `/api/auth/msal-exchange` | POST | Exchange Microsoft MSAL token | Public | `{ email }` | `{ token, user }` |

## Survey Endpoints

### Admin Survey Endpoints

| Endpoint | Method | Description | Role | Request Body | Response |
|----------|--------|-------------|------|-------------|----------|
| `/api/surveys` | GET | Get all surveys | Admin | None | Array of surveys |
| `/api/surveys` | POST | Create a new survey | Admin | Survey data | Created survey |
| `/api/surveys/:id` | PUT | Update a survey | Admin | Survey data | Updated survey |
| `/api/surveys/:id` | DELETE | Delete a survey | Admin | None | Success message |
| `/api/surveys/:id/toggle-archive` | POST | Toggle archive status | Admin | None | Updated survey |

### User Survey Endpoints

| Endpoint | Method | Description | Role | Request Body | Response |
|----------|--------|-------------|------|-------------|----------|
| `/api/surveys/assigned` | GET | Get surveys assigned to user | User | None | Array of surveys |
| `/api/surveys/:id` | GET | Get a specific survey | User/Admin/Public* | None | Survey data |

*Public access only for anonymous surveys

## Response Endpoints

| Endpoint | Method | Description | Role | Request Body | Response |
|----------|--------|-------------|------|-------------|----------|
| `/api/responses/survey/:surveyId` | GET | Get all responses for a survey | Admin | None | Array of responses |
| `/api/responses/:id` | GET | Get a specific response | Admin/Owner | None | Response data |
| `/api/responses` | POST | Submit a new response | User/Public* | Response data | Created response |
| `/api/responses/user/me` | GET | Get user's own responses | User | None | Array of responses |

*Public access only for anonymous surveys

## Survey Assignment Endpoints

| Endpoint | Method | Description | Role | Request Body | Response |
|----------|--------|-------------|------|-------------|----------|
| `/api/survey-assignments/assign` | POST | Assign user to survey | Admin | `{ userId, surveyId }` | Assignment data |
| `/api/survey-assignments/:surveyId/user/:userId` | DELETE | Remove user from survey | Admin | None | Success message |
| `/api/survey-assignments/survey/:surveyId/users` | GET | Get users assigned to survey | Admin | None | Array of users |
| `/api/survey-assignments/search-users` | GET | Search users for assignment | Admin | Query params | Array of users |
| `/api/survey-assignments/survey/:surveyId/auto-assign` | POST | Auto-assign users to survey | Admin | Assignment criteria | Assignment results |
| `/api/survey-assignments/user/:userId?/surveys` | GET | Get surveys by user ID | Admin/User | None | Array of surveys |

## CSV Import/Export Endpoints

| Endpoint | Method | Description | Role | Request Body | Response |
|----------|--------|-------------|------|-------------|----------|
| `/api/csv/export/:surveyId` | GET | Export survey to CSV | Admin | None | CSV file |
| `/api/csv/import` | POST | Import survey from CSV | Admin | Form data with CSV file | Created survey |

## Data Retention Endpoints (Admin Only)

| Endpoint | Method | Description | Role | Request Body | Response |
|----------|--------|-------------|------|-------------|----------|
| `/api/data-retention/surveys/:id/archive` | POST | Archive a survey | Admin | None | Updated survey |
| `/api/data-retention/surveys/:id/restore` | POST | Restore an archived survey | Admin | None | Updated survey |
| `/api/data-retention/surveys/:id/purge` | DELETE | Permanently delete a survey | Admin | None | Success message |
| `/api/data-retention/surveys/:id/retention` | POST | Set retention period | Admin | `{ retentionPeriod }` | Updated survey |
| `/api/data-retention/surveys/archived` | GET | Get archived surveys | Admin | None | Array of surveys |
| `/api/data-retention/surveys/:id/logs` | GET | Get survey audit logs | Admin | None | Array of logs |
| `/api/data-retention/logs` | GET | Get all audit logs | Admin | None | Array of logs |

## Notes for Workato Integration

1. **Authentication**: Use the `/api/auth/login` endpoint to obtain a JWT token, then include it in all subsequent requests.
2. **Error Handling**: All endpoints return appropriate HTTP status codes and error messages in JSON format.
3. **Rate Limiting**: Be mindful of rate limits when making multiple API calls in quick succession.
4. **Pagination**: Some endpoints returning large datasets may implement pagination. Check response headers for pagination information.

## Example Workato Recipe

```
# Example Workato recipe to authenticate and get surveys
trigger:
  type: scheduled
  frequency: hourly

steps:
  # Step 1: Authenticate
  - action:
      type: http
      operation: post
      url: "https://your-surveyrock-instance.com/api/auth/login"
      body:
        email: "admin@example.com"
        password: "{{data.admin_password}}"
      result_field: auth_response

  # Step 2: Get all surveys
  - action:
      type: http
      operation: get
      url: "https://your-surveyrock-instance.com/api/surveys"
      headers:
        Authorization: "Bearer {{auth_response.token}}"
      result_field: surveys

  # Step 3: Process surveys
  - action:
      # Your custom logic here
```
