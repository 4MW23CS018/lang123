FROM python:3.10-slim

# Create non-root user required by Hugging Face Spaces
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install system dependencies (ffmpeg and libsndfile for audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user:user . .

USER user

# Production web server configuration (Render, HuggingFace, Railway, Docker)
ENV PORT=10000
ENV APP_ENV=production
ENV WHISPER_MODEL=tiny
ENV WHISPER_THREADS=4
EXPOSE 10000

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 4 --timeout 180 main:app"]


