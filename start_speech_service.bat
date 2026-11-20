@echo off
title LangBridge Speech Service
echo ========================================================
echo   LangBridge Speech AI: Starting Local Engine + Ngrok
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Closing any previously lingering sessions...
taskkill /F /IM ngrok.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Starting Python Whisper Service (8 CPU Threads)...
pushd "%~dp0python-service"
start "LangBridge Python Service" cmd /k "venv\Scripts\python.exe main.py"
popd

echo Waiting for Whisper model to initialize...
timeout /t 5 >nul 2>&1

echo [3/3] Starting Ngrok Tunnel on Port 5000...
start "LangBridge Ngrok Tunnel" cmd /k "ngrok.exe http --url=obedience-retrain-jolliness.ngrok-free.dev 5000"

echo.
echo ========================================================
echo   Services are running!
echo   Primary URL: https://obedience-retrain-jolliness.ngrok-free.dev
echo ========================================================
echo.
pause
