@echo off
title CableForge - Desktop Development
echo.
echo ====================================
echo   CableForge Desktop Development  
echo ====================================
echo.
echo Starting desktop-only mode...
echo - Starting React dev server (no browser)
echo - Opening Tauri desktop app only
echo.
echo Press Ctrl+C to stop the development server.
echo.

npm run tauri:desktop-only

echo.
echo CableForge desktop app has closed.
pause