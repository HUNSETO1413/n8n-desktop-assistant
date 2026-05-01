// ENTERPRISE MOCK START
try {
    const { LICENSE_QUOTAS, LICENSE_FEATURES, UNLIMITED_LICENSE_QUOTA } = require("@n8n/constants");
    const originalGetValue = this.license.getValue.bind(this.license);
    this.license.isLicensed = function(feature) {
        if (feature === "feat:showNonProdBanner") return false;
        return true;
    };
    this.license.getValue = (feature) => {
        if (feature === "planName") return "Enterprise";
        if (Object.values(LICENSE_QUOTAS).includes(feature)) return UNLIMITED_LICENSE_QUOTA;
        if (Object.values(LICENSE_FEATURES).includes(feature)) return true;
        return originalGetValue(feature);
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
