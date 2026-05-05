# n8n Desktop Assistant - 版本发布指南

> 本文档覆盖两类发布流程：**桌面端版本发布** 和 **n8n 企业版+汉化版 Docker 镜像发布**。

---

## 一、桌面端版本发布（GitHub Actions 自动构建）

### 仓库

- 代码：https://github.com/HUNSETO1413/n8n-desktop-assistant
- Release：https://github.com/HUNSETO1413/n8n-desktop-assistant/releases

### 构建矩阵

| 平台 | Runner | Target |
|------|--------|--------|
| Windows x64 | windows-latest | x86_64-pc-windows-msvc |
| macOS Intel | macos-latest | x86_64-apple-darwin |
| macOS Apple Silicon | macos-latest | aarch64-apple-darwin |

### 版本号修改（3 处必须同步）

1. **`package.json`** → `"version": "x.x.x"`
2. **`src-tauri/tauri.conf.json`** → `"version": "x.x.x"`
3. **`src-tauri/Cargo.toml`** → `"version": "x.x.x"`（可选，不影响构建）

### 发布步骤

```bash
# 1. 修改版本号（3 处）

# 2. 提交代码
git add -A
git commit -m "Bump version to x.x.x"

# 3. 推送到 main
git push origin main

# 4. 删除旧标签（如果存在）
git tag -d vx.x.x
git push origin :refs/tags/vx.x.x

# 5. 打标签并推送（触发 CI 自动构建）
git tag vx.x.x
git push origin vx.x.x
```

### CI 触发方式

- **自动触发**：推送 `v*` 格式的 tag
- **手动触发**：GitHub → Actions → Build Release → Run workflow

### 注意事项

- 图标必须是 **RGBA 格式**（4通道 + Alpha）。如构建报 `icon is not RGBA`，执行：
  ```bash
  node -e "
  const sharp = require('sharp');
  const fs = require('fs');
  const path = require('path');
  const dir = 'src-tauri/icons';
  (async () => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    for (const f of files) {
      const fp = path.join(dir, f);
      const buf = await sharp(fp).ensureAlpha().png().toBuffer();
      fs.writeFileSync(fp, buf);
    }
    console.log('All icons converted to RGBA.');
  })();
  "
  ```
- macOS 相关 Rust 代码中 `sysctlbyname` 必须使用 `std::ptr::null_mut()`，不能用 `std::ptr::null()`
- Secrets 需要在 GitHub 仓库 Settings → Secrets 中配置：
  - `GITHUB_TOKEN`（自动提供）
  - `TAURI_SIGNING_PRIVATE_KEY`（Tauri 更新签名私钥）
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`（私钥密码）

---

## 二、n8n 企业版+汉化版 Docker 镜像发布

### 镜像仓库

- Docker Hub：`hunseto001/n8n-jianying`
- ghcr.io：`ghcr.io/hunseto1413/n8n-jianying`

### 前置条件

- Docker 已安装并运行
- 已登录 Docker Hub：`docker login -u hunseto001`
- 已登录 ghcr.io：`echo <TOKEN> | docker login ghcr.io -u HUNSETO1413 --password-stdin`

### 目录结构

```
D:/n8n-build-{VERSION}/
├── Dockerfile          # 构建文件
└── enterprise-mock.js  # 企业版注入脚本
```

### 步骤一：准备构建目录

```bash
mkdir -p D:/n8n-build-{VERSION}
cd D:/n8n-build-{VERSION}
```

### 步骤二：编写 Dockerfile

创建 `D:/n8n-build-{VERSION}/Dockerfile`，替换 `{VERSION}` 为实际 n8n 版本号：

```dockerfile
FROM n8nio/n8n:{VERSION}

USER root

