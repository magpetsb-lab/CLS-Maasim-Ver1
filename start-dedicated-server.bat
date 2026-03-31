@echo off
:: Auto-minimize the command window
if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit

title Legislative System Server (Dedicated)
echo ===================================================
echo Starting Dedicated CLTS Server for LAN...
echo ===================================================
echo.

echo [1/3] Setting Environment Variables...
set DATABASE_URL=postgres://postgres:minad2026@localhost:5432/legislative_db
set AUTO_CLOSE=false
set AUTO_OPEN=false
echo Database URL configured.
echo Auto-close feature DISABLED (Server will stay running for clients).
echo.

echo [2/3] Finding Server IP Address for Clients...
echo Tell your 5 clients to open their web browser and go to:
echo.
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do echo http://%%a:8080
echo.

echo [3/3] Starting Server...
echo Do NOT close this window if you want clients to stay connected.
echo To shut down the server, press Ctrl+C in this window.
echo.

:: Start the server directly with node
node server.js
