#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================"
echo "  LangBridge Speech AI: Starting Local Engine + Ngrok"
echo "========================================================"
echo ""

# 1. Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 is not installed. Please install it (e.g. sudo apt install python3 python3-venv python3-pip)."
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "[WARNING] ffmpeg is not installed. Audio conversion may fail."
    echo "Install it using: sudo apt update && sudo apt install -y ffmpeg"
fi

# 2. Setup .env if missing
if [ ! -f "python-service/.env" ]; then
    echo "[Setup] Creating python-service/.env template..."
    echo "# Google Gemini API Key for AI Tutor Tips" > python-service/.env
    echo "GEMINI_API_KEY=" >> python-service/.env
fi

# 3. Setup venv if missing
if [ ! -f "python-service/venv/bin/python" ]; then
    echo "[Setup] Creating Python virtual environment..."
    python3 -m venv python-service/venv
    echo "[Setup] Installing dependencies..."
    python-service/venv/bin/pip install --upgrade pip
    python-service/venv/bin/pip install -r python-service/requirements.txt
fi

# 4. Check or download ngrok
NGROK_BIN="ngrok"
if ! command -v ngrok &> /dev/null; then
    if [ ! -f "./ngrok" ]; then
        echo "[Setup] ngrok not found. Downloading standalone ngrok for Linux..."
        curl -sL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar -xz
        chmod +x ./ngrok
    fi
    NGROK_BIN="./ngrok"
fi

# 5. Add Ngrok authtoken if provided as env var
if [ -n "$NGROK_AUTHTOKEN" ]; then
    $NGROK_BIN config add-authtoken "$NGROK_AUTHTOKEN" || true
fi

# 6. Clean previous lingering processes on port 5000
echo "[1/3] Closing any previously lingering sessions..."
fuser -k 5000/tcp 2>/dev/null || true
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "ngrok.*5000" 2>/dev/null || true
sleep 1

# 7. Start Python Whisper Service in background
echo "[2/3] Starting Python Whisper Service (8 CPU Threads)..."
(cd python-service && venv/bin/python main.py) &
PYTHON_PID=$!

cleanup() {
    echo ""
    echo "Stopping services..."
    kill $PYTHON_PID 2>/dev/null || true
    pkill -f "ngrok.*5000" 2>/dev/null || true
    fuser -k 5000/tcp 2>/dev/null || true
    echo "Done."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "Waiting for Whisper model to load on port 5000..."
sleep 4

# 8. Start Ngrok Tunnel in foreground
echo "[3/3] Starting Ngrok Tunnel on Port 5000..."
echo ""
echo "========================================================"
echo "  Services are running!"
echo "  Primary URL: https://obedience-retrain-jolliness.ngrok-free.dev"
echo "  (Press Ctrl+C to stop both Python & Ngrok)"
echo "========================================================"
echo ""

$NGROK_BIN http --url=obedience-retrain-jolliness.ngrok-free.dev 5000
