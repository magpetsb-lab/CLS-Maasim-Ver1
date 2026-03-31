@echo off
title CLTS Client Launcher
echo ===================================================
echo Starting Legislative System (Client Mode)
echo ===================================================
echo.

:: Check if we already saved the Server's IP address
set IP_FILE=server-ip.txt

if exist "%IP_FILE%" (
    set /p SERVER_IP=<"%IP_FILE%"
) else (
    echo Welcome to the CLTS Client Setup!
    echo Please enter the IP address of the Main Server.
    echo ^(You only need to do this once. Example: 192.168.1.15^)
    echo.
    set /p SERVER_IP="Enter Server IP: "
    
    :: Save the IP for next time
    echo %SERVER_IP%>"%IP_FILE%"
    echo.
    echo IP Address saved!
)

echo Connecting to CLTS Server at %SERVER_IP%...

:: Open Chrome in "App Mode" so it looks like a real desktop program
start chrome --app=http://%SERVER_IP%:8080

:: If Chrome isn't installed, fallback to the default web browser
if %errorlevel% neq 0 (
    start http://%SERVER_IP%:8080
)

exit
