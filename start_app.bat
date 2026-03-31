@echo off
:: Auto-minimize the command window
if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit

title Legislative System Server
echo Starting Computerized Legislative Tracking System...
echo.
echo Checking for updates...
call npm install
echo.
echo Building application (ensuring latest configuration)...
call npm run build
echo.
echo Starting Local Server...
echo.
echo ========================================================
echo   OPEN YOUR BROWSER TO: http://localhost:8080
echo   DO NOT CLOSE THIS WINDOW WHILE USING THE SYSTEM
echo ========================================================
echo.
npm start
