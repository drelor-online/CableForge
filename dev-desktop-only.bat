@echo off
echo CableForge - Desktop-Only Development Mode
echo ==========================================
echo.
echo This will start ONLY the Tauri desktop app (no browser window).
echo The React app will be built once and served statically.
echo.

echo [1/2] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Check for errors above.
    pause
    exit /b 1
)

echo [2/2] Starting Tauri desktop app...
echo.
echo The desktop app is now starting. You can close this window once the app opens.
echo To make changes, edit the code and re-run this batch file.
echo.

REM Temporarily backup the original tauri config
copy "src-tauri\tauri.conf.json" "src-tauri\tauri.conf.json.backup" >nul 2>&1

REM Create a modified config for desktop-only mode
powershell -Command "(Get-Content 'src-tauri\tauri.conf.json') -replace '\"beforeDevCommand\": \"npm start\"', '\"beforeDevCommand\": \"\"' -replace '\"devUrl\": \"http://localhost:3002\"', '\"frontendDist\": \"../build\"' | Set-Content 'src-tauri\tauri.conf.json.desktop'"

REM Use the desktop-only config
move "src-tauri\tauri.conf.json" "src-tauri\tauri.conf.json.original" >nul 2>&1
move "src-tauri\tauri.conf.json.desktop" "src-tauri\tauri.conf.json" >nul 2>&1

REM Start Tauri
npx tauri dev

REM Restore original config
move "src-tauri\tauri.conf.json" "src-tauri\tauri.conf.json.desktop" >nul 2>&1  
move "src-tauri\tauri.conf.json.original" "src-tauri\tauri.conf.json" >nul 2>&1

echo.
echo Desktop app has been closed. Original configuration restored.
pause