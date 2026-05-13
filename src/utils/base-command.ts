import { invoke } from '@tauri-apps/api/core';

interface ExtractResult {
  success: boolean;
  content: string;
  error?: string;
}

export async function prepareBaseCommand(
  installPath: string,
  n8nVersion: string,
  enterpriseEnabled: boolean,
  imageName?: string,
): Promise<void> {
  const result = await invoke<ExtractResult>('extract_base_command', {
    n8nVersion,
    installPath,
    imageName,
  });

  if (!result.success) {
    throw new Error(result.error || '提取 base-command.js 失败');
  }

  if (enterpriseEnabled) {
    await invoke('inject_enterprise', { installPath, content: result.content });
  }
}
