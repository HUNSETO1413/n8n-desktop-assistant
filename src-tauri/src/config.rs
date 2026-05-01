use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPaths {
    #[serde(default)]
    pub postgresql: String,

    #[serde(default)]
    pub n8n_data: String,

    #[serde(default)]
    pub external: String,

    #[serde(default)]
    pub ffmpeg: String,

    #[serde(default)]
    pub images: String,

    #[serde(default)]
    pub mcp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default)]
    pub schema_version: u32,

    #[serde(default)]
    pub install_path: String,

    #[serde(default)]
    pub data_paths: DataPaths,

    #[serde(default)]
    pub n8n_version: String,

    #[serde(default)]
    pub workers: u32,

    #[serde(default)]
    pub webhook_url: String,

    #[serde(default)]
    pub encryption_key: String,

    #[serde(default)]
    pub db_password: String,

    #[serde(default)]
    pub enterprise_enabled: bool,

    #[serde(default)]
    pub chinese_ui_enabled: bool,

    #[serde(default)]
    pub port: u16,

    #[serde(default)]
    pub image_name: String,
}

impl Default for DataPaths {
    fn default() -> Self {
        DataPaths {
            postgresql: default_postgresql(),
            n8n_data: default_n8n_data(),
            external: default_external(),
            ffmpeg: default_ffmpeg(),
            images: default_images(),
            mcp: default_mcp(),
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            schema_version: 1,
            install_path: default_install_path(),
            data_paths: DataPaths::default(),
            n8n_version: default_n8n_version(),
            workers: 3,
            webhook_url: default_webhook_url(),
            encryption_key: default_encryption_key(),
            db_password: default_db_password(),
            enterprise_enabled: true,
            chinese_ui_enabled: true,
            port: 5678,
            image_name: default_image_name(),
        }
    }
}

// Platform-specific defaults
#[cfg(windows)]
fn default_install_path() -> String {
    "D:\\n8n-compose".to_string()
}

#[cfg(target_os = "macos")]
fn default_install_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
    format!("{}/n8n-compose", home)
}

#[cfg(windows)]
fn default_postgresql() -> String {
    "D:\\n8n-postgresql".to_string()
}

#[cfg(target_os = "macos")]
fn default_postgresql() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
    format!("{}/n8n-postgresql", home)
}

#[cfg(windows)]
fn default_n8n_data() -> String {
    "D:\\n8n-date".to_string()
}

#[cfg(target_os = "macos")]
fn default_n8n_data() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
    format!("{}/n8n-data", home)
}

#[cfg(windows)]
fn default_external() -> String {
    "D:\\n8n-external".to_string()
}

#[cfg(target_os = "macos")]
fn default_external() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
    format!("{}/n8n-external", home)
}

#[cfg(windows)]
fn default_ffmpeg() -> String {
    "D:\\n8n-ffmpeg".to_string()
}

#[cfg(target_os = "macos")]
fn default_ffmpeg() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
    format!("{}/n8n-ffmpeg", home)
}

#[cfg(windows)]
fn default_images() -> String {
    "D:\\n8n-images".to_string()
}

#[cfg(target_os = "macos")]
fn default_images() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
    format!("{}/n8n-images", home)
}

#[cfg(windows)]
fn default_mcp() -> String {
    "D:\\n8n-mcp".to_string()
}

#[cfg(target_os = "macos")]
fn default_mcp() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
    format!("{}/n8n-mcp", home)
}

fn default_n8n_version() -> String {
    "2.18.5".to_string()
}

fn default_webhook_url() -> String {
    "http://localhost:5678/".to_string()
}

fn default_encryption_key() -> String {
    "iX2PxOqkh71A+AStsT8hEic+Co597arX".to_string()
}

fn default_db_password() -> String {
    "n8n".to_string()
}

fn default_port() -> u16 {
    5678
}

fn default_image_name() -> String {
    "n8n-jianying:latest".to_string()
}

pub fn get_config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

#[tauri::command]
pub fn load_config(app: tauri::AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_dir(&app)?
        .join("config.json");

    if !config_path.exists() {
        return Ok(AppConfig::default());
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    let config: AppConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    Ok(config)
}

#[tauri::command]
pub fn save_config(
    app: tauri::AppHandle,
    config: AppConfig,
) -> Result<(), String> {
    let config_path = get_config_dir(&app)?
        .join("config.json");

    let config_dir = config_path
        .parent()
        .ok_or("Invalid config path")?;

    fs::create_dir_all(config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}
