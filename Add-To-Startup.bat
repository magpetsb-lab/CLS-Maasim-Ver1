@echo off
echo ===================================================
echo Adding CLTS to Windows Startup...
echo ===================================================

:: Define the VBScript file path
set SCRIPT="%TEMP%\CreateCLTSStartup.vbs"

:: Create the VBScript to generate the shortcut in the Startup folder
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Startup") ^& "\CLTS Maasim.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0Run-CLTS-Silently.vbs" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "Computerized Legislative Tracking System" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

:: Run the VBScript
cscript /nologo %SCRIPT%

:: Clean up the VBScript
del %SCRIPT%

echo.
echo CLTS has been successfully added to your Windows Startup folder!
echo The system will now automatically start whenever you turn on your computer.
echo.
pause
