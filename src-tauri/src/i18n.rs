use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use crate::docker::get_docker_compose_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct I18nDownloadResult {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionInfo {
    pub version: String,
    pub release_date: String,
    pub download_url: String,
}

#[tauri::command]
pub async fn download_i18n(
    app: AppHandle,
    n8n_version: String,
    install_path: String,
) -> Result<I18nDownloadResult, String> {
    let work_dir = get_docker_compose_dir(&install_path);
    let dist_dir = work_dir.join("editor-ui-dist");

    let url = format!(
        "https://github.com/other-blowsnow/n8n-i18n-chinese/releases/download/release/{}/editor-ui.tar.gz",
        n8n_version
    );

    let output = app.shell().command("curl")
        .args(["-L", "-o", "/tmp/editor-ui.tar.gz", &url])
        .output()
        .await
        .map_err(|e| format!("Failed to download i18n files: {}", e))?;

    if !output.status.success() {
        return Ok(I18nDownloadResult {
            success: false,
            error: Some(String::from_utf8_lossy(&output.stderr).to_string()),
        });
    }

    let extract_output = app.shell().command("tar")
        .args(["-xzf", "/tmp/editor-ui.tar.gz", "-C", work_dir.to_str().ok_or("Invalid path")?])
        .output()
        .await
        .map_err(|e| format!("Failed to extract i18n files: {}", e))?;

    if !extract_output.status.success() {
        return Ok(I18nDownloadResult {
            success: false,
            error: Some(String::from_utf8_lossy(&extract_output.stderr).to_string()),
        });
    }

    Ok(I18nDownloadResult {
        success: true,
        error: None,
    })
}

#[tauri::command]
pub async fn check_i18n_available(
    app: AppHandle,
    n8n_version: String,
) -> Result<Option<VersionInfo>, String> {
    let url = "https://api.github.com/repos/other-blowsnow/n8n-i18n-chinese/releases?per_page=10";

    let output = app.shell().command("curl")
        .args(["-s", &url])
        .output()
        .await
        .map_err(|e| format!("Failed to check i18n availability: {}", e))?;

    if !output.status.success() {
        return Ok(None);
    }

    let releases_json = String::from_utf8_lossy(&output.stdout);
    let releases: Vec<serde_json::Value> = serde_json::from_str(&releases_json)
        .unwrap_or_default();

    for release in releases {
        let tag_name = release.get("tag_name").and_then(|v| v.as_str()).unwrap_or("");
        let version_pattern = format!("release/{}", n8n_version);
        if tag_name == version_pattern || tag_name == n8n_version {
            if let Some(download_url) = release
                .get("html_url")
                .and_then(|u| u.as_str())
                .or_else(|| {
                    release
                        .get("assets")
                        .and_then(|a| a.as_array())
                        .and_then(|arr| arr.first())
                        .and_then(|a| a.get("browser_download_url"))
                        .and_then(|u| u.as_str())
                })
            {
                if let Some(published_at) = release.get("published_at").and_then(|v| v.as_str()) {
                    return Ok(Some(VersionInfo {
                        version: n8n_version.to_string(),
                        release_date: published_at.to_string(),
                        download_url: download_url.to_string(),
                    }));
                }
            }
        }
    }

    Ok(None)
}
