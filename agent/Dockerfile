FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency resolution
RUN pip install uv

COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml || pip install pipecat-ai[daily,google] google-cloud-firestore google-generativeai python-dotenv httpx loguru

COPY . .

CMD ["python", "main.py"]
