export interface AppConfig {
  schema_version: number;
  install_path: string;
  data_paths: DataPaths;
  n8n_version: string;
  workers: number;
  webhook_url: string;
  encryption_key: string;
  db_password: string;
  enterprise_enabled: boolean;
  chinese_ui_enabled: boolean;
  port: number;
  image_name: string;
}

export interface DataPaths {
  postgresql: string;
  n8n_data: string;
  external: string;
  ffmpeg: string;
  images: string;
  mcp: string;
}

export type PageType = 'env-check' | 'activation' | 'wizard' | 'dashboard' | 'settings' | 'services' | 'version' | 'logs' | 'license' | 'about' | 'marketplace' | 'beautify';

export type LicenseTier = 'professional' | 'enterprise';

export interface ContainerStatus {
  id: string;
  name: string;
  status: string;
  image: string;
  uptime?: string;
}

export interface EnvItem {
  name: string;
  status: boolean;
  version?: string;
  required: boolean;
}

export interface EnvCheckResult {
  items: EnvItem[];
  can_proceed: boolean;
}

export interface LicenseValidationResult {
  valid: boolean;
  license_type?: string;
  expire_time?: string;
  error?: string;
}

export interface DockerPsResult {
  containers: ContainerStatus[];
  success: boolean;
  error?: string;
}

export interface ComposePsResult {
  services: ContainerStatus[];
  success: boolean;
  error?: string;
}

export interface VersionCheckResult {
  current_version: string;
  available_versions: string[];
}

export interface UpdateStep {
  step: number;
  total: number;
  description: string;
  status: 'running' | 'success' | 'pending' | 'error';
  progress: number;
}
