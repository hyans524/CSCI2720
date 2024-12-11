@echo off
echo Starting servers...

:: Set Git config for line endings
git config --global core.autocrlf true

cd backend
start cmd /k "npm run dev"
timeout /t 5

cd ../frontend
start cmd /k "npm run dev"

echo Servers started:
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173

:: Display Git configuration status
echo.
echo Git Configuration:
git config --get core.autocrlf
