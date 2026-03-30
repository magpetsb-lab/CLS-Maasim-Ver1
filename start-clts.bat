@echo off
:: Change the current working directory to the folder where this batch file is located
cd /d "%~dp0"

title CLTS System Startup
echo ===================================================
echo Starting Computerized Legislative Tracking System...
echo ===================================================

echo.
echo [1/4] Checking PostgreSQL Database...
echo Attempting to start PostgreSQL service (requires Run as Administrator)...
:: Try common PostgreSQL Windows service names
net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1
net start postgresql-x64-14 >nul 2>&1
net start postgresql >nul 2>&1
echo Note: If the database connection fails, please ensure your local PostgreSQL server is running.
echo.

echo [2/4] Checking Node.js Dependencies...
if not exist "node_modules" (
    echo First time setup: Installing dependencies...
    call npm install
) else (
    echo Dependencies found.
)
echo.

echo [3/4] Setting Environment Variables...
set DATABASE_URL=postgres://postgres:minad2026@localhost:5432/legislative_db
set AUTO_CLOSE=true
echo Database URL configured.
echo Auto-close feature enabled.
echo.

echo [4/4] Starting CLTS Server and opening browser...
echo The CLTS System will open in your default browser shortly.

:: Create a background task to wait 5 seconds then open the browser
start /B cmd /c "ping 127.0.0.1 -n 6 > nul && start http://localhost:3000"

:: Start the development server
call npm run dev

pause
