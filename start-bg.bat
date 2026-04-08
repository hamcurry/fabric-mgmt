@echo off
setlocal

echo ============================================
echo  Fabric Manager - Background Startup
echo ============================================
echo.

:: --- Step 1: Check PM2 ---
echo [1/3] Checking PM2...
where pm2 >nul 2>&1
if errorlevel 1 (
  echo PM2 not found. Installing...
  call npm install -g pm2
  if errorlevel 1 (
    echo.
    echo ERROR: Failed to install PM2.
    echo Make sure Node.js is installed: https://nodejs.org
    goto :error
  )
  echo PM2 installed OK.
) else (
  echo PM2 already installed.
)

:: --- Step 2: Build frontend ---
echo.
echo [2/3] Building frontend...
cd /d "%~dp0client"
if not exist node_modules (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 goto :error
)
call npm run build
if errorlevel 1 (
  echo ERROR: Frontend build failed.
  goto :error
)
echo Build OK.

:: --- Step 3: Install backend deps ---
echo.
echo [3/3] Installing backend dependencies...
cd /d "%~dp0server"
if not exist node_modules (
  call npm install --omit=dev
  if errorlevel 1 goto :error
)

:: --- Start PM2 ---
echo.
echo Starting server with PM2...
cd /d "%~dp0"
call pm2 start ecosystem.config.js --update-env
call pm2 save

echo.
echo ============================================
echo  SUCCESS! Server is running in background.
echo  Access: http://localhost:3000
echo.
echo  Useful commands:
echo    pm2 list
echo    pm2 logs fabric-server
echo    pm2 restart fabric-server
echo    pm2 stop fabric-server
echo    pm2 startup   (enable autostart on boot)
echo ============================================
goto :end

:error
echo.
echo ============================================
echo  STARTUP FAILED - See error above
echo ============================================

:end
echo.
pause
endlocal
