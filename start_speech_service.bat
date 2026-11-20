@echo off
title LangBridge Speech Service
echo ========================================================
echo   LangBridge Speech AI: Starting Local Engine + Ngrok
echo ========================================================
echo.

cd /d "%~dp0"

:: ── First-Time Setup on a New Laptop ─────────────────────
if not exist "%~dp0python-service\.env" (
    echo [Setup] Creating python-service\.env template...
    echo # Google Gemini API Key for AI Tutor Tips> "%~dp0python-service\.env"
    echo GEMINI_API_KEY=>> "%~dp0python-service\.env"
)

if not exist "%~dp0ngrok.exe" (
    echo [Setup] ngrok.exe not found. Downloading standalone Ngrok for Windows...
    curl.exe -L -o "%~dp0ngrok.zip" https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip
    powershell -NoProfile -Command "Expand-Archive -Path '%~dp0ngrok.zip' -DestinationPath '%~dp0' -Force"
    del "%~dp0ngrok.zip"
)

if not exist "%~dp0python-service\venv\Scripts\python.exe" (
    echo [Setup] Python virtual environment not found. Setting up venv...
    python -m venv "%~dp0python-service\venv"
    echo [Setup] Installing speech service dependencies (faster-whisper, flask, gtts, etc.)...
    "%~dp0python-service\venv\Scripts\pip.exe" install --upgrade pip
    "%~dp0python-service\venv\Scripts\pip.exe" install -r "%~dp0python-service\requirements.txt"
)

:: Check FFmpeg
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] FFmpeg was not found in your PATH.
    echo Audio conversion requires FFmpeg. You can install it by running:
    echo   winget install Gyan.FFmpeg
    echo in PowerShell, or download it from https://ffmpeg.org.
    echo.
)

:: ── Process Launching ────────────────────────────────────
echo [1/3] Closing any previously lingering sessions...
taskkill /F /IM ngrok.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo [2/3] Starting Python Whisper Service (8 CPU Threads)...
start "LangBridge Python Service" cmd /k "cd /d "%~dp0python-service" && venv\Scripts\python.exe main.py"

echo Waiting for Whisper model to load on port 5000...
timeout /t 4 /nobreak >nul

echo [3/3] Starting Ngrok Tunnel on Port 5000...
start "LangBridge Ngrok Tunnel" cmd /k "cd /d "%~dp0" && ngrok.exe http --url=obedience-retrain-jolliness.ngrok-free.dev 5000"

echo.
echo ========================================================
echo   Services are running!
echo   Primary URL: https://obedience-retrain-jolliness.ngrok-free.dev
echo ========================================================
echo.
pause
