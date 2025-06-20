# Dynpro Employee Portal

A modern, responsive web application for internal use at Dynpro organization. This portal connects current employees, sends notifications, and provides a centralized hub for company information.

## Features

- **User Authentication**: Secure login system for employees
- **Dashboard**: Overview of key metrics, upcoming events, and recent notifications
- **Employee Directory**: Browse and search for colleagues with detailed profiles
- **Notifications System**: Real-time notifications for company announcements, events, and alerts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js with JavaScript
- **UI Framework**: Material-UI (MUI) for modern, responsive components
- **Routing**: React Router for navigation
- **Notifications**: React-Toastify for toast notifications

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Authentication related components
│   ├── dashboard/    # Dashboard widgets and components
│   ├── employees/    # Employee directory components
│   ├── layout/       # Layout components (Navbar, Sidebar)
│   └── notifications/ # Notification components
├── pages/            # Main application pages
├── services/         # API services and data fetching
├── utils/            # Utility functions and helpers
└── assets/           # Static assets like images
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production

## Future Enhancements

- **Calendar Integration**: Sync with company calendar for events and meetings
- **Document Management**: Upload and share company documents
- **Chat System**: Real-time messaging between employees
- **Mobile App**: Native mobile application for iOS and Android
- **Analytics Dashboard**: Track employee engagement and system usage

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 Dynpro Organization. All rights reserved.
