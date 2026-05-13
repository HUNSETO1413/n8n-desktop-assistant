use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use crate::docker::get_docker_compose_dir;

const ENTERPRISE_MOCK_TEMPLATE: &str = r#"
        // ENTERPRISE MOCK START
        try {
            const { LICENSE_QUOTAS, LICENSE_FEATURES, UNLIMITED_LICENSE_QUOTA } = constants_1;
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
                "isSamlEnabled", "isVariablesEnabled",
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
            this.license.isSourceControlLicensed = () => false;
            this.license.isAPIDisabled = () => false;
            this.license.isAiAssistantEnabled = () => false;
            this.license.getAiCredits = () => 999999;
            this.license.getPlanName = () => "Enterprise";
            this.license.getConsumerId = () => "enterprise-mock-consumer";
            this.license.getManagementJwt = () => "mock-jwt-token";
            this.logger.info("[ENTERPRISE MOCK] All enterprise features enabled");
        } catch (error) {
            this.logger.error("[ENTERPRISE MOCK] Failed to enable enterprise mock:", { error: error.message || String(error), stack: error.stack });
        }
        // ENTERPRISE MOCK END
"#;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractResult {
    pub success: bool,
    pub content: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InjectResult {
    pub success: bool,
    pub error: Option<String>,
}

/// Paths where base-command.js might exist inside the n8n Docker image.
/// We try them in order; the first one that returns valid content wins.
const BASE_COMMAND_PATHS: &[&str] = &[
    "/usr/local/lib/node_modules/n8n/dist/commands/base-command.js",
    "/usr/local/lib/node_modules/n8n/dist/commands/BaseCommand.js",
    "/usr/local/lib/node_modules/n8n/dist/src/commands/base-command.js",
];

#[tauri::command]
pub async fn extract_base_command(
    app: AppHandle,
    n8n_version: String,
    install_path: String,
    image_name: Option<String>,
) -> Result<ExtractResult, String> {
    crate::docker::ensure_docker();

    // Use the custom image if provided, otherwise fall back to official n8n image
    let docker_image = image_name.unwrap_or_else(|| format!("n8nio/n8n:{}", n8n_version));

    let mut content: Option<String> = None;
    let mut last_error = String::new();

    for path in BASE_COMMAND_PATHS {
        let output = app.shell().command("docker")
            .args(["run", "--rm", "--entrypoint", "cat", &docker_image, path])
            .output()
            .await
            .map_err(|e| format!("Failed to extract base-command.js: {}", e))?;

        if output.status.success() && !output.stdout.is_empty() {
            let candidate = String::from_utf8_lossy(&output.stdout).to_string();
            // Basic validation: the file should look like JavaScript
            if candidate.contains("class") || candidate.contains("exports") || candidate.contains("module") {
                content = Some(candidate);
                break;
            }
        }
        last_error = String::from_utf8_lossy(&output.stderr).to_string();
    }

    let content = match content {
        Some(c) => c,
        None => {
            return Ok(ExtractResult {
                success: false,
                content: String::new(),
                error: Some(format!(
                    "Could not find base-command.js in Docker image {}. Tried paths: {:?}. Last error: {}",
                    docker_image, BASE_COMMAND_PATHS, last_error
                )),
            });
        }
    };

    let work_dir = get_docker_compose_dir(&install_path);
    let file_path = work_dir.join("base-command.js");
    // If a directory exists at this path (e.g. from a Docker volume mount), remove it first
    if file_path.is_dir() {
        std::fs::remove_dir_all(&file_path)
            .map_err(|e| format!("Failed to remove base-command.js directory: {}", e))?;
    }
    std::fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write base-command.js: {}", e))?;

    Ok(ExtractResult {
        success: true,
        content,
        error: None,
    })
}

