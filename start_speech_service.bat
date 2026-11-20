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
timeout /t 1 /nobreak >nul

echo [2/3] Starting Python Whisper Service (8 CPU Threads)...
start "LangBridge Python Service" cmd /k "cd /d "%~dp0python-service" && ..\python-service\venv\Scripts\python.exe main.py"

echo Waiting for Whisper model to load on port 5000...
timeout /t 4 /nobreak >nul

echo [3/3] Starting Ngrok Tunnel on Port 5000...
start "LangBridge Ngrok Tunnel" cmd /k "cd /d "%~dp0" && ngrok.exe http 5000"

echo.
echo ========================================================
echo   Services are running!
echo   Primary URL: https://obedience-retrain-jolliness.ngrok-free.dev
echo ========================================================
echo.
pause
