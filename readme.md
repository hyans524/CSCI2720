# Cultural Events Venue Management System

A web application for browsing and managing cultural event venues in Hong Kong.

## Key Features

1. Venue Management
   - Browse complete venue listings
   - Search venues by name and address
   - View venue details
   - Interactive map interface
   - Pagination support

2. User Features
   - User login
   - View venue locations
   - Admin access control

3. Admin Features
   - Add new venues
   - Edit existing venues
   - Delete venues

4. Map Integration
   - Google Maps integration
   - Interactive venue markers
   - Venue info windows
   - Multiple marker support

## Tech Stack

Frontend:
- React (Vite)
- Material-UI 
- Google Maps API
- React Router
- ESLint for code quality

Backend:
- Node.js
- Express
- MongoDB
- JWT Authentication
- CORS enabled
- XML Parser for data import

## Installation Guide

1. System Requirements:
   - Node.js (v14 or higher)
   - npm or yarn
   - MongoDB (running on port 27017)
   - Google Maps API key

2. Setup Steps:
   a) Clone repository:
      ```bash
      git clone https://github.com/hyans524/CSCI2720/
      ```

   b) Configure environment:
      - Set up Google Maps API key
      - Configure MongoDB connection
      (already set by students)

   c) Start servers:
      ```bash
      start-servers.bat
      ```
      This script will:
      - Install all dependencies automatically
      - Start MongoDB connection
      - Launch backend server
      - Launch frontend development server

   d) Access application:
      - Frontend: http://localhost:5173

## Project Structure

```
.
├── backend/
│   ├── data/              # Seed data and JSON files
│   ├── middleware/        # Custom middleware functions
│   ├── models/           # MongoDB models
│   ├── routes/           # API route definitions
│   ├── utils/            # Utility functions and helpers
│   ├── .env              # Environment variables
│   ├── server.js         # Main server entry point
│   └── package.json      # Backend dependencies
├── frontend/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── assets/       # Images and static resources
│   │   ├── components/   # Reusable UI components
│   │   ├── layouts/      # Page layout templates
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── App.css       # App-wide styles
│   │   ├── index.css     # Global styles
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── index.html        # HTML template
│   ├── .env              # Frontend environment variables
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.js    # Vite configuration
│   └── eslint.config.js  # ESLint configuration
├── .gitignore            # Git ignore rules
├── package.json          # Root dependencies
├── readme.md             # Project documentation
└── start-servers.bat     # Server startup script
```

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://127.0.0.1:27017/venue-events
PORT=5000
JWT_SECRET=jwt_secret_key
```

### Frontend (.env)
```
VITE_GOOGLE_MAPS_API_KEY=api_key
VITE_API_URL=http://localhost:5000
```

