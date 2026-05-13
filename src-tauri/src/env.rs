use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::OnceLock;
use sysinfo::System;
use tauri::Emitter;

/// Search common Docker install locations and add to PATH if found.
/// Idempotent — Only runs once thanks to OnceLock.
pub fn ensure_docker_path() {
    static DONE: OnceLock<()> = OnceLock::new();
    DONE.get_or_init(|| {
        // Already in PATH? Nothing to do.
        if Command::new("docker")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return;
        }

        #[cfg(windows)]
        {
            let drives = ["C", "D", "E", "F"];
            let sub_paths = [
                r"Program Files\Docker\Docker\resources\bin\docker.exe",
                r"Program Files\Docker\resources\bin\docker.exe",
            ];
            for drive in &drives {
                for sub in &sub_paths {
                    let path = format!("{}:\\{}", drive, sub);
                    if std::path::Path::new(&path).exists() {
                        if let Some(parent) = std::path::Path::new(&path).parent().and_then(|p| p.to_str()) {
                            if let Ok(current) = std::env::var("PATH") {
                                let _ = std::env::set_var("PATH", format!("{};{}", parent, current));
                            }
                        }
                        return;
                    }
                }
            }
        }
    });
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvItem {
    pub name: String,
    pub status: bool,
    pub version: Option<String>,
    pub required: bool,
    #[serde(default)]
    pub winget_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvCheckResult {
    pub items: Vec<EnvItem>,
    pub can_proceed: bool,
    pub winget_available: bool,
}

fn check_docker() -> EnvItem {
    ensure_docker_path();

    match Command::new("docker").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            // Check if Docker daemon is actually running
            let daemon_running = Command::new("docker")
                .args(["info", "--format", "{{.ServerVersion}}"])
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);

            if daemon_running {
                EnvItem {
                    name: "Docker Desktop".to_string(),
                    status: true,
                    version: Some(version),
                    required: true,
                    winget_id: Some("Docker.DockerDesktop".to_string()),
                }
            } else {
                EnvItem {
                    name: "Docker Desktop (未启动)".to_string(),
                    status: false,
                    version: Some(version),
                    required: true,
                    winget_id: Some("Docker.DockerDesktop".to_string()),
                }
            }
        }
        _ => EnvItem {
            name: "Docker Desktop".to_string(),
            status: false,
            version: None,
            required: true,
            winget_id: Some("Docker.DockerDesktop".to_string()),
        },
    }
}

fn check_node() -> EnvItem {
    match Command::new("node").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "Node.js".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
                winget_id: Some("OpenJS.NodeJS.LTS".to_string()),
            }
        }
        Err(_) => EnvItem {
            name: "Node.js".to_string(),
            status: false,
            version: None,
            required: true,
            winget_id: Some("OpenJS.NodeJS.LTS".to_string()),
        },
    }
}

fn check_npm() -> EnvItem {
    match Command::new("npm").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "npm".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
                winget_id: None,
            }
        }
        Err(_) => EnvItem {
            name: "npm".to_string(),
            status: false,
            version: None,
            required: true,
            winget_id: None,
        },
    }
}

fn check_git() -> EnvItem {
    match Command::new("git").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "Git".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
                winget_id: Some("Git.Git".to_string()),
            }
        }
        Err(_) => EnvItem {
            name: "Git".to_string(),
            status: false,
            version: None,
            required: true,
            winget_id: Some("Git.Git".to_string()),
        },
    }
}

fn is_winget_available() -> bool {
    Command::new("winget")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
pub fn check_environment() -> Result<EnvCheckResult, String> {
    let os_info = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());

    let os_item = EnvItem {
        name: format!("{} {}", os_info, os_version),
        status: true,
        version: Some(os_version.clone()),
        required: false,
        winget_id: None,
    };

    let docker = check_docker();
    let node = check_node();
    let npm = check_npm();
    let git = check_git();

    let items = vec![
        os_item,
        docker.clone(),
        node.clone(),
        npm.clone(),
        git.clone(),
    ];

    let can_proceed = docker.status && node.status && npm.status && git.status;

    Ok(EnvCheckResult {
        items,
        can_proceed,
        winget_available: is_winget_available(),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgress {
    pub package_name: String,
    pub winget_id: String,
    pub status: String,
    pub message: String,
}

#[tauri::command]
pub async fn install_dependencies(app: tauri::AppHandle) -> Result<(), String> {
    let env_result = check_environment()?;

    let missing: Vec<EnvItem> = env_result
        .items
        .iter()
        .filter(|item| item.required && !item.status && item.winget_id.is_some())
        .cloned()
        .collect();

    if missing.is_empty() {
        return Ok(());
    }

    if !env_result.winget_available {
        return Err("winget 不可用，请手动安装缺失的环境".to_string());
    }

    for item in &missing {
        let winget_id = item.winget_id.as_ref().unwrap().clone();
        let package_name = item.name.clone();
        let app_handle = app.clone();

        let _ = app_handle.emit(
            "install-progress",
            InstallProgress {
                package_name: package_name.clone(),
                winget_id: winget_id.clone(),
                status: "installing".to_string(),
                message: format!("正在安装 {}...", package_name),
            },
        );

        let wid = winget_id.clone();
        let output = tauri::async_runtime::spawn_blocking(move || {
            std::process::Command::new("winget")
                .args([
                    "install",
                    "--id",
                    &wid,
                    "--accept-source-agreements",
                    "--accept-package-agreements",
                    "-h",
                ])
                .output()
                .map_err(|e| format!("执行 winget 失败: {}", e))
        })
        .await
        .map_err(|e| format!("任务执行失败: {}", e))??;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        let success = output.status.success()
            || stdout.contains("Successfully installed")
            || stdout.contains("已成功安装");

        if success {
            let _ = app.emit(
                "install-progress",
                InstallProgress {
                    package_name,
                    winget_id,
                    status: "success".to_string(),
                    message: format!("{} 安装成功", item.name),
                },
            );
        } else {
            let error_msg = if !stderr.is_empty() { stderr } else { stdout };
            let _ = app.emit(
                "install-progress",
                InstallProgress {
                    package_name,
                    winget_id,
                    status: "error".to_string(),
                    message: format!(
                        "{} 安装失败: {}",
                        item.name,
                        error_msg.chars().take(200).collect::<String>()
                    ),
                },
            );
            return Err(format!("{} 安装失败", item.name));
        }
    }

    Ok(())
}
