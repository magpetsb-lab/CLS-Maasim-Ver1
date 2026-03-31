@echo off
:: Auto-minimize the command window
if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit

title Legislative System Server
echo ===================================================
echo Starting Legislative System with PostgreSQL...
echo ===================================================

:: Set the database connection string
set DATABASE_URL=postgres://postgres:minad2026@localhost:5432/legislative_db

:: Start the Node.js development server
npm run dev
