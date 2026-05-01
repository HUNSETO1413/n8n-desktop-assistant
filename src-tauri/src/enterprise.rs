use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use crate::docker::get_docker_compose_dir;

const ENTERPRISE_MOCK_TEMPLATE: &str = r#"
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

#[tauri::command]
pub async fn extract_base_command(
    app: AppHandle,
    n8n_version: String,
) -> Result<ExtractResult, String> {
    let image_name = format!("n8nio/n8n:{}", n8n_version);

    let output = app.shell().command("docker")
        .args(["run", "--rm", "--entrypoint", "cat", &image_name,
              "/usr/local/lib/node_modules/n8n/dist/commands/base-command.js"])
        .output()
        .await
        .map_err(|e| format!("Failed to extract base-command.js: {}", e))?;

    if !output.status.success() {
        return Ok(ExtractResult {
            success: false,
            content: String::new(),
            error: Some(String::from_utf8_lossy(&output.stderr).to_string()),
        });
    }

    let content = String::from_utf8_lossy(&output.stdout).to_string();

    Ok(ExtractResult {
        success: true,
        content,
        error: None,
    })
}

#[tauri::command]
pub fn inject_enterprise(
    install_path: String,
    content: String,
) -> Result<InjectResult, String> {
    let work_dir = get_docker_compose_dir(&install_path);
    let file_path = work_dir.join("base-command.js");

    let file_content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read base-command.js: {}", e))?;

    if file_content.contains("// ENTERPRISE MOCK START") {
        return Ok(InjectResult {
            success: true,
            error: None,
        });
    }

    let injection_point = file_content
        .find("    }")
        .ok_or("Could not find injection point in base-command.js")?;

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
