FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    curl \
    && rm -rf /var/lib/apt/lists/*

# CPU-only PyTorch (~200MB vs ~2GB CUDA)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements-worker.txt .
RUN pip install --no-cache-dir -r requirements-worker.txt

COPY . .

# SonoNet weights baked into image (~57MB) — required for fetal planes
RUN bash scripts/setup-sononet-weights.sh

RUN chmod +x scripts/docker-entrypoint.sh

ENV PORT=8090
EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["scripts/docker-entrypoint.sh"]
