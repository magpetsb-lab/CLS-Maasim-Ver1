@echo off
title Legislative System Server
echo Starting Computerized Legislative System...
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
pause
