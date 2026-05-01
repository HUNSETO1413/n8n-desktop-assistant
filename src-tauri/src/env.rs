use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvItem {
    pub name: String,
    pub status: bool,
    pub version: Option<String>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvCheckResult {
    pub items: Vec<EnvItem>,
    pub can_proceed: bool,
}

#[cfg(windows)]
fn check_docker() -> EnvItem {
    use std::process::Command;

    match Command::new("docker").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "Docker Desktop".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
            }
        }
        Err(_) => EnvItem {
            name: "Docker Desktop".to_string(),
            status: false,
            version: None,
            required: true,
        }
    }
}

#[cfg(target_os = "macos")]
fn check_docker() -> EnvItem {
    use std::process::Command;

    match Command::new("docker").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "Docker Desktop".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
            }
        }
        Err(_) => EnvItem {
            name: "Docker Desktop".to_string(),
            status: false,
            version: None,
            required: true,
        }
    }
}

fn check_node() -> EnvItem {
    use std::process::Command;

    match Command::new("node").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "Node.js".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
            }
        }
        Err(_) => EnvItem {
            name: "Node.js".to_string(),
            status: false,
            version: None,
            required: true,
        }
    }
}

fn check_npm() -> EnvItem {
    use std::process::Command;

    match Command::new("npm").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "npm".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
            }
        }
        Err(_) => EnvItem {
            name: "npm".to_string(),
            status: false,
            version: None,
            required: true,
        }
    }
}

fn check_git() -> EnvItem {
    use std::process::Command;

    match Command::new("git").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            EnvItem {
                name: "Git".to_string(),
                status: true,
                version: Some(version.trim().to_string()),
                required: true,
            }
        }
        Err(_) => EnvItem {
            name: "Git".to_string(),
            status: false,
            version: None,
            required: true,
        }
    }
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
    })
}
