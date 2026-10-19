FROM python:3.12-slim

WORKDIR /app

# Install system deps that pipecat/daily need
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps directly (skip pyproject.toml / uv for reliability)
RUN pip install --no-cache-dir \
    "pipecat-ai[daily,google]>=0.0.51" \
    "google-cloud-firestore>=2.16.0" \
    "google-generativeai>=0.8.0" \
    "python-dotenv>=1.0.0" \
    "httpx>=0.27.0" \
    "loguru>=0.7.2"

COPY . .

EXPOSE 8080

CMD ["python", "main.py"]
