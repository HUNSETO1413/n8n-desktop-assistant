const fs = require('fs');

const MOCK_CODE = `
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
`;

const target = process.argv[2] || '/usr/local/lib/node_modules/n8n/dist/commands/base-command.js';
let content = fs.readFileSync(target, 'utf8');

if (content.includes('// ENTERPRISE MOCK START')) {
    console.log('Enterprise mock already injected, skipping.');
    process.exit(0);
}

const idx = content.indexOf('    }');
if (idx === -1) {
    console.error('Injection point not found!');
    process.exit(1);
}

const newContent = content.slice(0, idx) + MOCK_CODE + '\n' + content.slice(idx);
fs.writeFileSync(target, newContent, 'utf8');
console.log('Enterprise mock injected successfully.');
