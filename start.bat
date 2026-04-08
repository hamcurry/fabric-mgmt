@echo off
echo Starting fabric management system...

start "Backend" cmd /k "cd /d %~dp0server && node index.js"
timeout /t 2 /nobreak > nul
start "Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause
