#!/bin/bash
echo "Starting Computerized Legislative Tracking System..."
echo ""
echo "Checking for updates..."
npm install
echo ""
echo "Building application..."
npm run build
echo ""
echo "Starting Local Server..."
echo ""
echo "========================================================"
echo "  OPEN YOUR BROWSER TO: http://localhost:8080"
echo "  DO NOT CLOSE THIS WINDOW WHILE USING THE SYSTEM"
echo "========================================================"
echo ""
npm start