/// Find the position of the closing brace of a method body.
/// Returns the index of the closing `}` so we can inject just before it.
fn find_method_body_end(file_content: &str, method_name: &str) -> Option<usize> {
    let search = format!("{}(", method_name);
    let mut search_from = 0;
    while let Some(start) = file_content[search_from..].find(&search) {
        let abs_start = search_from + start;
        // Make sure this is not a substring of a longer identifier
        if abs_start > 0 {
            let prev_byte = file_content.as_bytes()[abs_start - 1];
            if prev_byte.is_ascii_alphanumeric() || prev_byte == b'_' {
                search_from = abs_start + search.len();
                continue;
            }
        }

        // Track balanced parentheses to skip the parameter list
        let mut depth = 0;
        let mut pos = abs_start + search.len() - 1;
        let bytes = file_content.as_bytes();
        let len = bytes.len();
        while pos < len {
            match bytes[pos] {
                b'(' => depth += 1,
                b')' => {
                    depth -= 1;
                    if depth == 0 { break; }
                }
                _ => {}
            }
            pos += 1;
        }
        if depth != 0 {
            search_from = abs_start + search.len();
            continue;
        }

        // Find the opening brace after the closing paren
        let mut brace_pos = pos + 1;
        let mut found = false;
        while brace_pos < len {
            match bytes[brace_pos] {
                b'{' => { found = true; break; }
                b'\n' | b' ' | b'\t' | b'\r' => brace_pos += 1,
                _ => break,
            }
        }
        if !found {
            search_from = abs_start + search.len();
            continue;
        }

        // Track balanced braces to find the matching closing brace
        let mut brace_depth = 1;
        let mut cur = brace_pos + 1;
        while cur < len {
            match bytes[cur] {
                b'{' => brace_depth += 1,
                b'}' => {
                    brace_depth -= 1;
                    if brace_depth == 0 {
                        return Some(cur);
                    }
                }
                _ => {}
            }
            cur += 1;
        }

        search_from = abs_start + search.len();
    }
    None
}

/// Find injection point — must be after this.license is initialized.
/// Best spot: end of initLicense() method. Fallback: after the line
/// `this.license = ...` or end of constructor.
fn find_injection_point(file_content: &str) -> Result<usize, String> {
    // Strategy 1: End of initLicense() — this.license is fully initialized here
    if let Some(pos) = find_method_body_end(file_content, "initLicense") {
        return Ok(pos);
    }

    // Strategy 2: End of setup() method
    if let Some(pos) = find_method_body_end(file_content, "setup") {
        return Ok(pos);
    }

    // Strategy 3: End of constructor body (may not work if this.license not yet set)
    if let Some(pos) = find_method_body_end(file_content, "constructor") {
        return Ok(pos);
    }

    // Strategy 4: Last closing brace
    if let Some(pos) = file_content.rfind('}') {
        return Ok(pos);
    }

    Err("Could not find a reliable injection point in base-command.js.".to_string())
}

#[tauri::command]
pub fn inject_enterprise(
    install_path: String,
    content: String,
) -> Result<InjectResult, String> {
    let work_dir = get_docker_compose_dir(&install_path);
    let file_path = work_dir.join("base-command.js");
    if file_path.is_dir() {
        std::fs::remove_dir_all(&file_path)
            .map_err(|e| format!("Failed to remove base-command.js directory: {}", e))?;
    }

    let file_content = if !content.is_empty() {
        std::fs::write(&file_path, &content)
            .map_err(|e| format!("Failed to write base-command.js: {}", e))?;
        content
    } else {
        std::fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read base-command.js: {}", e))?
    };

    if file_content.contains("// ENTERPRISE MOCK START") {
        // Remove existing injection so we can re-inject at the correct position
        let start_marker = "// ENTERPRISE MOCK START";
        let end_marker = "// ENTERPRISE MOCK END";
        let mut cleaned = file_content.clone();
        while let Some(start) = cleaned.find(start_marker) {
            if let Some(end) = cleaned[start..].find(end_marker) {
                let end_pos = start + end + end_marker.len();
                cleaned = format!("{}{}", &cleaned[..start], &cleaned[end_pos..]);
            } else {
                break;
            }
        }
        // If after cleanup the content is the same as what we have, skip
        if cleaned == file_content {
            return Ok(InjectResult {
                success: true,
                error: None,
            });
        }
        // Re-inject into the cleaned content
        let injection_point = find_injection_point(&cleaned)?;
        let before = &cleaned[..injection_point];
        let after = &cleaned[injection_point..];
        let new_content = format!("{}\n{}\n{}", before, ENTERPRISE_MOCK_TEMPLATE, after);
        std::fs::write(&file_path, new_content)
            .map_err(|e| format!("Failed to write base-command.js: {}", e))?;
        return Ok(InjectResult {
            success: true,
            error: None,
        });
    }

    let injection_point = find_injection_point(&file_content)?;

    // injection_point is the closing '}' — inject just before it
    let before = &file_content[..injection_point];
    let after = &file_content[injection_point..];

    let new_content = format!("{}\n{}\n{}", before, ENTERPRISE_MOCK_TEMPLATE, after);

    std::fs::write(&file_path, new_content)
        .map_err(|e| format!("Failed to write base-command.js: {}", e))?;

    Ok(InjectResult {
        success: true,
        error: None,
    })
}
