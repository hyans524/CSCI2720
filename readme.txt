Cultural Events Venue Management System
=====================================

A comprehensive web application for managing and exploring cultural event venues in Hong Kong.

Project Overview
---------------
This system provides an interactive platform for users to discover and manage cultural venues across Hong Kong. It features an intuitive map interface, detailed venue listings, and user-specific functionalities like favorites and administrative controls.

Key Features
-----------
1. Venue Management
   - Browse complete venue listings
   - Search venues by name
   - View venue details and locations
   - Interactive map integration
   - Pagination support

2. User Features
   - User registration and login
   - Save favorite venues
   - Personal favorites management
   - View venue locations on map

3. Admin Dashboard
   - Comprehensive venue management
   - User account management
   - System statistics overview
   - Data modification capabilities

4. Map Integration
   - Google Maps integration
   - Interactive venue markers
   - Location-based searching
   - Venue information windows

Technical Stack
--------------
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

Installation Guide
-----------------
1. System Requirements:
   - Node.js (v14 or higher)
   - npm or yarn
   - MongoDB
   - Google Maps API key

2. Setup Steps:
   a) Clone the repository:
      git clone [repository-url]
      cd [project-directory]

   b) Install dependencies:
      npm install
      # or
      yarn install

   c) Environment Configuration:
      Create a .env file with:
      VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
      MONGODB_URI=your_mongodb_connection_string
      JWT_SECRET=your_jwt_secret

   d) Start development server:
      npm run dev
      # or
      yarn dev

   e) Access the application:
      Open http://localhost:5173 in your browser

Usage Guide
----------
1. Public Access:
   - Browse venue listings
   - View venue details
   - Use map interface
   - Search functionality

2. Registered Users:
   - Save favorite venues
   - Manage favorite list
   - View personalized dashboard

3. Administrators:
   - Access admin dashboard
   - Manage venues and users
   - View system statistics
   - Modify venue information

File Structure
-------------
/frontend
  /src
    /components    - Reusable UI components
    /pages         - Main page components
    /services      - API services
    /layouts       - Layout components
    /assets        - Static resources

/backend
  /controllers     - Request handlers
  /models         - Database models
  /routes         - API routes
  /middleware     - Custom middleware
  /config         - Configuration files

Development Notes
----------------
1. Code Style:
   - Follow ESLint configuration
   - Use Prettier for formatting
   - Follow component-based architecture
   - Maintain clean code practices

2. API Integration:
   - RESTful API design
   - JWT authentication
   - Protected routes
   - Error handling

3. Testing:
   - Unit tests for components
   - API endpoint testing
   - Integration testing
   - E2E testing when needed

Troubleshooting
--------------
1. Map Issues:
   - Verify Google Maps API key
   - Check browser console for errors
   - Ensure proper map initialization

2. Authentication Issues:
   - Verify JWT token
   - Check login credentials
   - Confirm API endpoint access

3. Database Connection:
   - Verify MongoDB connection
   - Check database credentials
   - Ensure proper data schema

Contact & Support
----------------
For technical support or queries:
- Email: [support-email]
- GitHub Issues: [repository-issues-url]
- Documentation: [docs-url]

License
-------
This project is licensed under the MIT License.
See LICENSE file for details.
