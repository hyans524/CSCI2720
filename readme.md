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

Backend:
- Node.js
- Express
- MongoDB
- JWT Authentication

## Installation Guide

1. System Requirements:
   - Node.js (v14 or higher)
   - npm or yarn
   - MongoDB
   - Google Maps API key

2. Setup Steps:
   a) Clone repository:
      ```bash
      git clone https://github.com/hyans524/CSCI2720/
      ```

   b) Start servers:
      ```bash
      start-servers.bat
      ```

   c) Access application:
      - Backend: http://localhost:5000
      - Frontend: http://localhost:5173

## Project Structure

```
.
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── package.json
├── readme.md
└── start-servers.bat
```

- `backend/`: Contains the backend server code
  - `config/`: Configuration files
  - `controllers/`: Route handlers
  - `models/`: Database models
  - `routes/`: API routes
  - `app.js`: Express app setup
  - `server.js`: Server entry point

- `frontend/`: Contains the frontend client code
  - `public/`: Static assets
  - `src/`: Source code
    - `components/`: Reusable components
    - `pages/`: Page components
    - `services/`: API services and utilities
    - `App.css`: Global styles
    - `App.jsx`: Main app component
    - `main.jsx`: App entry point

- `start-servers.bat`: Script to start both servers


