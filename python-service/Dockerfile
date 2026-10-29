FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (ffmpeg and libsndfile for audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces listens on port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["python", "main.py"]
