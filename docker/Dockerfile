ARG N8N_VERSION=latest
FROM n8nio/n8n:${N8N_VERSION}-debian

USER root

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    ffmpeg curl python3 python3-pip \
    chromium libnss3 libglib2.0-0 libfreetype6 libharfbuzz0b \
    ca-certificates fonts-freefont-ttf udev \
    fonts-liberation fonts-noto-color-emoji fonts-noto fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages yt-dlp 2>/dev/null || true

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true \
    PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium

RUN fc-cache -f -v

# ── Chinese i18n ──
ARG N8N_VERSION
RUN mkdir -p /tmp/i18n && \
    cd /tmp/i18n && \
    curl -sL -o editor-ui.tar.gz \
      "https://github.com/other-blowsnow/n8n-i18n-chinese/releases/download/release/${N8N_VERSION}/editor-ui.tar.gz" && \
    tar xzf editor-ui.tar.gz && \
    cp -rf dist/* /usr/local/lib/node_modules/n8n/node_modules/n8n-editor-ui/dist/ && \
    rm -rf /tmp/i18n

# ── Enterprise mock injection ──
COPY enterprise-mock.js /tmp/enterprise-mock.js
RUN node /tmp/enterprise-mock.js /usr/local/lib/node_modules/n8n/dist/commands/base-command.js && \
    rm /tmp/enterprise-mock.js

USER node