# Install apk-tools
RUN busybox wget -O /tmp/apk-tools.apk \
    https://dl-cdn.alpinelinux.org/alpine/v3.22/main/x86_64/apk-tools-2.14.9-r3.apk && \
    cd / && busybox tar xzf /tmp/apk-tools.apk && \
    rm /tmp/apk-tools.apk

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
RUN mkdir -p /tmp/i18n && \
    cd /tmp/i18n && \
    curl -sL -o editor-ui.tar.gz \
      "https://github.com/other-blowsnow/n8n-i18n-chinese/releases/download/release/{VERSION}/editor-ui.tar.gz" && \
    tar xzf editor-ui.tar.gz && \
    cp -rf dist/* /usr/local/lib/node_modules/n8n/node_modules/n8n-editor-ui/dist/ && \
    rm -rf /tmp/i18n

# ── Enterprise mock injection ──
COPY enterprise-mock.js /tmp/enterprise-mock.js
RUN node /tmp/enterprise-mock.js /usr/local/lib/node_modules/n8n/dist/commands/base-command.js && \
    rm /tmp/enterprise-mock.js

USER node
```

> **汉化包来源检查**：发布前确认 https://github.com/other-blowsnow/n8n-i18n-chinese/releases 已有对应版本的 `editor-ui.tar.gz`。路径格式为 `release/{VERSION}/editor-ui.tar.gz`。

### 步骤三：enterprise-mock.js

将以下内容保存为 `D:/n8n-build-{VERSION}/enterprise-mock.js`：

```javascript
const fs = require('fs');

const MOCK_CODE = `
        // ENTERPRISE MOCK START
        try {
            const { LICENSE_QUOTAS, LICENSE_FEATURES, UNLIMITED_LICENSE_QUOTA } = require("@n8n/constants");
            const origialGetValue = this.license.getValue.bind(this.license);
            this.license.isLicensed = function(feature) {
                if (feature === "feat:showNonProdBanner") return false;
                return true;
            };
            this.license.getValue = (feature) => {
                if (feature === "planName") return "Enterprise";
                if (Object.values(LICENSE_QUOTAS).includes(feature)) return UNLIMITED_LICENSE_QUOTA;
                if (Object.values(LICENSE_FEATURES).includes(feature)) return true;
                return origialGetValue(feature);
            };
            [
                "isAdvancedPermissionsLicensed", "isSharingEnabled", "isLdapEnabled",
                "isSamlEnabled", "isSourceControlLicensed", "isVariablesEnabled",
                "isExternalSecretsEnabled", "isWorkflowHistoryLicensed", "isLogStreamingEnabled",
                "isMultiMainLicensed", "isBinaryDataS3Licensed", "isDebugInEditorLicensed",
                "isWorkerViewLicensed", "isAiCreditsEnabled", "isFoldersEnabled",
                "isProjectRoleAdminLicensed", "isProjectRoleEditorLicensed", "isProjectRoleViewerLicensed",
                "isCustomNpmRegistryEnabled", "isWithinUsersLimit"
            ].forEach((key) => { this.license[key] = () => true; });
            [
                "getUsersLimit", "getTriggerLimit", "getVariablesLimit",
                "getWorkflowHistoryPruneLimit", "getTeamProjectLimit"
            ].forEach((key) => { this.license[key] = () => UNLIMITED_LICENSE_QUOTA; });
            this.license.isAPIDisabled = () => false;
            this.license.isAiAssistantEnabled = () => false;
            this.license.getAiCredits = () => 999999;
            this.license.getPlanName = () => "Enterprise";
            this.license.getConsumerId = () => "enterprise-mock-consumer";
            this.license.getManagementJwt = () => "mock-jwt-token";
            this.logger.info("[ENTERPRISE MOCK] All enterprise features enabled");
        } catch (error) {
            this.logger.error("[ENTERPRISE MOCK] Failed to enable enterprise mock:", { error });
        }
        // ENTERPRISE MOCK END
`;

const target = process.argv[2] || '/usr/local/lib/node_modules/n8n/dist/commands/base-command.js';
let content = fs.readFileSync(target, 'utf8');

if (content.includes('// ENTERPRISE MOCK START')) {
    console.log('Enterprise mock already injected, skipping.');
    process.exit(0);
}

const idx = content.indexOf('    }');
if (idx === -1) {
    console.error('Injection point not found!');
    process.exit(1);
}

const newContent = content.slice(0, idx) + MOCK_CODE + '\n' + content.slice(idx);
fs.writeFileSync(target, newContent, 'utf8');
console.log('Enterprise mock injected successfully.');
```

### 步骤四：构建镜像

```bash
cd D:/n8n-build-{VERSION}

# 构建（注意版本号）
docker build -t hunseto001/n8n-jianying:{VERSION} .
docker tag hunseto001/n8n-jianying:{VERSION} hunseto001/n8n-jianying:latest
```

### 步骤五：推送镜像

```bash
# Docker Hub
docker push hunseto001/n8n-jianying:{VERSION}
docker push hunseto001/n8n-jianying:latest

# ghcr.io
docker tag hunseto001/n8n-jianying:{VERSION} ghcr.io/hunseto1413/n8n-jianying:{VERSION}
docker tag hunseto001/n8n-jianying:{VERSION} ghcr.io/hunseto1413/n8n-jianying:latest
docker push ghcr.io/hunseto1413/n8n-jianying:{VERSION}
docker push ghcr.io/hunseto1413/n8n-jianying:latest
```

### 步骤六：验证

```bash
# 验证镜像存在
docker run --rm --network host curlimages/curl:8.14.1 -s "https://hub.docker.com/v2/repositories/hunseto001/n8n-jianying/tags/?page_size=10" | python -m json.tool

# 或在桌面端"版本管理"页面查看可用版本列表
```

---

## 三、桌面端版本管理关联

桌面端的"版本管理"页面会自动从 Docker Hub 获取 `hunseto001/n8n-jianying` 的可用版本标签。

**数据流**：Rust `version.rs` → Docker Hub API（通过 curlimages/curl 容器）→ 前端显示

推送新镜像到 Docker Hub 后，桌面端重新进入版本管理页面即可看到新版本。

---

## 四、常见问题

### Q: Docker Hub 从宿主机无法访问？
A: 使用 Docker 容器内网中转：
```bash
docker run --rm --network host curlimages/curl:8.14.1 -s "https://hub.docker.com/v2/repositories/..." | python -m json.tool
```

### Q: 汉化包 tar.gz 解压后目录是什么？
A: 解压后是 `dist/` 目录，不是 `editor-ui-dist/`。Dockerfile 中应使用 `cp -rf dist/*`。

### Q: macOS 构建 icon not RGBA？
A: 项目 `package.json` 中已有 `sharp` 依赖，执行本文档中的图标转换脚本即可。

### Q: CI 构建失败如何重新触发？
A: 删除旧 tag 重新打：
```bash
git tag -d vx.x.x
git push origin :refs/tags/vx.x.x
git tag vx.x.x
git push origin vx.x.x
```
或直接在 GitHub Actions 页面点击 Re-run。
