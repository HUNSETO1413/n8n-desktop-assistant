use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionCheckResult {
    pub current_version: String,
    pub available_versions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateStep {
    pub step: u32,
    pub total: u32,
    pub description: String,
    pub status: String,
    pub progress: u32,
}

const DOCKERHUB_REPO: &str = "hunseto001/n8n-jianying";

#[tauri::command]
pub async fn check_updates(
    app: AppHandle,
    current_version: String,
) -> Result<VersionCheckResult, String> {
    let url = format!(
        "https://hub.docker.com/v2/repositories/{}/tags/?page_size=20&ordering=last_updated",
        DOCKERHUB_REPO
    );

    // Docker Hub is unreachable from host network, use Docker's internal network via container
    let output = app.shell().command("docker")
        .args([
            "run", "--rm", "--network", "host",
            "curlimages/curl:8.14.1",
            "-s", "--max-time", "15", &url,
        ])
        .output()
        .await
        .map_err(|e| format!("检查更新失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // If curlimages/curl is not available, try pulling it first
        if stderr.contains("not found") || stderr.contains("No such image") {
            let _ = app.shell().command("docker")
                .args(["pull", "curlimages/curl:8.14.1"])
                .output()
                .await;

            let retry = app.shell().command("docker")
                .args([
                    "run", "--rm", "--network", "host",
                    "curlimages/curl:8.14.1",
                    "-s", "--max-time", "15", &url,
                ])
                .output()
                .await
                .map_err(|e| format!("检查更新失败: {}", e))?;

            if !retry.status.success() {
                return Ok(VersionCheckResult {
                    current_version,
                    available_versions: vec![],
                });
            }

            return parse_response(&String::from_utf8_lossy(&retry.stdout), current_version);
        }

        return Ok(VersionCheckResult {
            current_version,
            available_versions: vec![],
        });
    }

    parse_response(&String::from_utf8_lossy(&output.stdout), current_version)
}

fn parse_response(response_json: &str, current_version: String) -> Result<VersionCheckResult, String> {
    let response: serde_json::Value = serde_json::from_str(response_json).unwrap_or_default();
    let empty_vec = vec![];
    let results = response.get("results").and_then(|v| v.as_array()).unwrap_or(&empty_vec);

    let mut versions = Vec::new();
    for tag in results {
        if let Some(name) = tag.get("name").and_then(|v| v.as_str()) {
            if name != "latest" && !name.starts_with("sha-") {
                versions.push(name.to_string());
            }
        }
    }

    Ok(VersionCheckResult {
        current_version,
        available_versions: versions,
    })
}
