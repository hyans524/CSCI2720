@echo off
echo Setting up and starting CSCI2720 project...
echo.

:: Change to the script's directory
cd /d "%~dp0"

:: Check if Node.js is installed
node --version > nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Setup Backend
echo.
echo Setting up backend...
cd backend

:: Create .env file if not exists
if not exist .env (
    echo Creating .env file...
    (
    echo MONGODB_URI=mongodb://127.0.0.1:27017/venue-events
    echo PORT=5000
    echo JWT_SECRET=your_jwt_secret_key
    ) > .env
)

:: Install backend dependencies
echo Installing backend dependencies...
call npm install
call npm install dotenv express mongoose cors bcryptjs jsonwebtoken express-validator xml2js
call npm install nodemon --save-dev
if errorlevel 1 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

:: Fix vulnerabilities
call npm audit fix --force

:: Start backend server
echo Starting backend server...
start cmd /k "npm run dev"
timeout /t 2

:: Setup Frontend
echo.
echo Setting up frontend...
cd ../frontend

:: Install frontend dependencies
echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

:: Start frontend server
echo Starting frontend server...
start cmd /k "npm run dev"

:: Final messages
echo.
echo =================================
echo Setup completed successfully!
echo =================================
echo.
echo Servers are running at:
echo Frontend: http://localhost:5173
echo.
echo Important Notes:
echo 1. Make sure MongoDB is running locally
echo 2. Keep these terminal windows open
echo 3. Press Ctrl+C in the terminals to stop the servers
echo =================================

pause