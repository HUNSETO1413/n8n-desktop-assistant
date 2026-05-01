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

#[tauri::command]
pub async fn check_updates(
    app: AppHandle,
    current_version: String,
) -> Result<VersionCheckResult, String> {
    let url = "https://hub.docker.com/v2/repositories/n8nio/n8n/tags/?page_size=20&ordering=last_updated";

    let output = app.shell().command("curl")
        .args(["-s", &url])
        .output()
        .await
        .map_err(|e| format!("Failed to check updates: {}", e))?;

    if !output.status.success() {
        return Ok(VersionCheckResult {
            current_version,
            available_versions: vec![],
        });
    }

    let response_json = String::from_utf8_lossy(&output.stdout);
    let response: serde_json::Value = serde_json::from_str(&response_json).unwrap_or_default();
    let empty_vec = vec![];
    let results = response.get("results").and_then(|v| v.as_array()).unwrap_or(&empty_vec);

    let mut versions = Vec::new();
    for tag in results {
        if let Some(name) = tag.get("name").and_then(|v| v.as_str()) {
            if !name.starts_with("rc-") && !name.contains("edge") {
                versions.push(name.to_string());
            }
        }
    }

    Ok(VersionCheckResult {
        current_version,
        available_versions: versions,
    })
}
