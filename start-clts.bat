@echo off
title CLTS System Startup
echo ===================================================
echo Starting Comprehensive Legislative Tracking System...
echo ===================================================

:: Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo First time setup: Installing dependencies...
    call npm install
)

echo.
echo Starting development server...
echo The CLTS System will open in your default browser shortly.
echo.

:: Open the browser (wait a few seconds for the server to start)
start "" "http://localhost:3000"

:: Start the development server
call npm run dev
