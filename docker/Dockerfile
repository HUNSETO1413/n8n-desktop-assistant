ARG N8N_VERSION=latest
FROM n8nio/n8n:${N8N_VERSION}

USER root

# Re-install apk-tools (removed by n8n base image), auto-detect architecture
RUN ARCH=$(uname -m) && \
    busybox wget -O /tmp/apk-tools.apk \
      "https://dl-cdn.alpinelinux.org/alpine/v3.22/main/${ARCH}/apk-tools-2.14.9-r3.apk" && \
    cd / && busybox tar xzf /tmp/apk-tools.apk && \
    rm -f /tmp/apk-tools.apk

# Tencent Cloud mirror
RUN echo "https://mirrors.tencent.com/alpine/v3.22/main" > /etc/apk/repositories && \
    echo "https://mirrors.tencent.com/alpine/v3.22/community" >> /etc/apk/repositories

# Install system packages
RUN apk update && apk upgrade --no-cache && apk add --no-cache \
    ffmpeg curl python3 py3-pip yt-dlp \
    chromium nss glib freetype harfbuzz \
    ca-certificates ttf-freefont udev \
    ttf-liberation font-noto-emoji font-noto font-noto-cjk && \
    rm -rf /var/cache/apk/*

RUN pip3 install --break-system-packages yt-dlp 2>/dev/null || true

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true \
    PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium-browser

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
