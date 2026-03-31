@echo off
echo ===================================================
echo Creating Desktop Shortcut for CLTS...
echo ===================================================

:: Define the VBScript file path
set SCRIPT="%TEMP%\CreateCLTSShortcut.vbs"

:: Create the VBScript to generate the shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%USERPROFILE%\Desktop\CLTS Maasim.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0start-clts.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "Computerized Legislative Tracking System" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

:: Run the VBScript
cscript /nologo %SCRIPT%

:: Clean up the VBScript
del %SCRIPT%

echo.
echo Shortcut successfully created on your Desktop!
echo You can now double-click "CLTS Maasim" on your Desktop to start the system.
echo.
pause
