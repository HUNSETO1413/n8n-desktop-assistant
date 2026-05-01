use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilesGenerateResult {
    pub success: bool,
    pub error: Option<String>,
}

const DOCKERFILE_TEMPLATE: &str = r#"FROM n8nio/n8n:{{version}}

USER root

# Install apk-tools (Hardened Alpine doesn't include it)
RUN busybox wget -O /tmp/apk-tools.apk \
    https://dl-cdn.alpinelinux.org/alpine/v3.22/main/x86_64/apk-tools-2.14.9-r3.apk && \
    cd / && busybox tar xzf /tmp/apk-tools.apk && \
    rm /tmp/apk-tools.apk

# Replace with Tencent Cloud mirror
RUN echo "https://mirrors.tencent.com/alpine/v3.22/main" > /etc/apk/repositories && \
    echo "https://mirrors.tencent.com/alpine/v3.22/community" >> /etc/apk/repositories

# Upgrade base libraries (fix version conflicts), then install new dependencies
RUN apk update && apk upgrade --no-cache && apk add --no-cache \
    ffmpeg \
    curl \
    python3 \
    py3-pip \
    yt-dlp \
    chromium \
    nss \
    glib \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    ttf-liberation \
    font-noto-emoji \
    font-noto \
    font-noto-cjk && \
    rm -rf /var/cache/apk/*

# Install yt-dlp (fallback to pip if apk version unavailable)
RUN pip3 install --break-system-packages yt-dlp 2>/dev/null || true

# Configure puppeteer and playwright to use system browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true \
    PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Update font cache
RUN fc-cache -f -v

USER node
"#;

#[tauri::command]
pub fn generate_dockerfile(
    install_path: String,
    n8n_version: String,
) -> Result<FilesGenerateResult, String> {
    let work_dir = get_work_dir(&install_path);
    let dockerfile_path = work_dir.join("Dockerfile");

    let content = DOCKERFILE_TEMPLATE.replace("{{version}}", &n8n_version);

    std::fs::write(&dockerfile_path, content)
        .map_err(|e| format!("Failed to write Dockerfile: {}", e))?;

    Ok(FilesGenerateResult {
        success: true,
        error: None,
    })
}

#[tauri::command]
pub fn generate_compose(
    install_path: String,
    config: String,
) -> Result<FilesGenerateResult, String> {
    let work_dir = get_work_dir(&install_path);
    let compose_path = work_dir.join("docker-compose.yml");

    let data_paths: crate::config::DataPaths = serde_json::from_str(&config)
        .unwrap_or_default();

    let pg = &data_paths.postgresql;
    let n8n = &data_paths.n8n_data;
    let ext = &data_paths.external;
    let ff = &data_paths.ffmpeg;
    let img = &data_paths.images;
    let mcp = &data_paths.mcp;

    let content = format!(r#"version: '3.8'

services:
  n8n-db:
    image: postgres:16.1
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_PASSWORD=n8n
      - POSTGRES_USER=n8n
    volumes:
      - {pg}:/var/lib/postgresql/data

  n8n-redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - n8n-redis-data:/data

  n8n-main:
    image: n8n-jianying:latest
    restart: always
    depends_on:
      - n8n-db
      - n8n-redis
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "5678:5678"
    volumes:
      - {n8n}:/home/node/.n8n
      - {ext}:/external
      - {ff}:/ffmpeg
      - {img}:/images
      - {mcp}:/mcp
      - ./base-command.js:/usr/local/lib/node_modules/n8n/dist/commands/base-command.js
      - ./editor-ui-dist:/usr/local/lib/node_modules/n8n/node_modules/n8n-editor-ui/dist
    environment:
      - N8N_TIMEZONE=Asia/Shanghai
      - GENERIC_TIMEZONE=Asia/Shanghai
      - TZ=Asia/Shanghai
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_HOST=n8n-db
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=n8n-redis
      - QUEUE_BULL_REDIS_PORT=6379
      - N8N_RUNNERS_ENABLED=true
      - OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true
      - N8N_SECURE_COOKIE=false
      - N8N_ENCRYPTION_KEY=iX2PxOqkh71A+AStsT8hEic+Co597arX
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
      - EXECUTIONS_DATA_PRUNE_MAX_COUNT=10000
      - WEBHOOK_URL=http://localhost:5678/
      - N8N_DEFAULT_LOCALE=zh-CN
      - NODE_FUNCTION_ALLOW_EXTERNAL=*
      - NODE_FUNCTION_ALLOW_BUILTIN=*
      - EXTRA_NODE_MODULES=*
      - N8N_DEFAULT_BINARY_DATA_MODE=filesystem
      - N8N_ALLOW_EMBEDDED_SANDBOX=true
      - NODES_EXCLUDE=[]

  n8n-worker:
    image: n8n-jianying:latest
    command: worker
    restart: always
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - n8n-db
      - n8n-redis
    volumes:
      - {n8n}:/home/node/.n8n
      - {ext}:/external
      - {ff}:/ffmpeg
      - {img}:/images
      - {mcp}:/mcp
      - ./base-command.js:/usr/local/lib/node_modules/n8n/dist/commands/base-command.js
      - ./editor-ui-dist:/usr/local/lib/node_modules/n8n/node_modules/n8n-editor-ui/dist
    environment:
      - N8N_TIMEZONE=Asia/Shanghai
      - GENERIC_TIMEZONE=Asia/Shanghai
      - TZ=Asia/Shanghai
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_HOST=n8n-db
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=n8n-redis
      - QUEUE_BULL_REDIS_PORT=6379
      - N8N_RUNNERS_ENABLED=true
      - OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true
      - N8N_SECURE_COOKIE=false
      - N8N_ENCRYPTION_KEY=iX2PxOqkh71A+AStsT8hEic+Co597arX
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
      - EXECUTIONS_DATA_PRUNE_MAX_COUNT=10000
      - WEBHOOK_URL=http://localhost:5678/
      - N8N_DEFAULT_LOCALE=zh-CN
      - NODE_FUNCTION_ALLOW_EXTERNAL=*
      - NODE_FUNCTION_ALLOW_BUILTIN=*
      - EXTRA_NODE_MODULES=*
      - N8N_DEFAULT_BINARY_DATA_MODE=filesystem
      - N8N_ALLOW_EMBEDDED_SANDBOX=true
      - NODES_EXCLUDE=[]
    deploy:
      replicas: 3

volumes:
  n8n-redis-data:
"#);

    std::fs::write(&compose_path, content)
        .map_err(|e| format!("Failed to write docker-compose.yml: {}", e))?;

    Ok(FilesGenerateResult {
        success: true,
        error: None,
    })
}

fn get_work_dir(install_path: &str) -> std::path::PathBuf {
    #[cfg(windows)]
    {
        std::path::PathBuf::from(install_path.replace('/', "\\"))
    }
    #[cfg(not(windows))]
    {
        std::path::PathBuf::from(install_path)
    }
}
