FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    libglib2.0-0 \
    libgomp1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# CPU-only PyTorch (~200MB vs ~2GB CUDA)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements-worker.txt requirements-ustri.txt ./
RUN pip install --no-cache-dir -r requirements-worker.txt \
    && pip install --no-cache-dir -r requirements-ustri.txt gdown

COPY . .

# SonoNet weights baked into image (~57MB) — required for fetal planes
RUN bash scripts/setup-sononet-weights.sh

# USTri: clone MacDunno/USTri + USpec.pth (~1.2GB). Default off for Railway; set INSTALL_USTRI=1 to enable.
ARG INSTALL_USTRI=0
ENV INSTALL_USTRI=${INSTALL_USTRI}
ENV USTRI_PATH=/app/ustri
ENV USTRI_USPEC_WEIGHTS=/app/ustri/USpec.pth
RUN bash scripts/setup-ustri.sh

RUN chmod +x scripts/docker-entrypoint.sh

ENV PORT=8090
EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["scripts/docker-entrypoint.sh"]
