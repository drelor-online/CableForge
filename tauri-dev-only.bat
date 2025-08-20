@echo off
echo Building React app for Tauri-only development...
npm run build

echo Starting Tauri app (desktop only, no browser)...
npx tauri dev --no-dev-server

pause