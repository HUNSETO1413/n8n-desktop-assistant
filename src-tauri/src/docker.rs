use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerStatus {
    #[serde(alias = "ID")]
    pub id: String,
    #[serde(alias = "Names", alias = "Name")]
    pub name: String,
    #[serde(alias = "Status")]
    pub status: String,
    #[serde(alias = "Image")]
    pub image: String,
    #[serde(alias = "RunningFor")]
    pub uptime: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerPsResult {
    pub containers: Vec<ContainerStatus>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposePsResult {
    pub services: Vec<ContainerStatus>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerBuildResult {
    pub success: bool,
    pub error: Option<String>,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerLogsResult {
    pub logs: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalImage {
    pub repository: String,
    pub tag: String,
    pub id: String,
    pub created: String,
    pub size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListImagesResult {
    pub images: Vec<LocalImage>,
    pub success: bool,
    pub error: Option<String>,
}

pub fn get_docker_compose_dir(install_path: &str) -> PathBuf {
    #[cfg(windows)]
    {
        PathBuf::from(install_path.replace('/', "\\"))
    }
    #[cfg(not(windows))]
    {
        PathBuf::from(install_path)
    }
}

#[tauri::command]
pub async fn docker_ps(app: AppHandle) -> Result<DockerPsResult, String> {
    let output = app.shell().command("docker")
        .args(["ps", "-a", "--format", "{{json .}}"])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker ps: {}", e))?;

    if !output.status.success() {
        return Ok(DockerPsResult {
            containers: vec![],
            success: false,
            error: Some(String::from_utf8_lossy(&output.stderr).to_string()),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();

    let mut containers = Vec::new();
    for line in lines {
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(status) = serde_json::from_str::<ContainerStatus>(line) {
            containers.push(status);
        }
    }

    Ok(DockerPsResult {
        containers,
        success: true,
        error: None,
    })
}

#[tauri::command]
pub async fn compose_ps(
    app: AppHandle,
    install_path: String,
) -> Result<ComposePsResult, String> {
    let work_dir = get_docker_compose_dir(&install_path);
    let project_name = work_dir.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("n8n-compose");

    let filter = format!("label=com.docker.compose.project={}", project_name);

    let output = app.shell().command("docker")
        .args(["ps", "-a", "--format", "{{json .}}", "--filter", &filter])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker ps: {}", e))?;

    if !output.status.success() {
        return Ok(ComposePsResult {
            services: vec![],
            success: false,
            error: Some(String::from_utf8_lossy(&output.stderr).to_string()),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();

    let mut services = Vec::new();
    for line in lines {
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(status) = serde_json::from_str::<ContainerStatus>(line) {
            services.push(status);
        }
    }

    Ok(ComposePsResult {
        services,
        success: true,
        error: None,
    })
}

#[tauri::command]
pub async fn compose_up(
    app: AppHandle,
    install_path: String,
) -> Result<bool, String> {
    let compose_file = get_docker_compose_dir(&install_path).join("docker-compose.yml");
    let compose_file_str = compose_file.to_str().ok_or("Invalid path")?.replace('\\', "/");

    let output = app.shell().command("docker")
        .args(["compose", "-f", &compose_file_str, "up", "-d"])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker compose up: {}", e))?;

    if !output.status.success() {
        return Err(format!("docker compose up failed: {}",
            String::from_utf8_lossy(&output.stderr)));
    }

    Ok(true)
}

#[tauri::command]
pub async fn compose_down(
    app: AppHandle,
    install_path: String,
) -> Result<bool, String> {
    let compose_file = get_docker_compose_dir(&install_path).join("docker-compose.yml");
    let compose_file_str = compose_file.to_str().ok_or("Invalid path")?.replace('\\', "/");

    let output = app.shell().command("docker")
        .args(["compose", "-f", &compose_file_str, "down"])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker compose down: {}", e))?;

    if !output.status.success() {
        return Err(format!("docker compose down failed: {}",
            String::from_utf8_lossy(&output.stderr)));
    }

    Ok(true)
}

#[tauri::command]
pub async fn docker_build(
    app: AppHandle,
    install_path: String,
    image_name: String,
) -> Result<DockerBuildResult, String> {
    let work_dir = get_docker_compose_dir(&install_path);
    let dockerfile = work_dir.join("Dockerfile");
    let dockerfile_str = dockerfile.to_str().ok_or("Invalid path")?;
    let work_dir_str = work_dir.to_str().ok_or("Invalid path")?;

    let output = app.shell().command("docker")
        .args(["build", "--network", "host", "-t", &image_name, "-f", dockerfile_str, work_dir_str])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker build: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let all_output = format!("{}\n{}", stdout, stderr);

    if !output.status.success() {
        return Ok(DockerBuildResult {
            success: false,
            error: Some(all_output.clone()),
            output: all_output,
        });
    }

    Ok(DockerBuildResult {
        success: true,
        error: None,
        output: all_output,
    })
}

#[tauri::command]
pub async fn docker_pull(
    app: AppHandle,
    image: String,
) -> Result<bool, String> {
    let output = app.shell().command("docker")
        .args(["pull", &image])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker pull: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "docker pull failed: {}",
            String::from_utf8_lossy(&output.stderr).to_string()));
    }

    Ok(true)
}

#[tauri::command]
pub async fn docker_restart(
    app: AppHandle,
    container_name: String,
) -> Result<bool, String> {
    let output = app.shell().command("docker")
        .args(["restart", &container_name])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker restart: {}", e))?;

    if !output.status.success() {
        return Err(format!("docker restart failed: {}",
            String::from_utf8_lossy(&output.stderr)));
    }

    Ok(true)
}

#[tauri::command]
pub async fn compose_logs(
    app: AppHandle,
    install_path: String,
    service: String,
    tail: Option<String>,
) -> Result<DockerLogsResult, String> {
    let compose_file = get_docker_compose_dir(&install_path).join("docker-compose.yml");
    let compose_file_str = compose_file.to_str().ok_or("Invalid path")?.replace('\\', "/");
    let tail_count = tail.unwrap_or_else(|| "200".to_string());

    let output = app.shell().command("docker")
        .args(["compose", "-f", &compose_file_str, "logs", "--tail", &tail_count, &service])
        .output()
        .await
        .map_err(|e| format!("Failed to run docker compose logs: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    Ok(DockerLogsResult {
        logs: format!("{}\n{}", stdout, stderr),
        success: true,
        error: None,
    })
}

#[tauri::command]
pub async fn list_local_images(app: AppHandle) -> Result<ListImagesResult, String> {
    let output = app.shell().command("docker")
        .args(["images", "--format", "{{json .}}", "--filter", "reference=*n8n*"])
        .output()
        .await
        .map_err(|e| format!("Failed to list images: {}", e))?;

    if !output.status.success() {
        return Ok(ListImagesResult {
            images: vec![],
            success: false,
            error: Some(String::from_utf8_lossy(&output.stderr).to_string()),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut images = Vec::new();

    for line in stdout.lines() {
        if line.trim().is_empty() { continue; }
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            images.push(LocalImage {
                repository: v.get("Repository").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                tag: v.get("Tag").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                id: v.get("ID").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                created: v.get("CreatedSince").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                size: v.get("Size").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            });
        }
    }

    Ok(ListImagesResult { images, success: true, error: None })
}

#[tauri::command]
pub async fn tag_image(
    app: AppHandle,
    source: String,
    target: String,
) -> Result<bool, String> {
    let output = app.shell().command("docker")
        .args(["tag", &source, &target])
        .output()
        .await
        .map_err(|e| format!("Failed to tag image: {}", e))?;

    if !output.status.success() {
        return Err(format!("docker tag failed: {}", String::from_utf8_lossy(&output.stderr)));
    }
    Ok(true)
}

#[tauri::command]
pub async fn push_image(
    app: AppHandle,
    image: String,
) -> Result<bool, String> {
    let output = app.shell().command("docker")
        .args(["push", &image])
        .output()
        .await
        .map_err(|e| format!("Failed to push image: {}", e))?;

    if !output.status.success() {
        return Err(format!("docker push failed: {}", String::from_utf8_lossy(&output.stderr)));
    }
    Ok(true)
}

#[tauri::command]
pub async fn docker_login(
    app: AppHandle,
    registry: String,
    username: String,
    password: String,
) -> Result<bool, String> {
    let mut args = vec!["login".to_string()];
    if !registry.is_empty() {
        args.push(registry);
    }
    args.extend(["-u".to_string(), username, "-p".to_string(), password]);

    let output = app.shell().command("docker")
        .args(&args)
        .output()
        .await
        .map_err(|e| format!("Failed to login: {}", e))?;

    if !output.status.success() {
        return Err(format!("docker login failed: {}", String::from_utf8_lossy(&output.stderr)));
    }
    Ok(true)
}
