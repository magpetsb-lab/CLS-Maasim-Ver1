@echo off
echo ===================================================
echo Starting Legislative System with PostgreSQL...
echo ===================================================

:: Set the database connection string
set DATABASE_URL=postgres://postgres:minad2026@localhost:5432/legislative_db

:: Start the Node.js development server
npm run dev

:: Keep the window open if the server crashes
pause
