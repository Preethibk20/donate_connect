@echo off
title DonateConnect Launcher
echo Launching DonateConnect Full-Stack Application...
start "DonateConnect Backend" cmd /c "%~dp0start-backend.bat"
timeout /t 5 /nobreak > NUL
start "DonateConnect Frontend" cmd /c "%~dp0start-frontend.bat"
echo Done! Application is opening at http://localhost:5173
timeout /t 3 /nobreak > NUL
start http://localhost:5173
