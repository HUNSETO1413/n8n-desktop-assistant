import { invoke } from '@tauri-apps/api/core';

export async function prepareBaseCommand(
  installPath: string,
  n8nVersion: string,
  enterpriseEnabled: boolean,
): Promise<void> {
  const result = await invoke<{ content: string }>('extract_base_command', {
    n8nVersion,
    installPath,
  });
  if (enterpriseEnabled) {
    await invoke('inject_enterprise', { installPath, content: result.content });
  }
}
