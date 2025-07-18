# NextBI - Data Dashboarding and Visualization Tool

A powerful data visualization platform that enables users to connect to databases, create data models, and build customizable dashboards with various visualization tiles.

## Features

- Database connections to PostgreSQL (extensible to other databases)
- Data modeling from database schemas
- Customizable visualization tiles (charts, text descriptions)
- Drag-and-drop dashboard builder
- Project/folder/dashboard organization
- Role-based access control
- Light/dark theme support

## Project Structure

```
NextBI/
├── frontend/         # React + Vite frontend application
├── backend/          # Node.js API server
└── README.md         # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL

### Installation

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Theme Customization
The application supports both light and dark modes. Primary theme colors are:
- Primary: #40c0a0
- Secondary: #2060e0
