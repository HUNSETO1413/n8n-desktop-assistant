use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use crate::crypto::{decrypt_data, generate_signature};
use crate::config::get_config_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseData {
    pub machine_id: String,
    pub license_type: String,
    pub expire_days: i32,
    pub issue_time: String,
    pub sign: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseValidationResult {
    pub valid: bool,
    pub license_type: Option<String>,
    pub expire_time: Option<String>,
    pub error: Option<String>,
}

const LICENSE_FILE: &str = "license.dat";

#[tauri::command]
pub async fn validate_license(
    machine_id: String,
    manager: AppHandle,
) -> Result<LicenseValidationResult, String> {
    let license_path = get_config_dir(&manager)?
        .join(LICENSE_FILE);

    if !license_path.exists() {
        return Ok(LicenseValidationResult {
            valid: false,
            license_type: None,
            expire_time: None,
            error: Some("License file not found".to_string()),
        });
    }

    let encrypted = fs::read_to_string(&license_path)
        .map_err(|e| format!("Failed to read license: {}", e))?;

    let decrypted_bytes = decrypt_data(&encrypted)
        .map_err(|e| format!("Failed to decrypt license: {}", e))?;

    let license_json = String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("Invalid UTF-8 in license: {}", e))?;

    let license_data: LicenseData = serde_json::from_str(&license_json)
        .map_err(|e| format!("Failed to parse license: {}", e))?;

    let expected_data = format!("{}{}{}",
        license_data.machine_id,
        license_data.license_type,
        license_data.expire_days
    );
    let expected_sign = generate_signature(&expected_data);

    let is_signature_valid = license_data.sign == expected_sign;
    let is_machine_valid = license_data.machine_id == machine_id;

    if !is_signature_valid {
        return Ok(LicenseValidationResult {
            valid: false,
            license_type: None,
            expire_time: None,
            error: Some("Invalid signature".to_string()),
        });
    }

    if !is_machine_valid {
        return Ok(LicenseValidationResult {
            valid: false,
            license_type: None,
            expire_time: None,
            error: Some("Machine ID mismatch".to_string()),
        });
    }

    let is_expired = if license_data.expire_days == 0 {
        false // Permanent
    } else {
        let issue_time = chrono::DateTime::parse_from_rfc3339(&license_data.issue_time)
            .map_err(|e| format!("Failed to parse issue time: {}", e))?;
        let now = chrono::Utc::now();
        let expiry_time = issue_time + chrono::Duration::days(license_data.expire_days as i64);
        now > expiry_time
    };

    if is_expired {
        return Ok(LicenseValidationResult {
            valid: false,
            license_type: None,
            expire_time: None,
            error: Some("License expired".to_string()),
        });
    }

    Ok(LicenseValidationResult {
        valid: true,
        license_type: Some(license_data.license_type),
        expire_time: Some(license_data.issue_time.clone()),
        error: None,
    })
}

#[tauri::command]
pub async fn activate_license(
    manager: AppHandle,
    machine_id: String,
    activation_code: String,
) -> Result<bool, String> {
    let decrypted_bytes = decrypt_data(&activation_code)
        .map_err(|e| format!("Failed to decrypt activation code: {}", e))?;

    let license_json = String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("Invalid UTF-8 in activation code: {}", e))?;

    let license_data: LicenseData = serde_json::from_str(&license_json)
        .map_err(|e| format!("Failed to parse activation code: {}", e))?;

    let expected_data = format!("{}{}{}",
        license_data.machine_id,
        license_data.license_type,
        license_data.expire_days
    );
    let expected_sign = generate_signature(&expected_data);

    if license_data.sign != expected_sign {
        return Err("Invalid activation code signature".to_string());
    }

    if license_data.machine_id != machine_id {
        return Err("Activation code does not match this machine".to_string());
    }

    let license_path = get_config_dir(&manager)?
        .join(LICENSE_FILE);

    let config_dir = license_path.parent().ok_or("Invalid license path")?;
    fs::create_dir_all(config_dir)
        .map_err(|e| format!("Failed to create license dir: {}", e))?;

    fs::write(&license_path, &activation_code)
        .map_err(|e| format!("Failed to write license: {}", e))?;

    Ok(true)
}
