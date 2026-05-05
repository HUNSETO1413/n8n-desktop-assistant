import { invoke } from '@tauri-apps/api/core';

// ── npm types ──

export interface NpmPackage {
  name: string;
  scope?: string;
  version: string;
  description?: string;
  keywords?: string[];
  date?: string;
  links?: {
    npm?: string;
    repository?: string;
    homepage?: string;
    bugs?: string;
  };
  publisher?: {
    username?: string;
    email?: string;
  };
  maintainers?: Array<{
    username?: string;
    email?: string;
  }>;
  license?: string;
}

export interface NpmScoreDetail {
  quality: number;
  popularity: number;
  maintenance: number;
}

export interface NpmSearchObject {
  package: NpmPackage;
  score: {
    final: number;
    detail: NpmScoreDetail;
  };
  searchScore: number;
  downloads?: {
    monthly?: number;
    weekly?: number;
  };
}

export interface NpmSearchResponse {
  objects: NpmSearchObject[];
  total: number;
  time: string;
}

export interface NpmPackageDetail {
  name: string;
  description?: string;
  version?: string;
  license?: string;
  homepage?: string;
  repository?: { url?: string; type?: string };
  keywords?: string[];
  author?: { name?: string; email?: string; url?: string };
  maintainers?: Array<{ username?: string; email?: string }>;
  time?: Record<string, string>;
  versions?: Record<string, unknown>;
  readme?: string;
}

// ── Workflow types (n8nhackers.com API) ──

export interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  categories?: string[];
  author?: string;
  url?: string;
  created_at?: string;
  updated_at?: string;
  views?: number;
  views_recent?: number;
  image?: string;
  price?: number;
  setup_cost?: number;
  maintenance_cost?: number;
  node_count?: number;
  zh_title?: string;
  zh_excerpt?: string;
}

export interface WorkflowSearchResponse {
  items: WorkflowItem[];
  total: number;
}

// ── Filter types ──

export interface FilterOption {
  value: string;
  label: string;
  label_zh?: string;
}

export interface WorkflowFilters {
  time_period?: FilterOption[];
  category?: FilterOption[];
  popularity?: FilterOption[];
  price?: FilterOption[];
  complexity?: FilterOption[];
  business_layer?: FilterOption[];
  business_type?: FilterOption[];
  business_category?: FilterOption[];
  department?: FilterOption[];
  industry?: FilterOption[];
  model?: FilterOption[];
  start_type?: FilterOption[];
  ai?: FilterOption[];
  agent?: FilterOption[];
  mcp?: FilterOption[];
  rag?: FilterOption[];
}

export interface WorkflowFilterParams {
  query?: string;
  page?: number;
  category?: string;
  time_period?: string;
  popularity?: string;
  price?: string;
  complexity?: string;
  business_layer?: string;
  business_type?: string;
  business_category?: string;
  department?: string;
  industry?: string;
  model?: string;
  start_type?: string;
  ai?: string;
  agent?: string;
  mcp?: string;
  rag?: string;
  ai_cost?: string;
  setup_time?: string;
  setup_cost?: string;
  security?: string;
  subworkflow?: string;
  scalable?: string;
  human_in_the_loop?: string;
  maintenance?: string;
  score?: string;
}

// ── API functions ──

const PAGE_SIZE = 20;

export async function searchNpmPackages(
  query: string,
  page: number = 0,
): Promise<NpmSearchResponse> {
  const text = query || 'keywords:n8n-community-node-package';
  return invoke('search_npm_packages', {
    text,
    from: page * PAGE_SIZE,
    size: PAGE_SIZE,
  });
}

export async function getPackageDetail(
  packageName: string,
): Promise<NpmPackageDetail> {
  return invoke('get_npm_package_detail', { packageName });
}

export async function searchWorkflows(
  params: WorkflowFilterParams = {},
): Promise<WorkflowSearchResponse> {
  return invoke('search_n8n_workflows', {
    query: params.query || null,
    page: params.page,
    category: params.category || null,
    timePeriod: params.time_period || null,
    popularity: params.popularity || null,
    price: params.price || null,
    complexity: params.complexity || null,
    businessLayer: params.business_layer || null,
    businessType: params.business_type || null,
    businessCategory: params.business_category || null,
    department: params.department || null,
    industry: params.industry || null,
    model: params.model || null,
    startType: params.start_type || null,
    ai: params.ai || null,
    agent: params.agent || null,
    mcp: params.mcp || null,
    rag: params.rag || null,
    aiCost: params.ai_cost || null,
    setupTime: params.setup_time || null,
    setupCost: params.setup_cost || null,
    security: params.security || null,
    subworkflow: params.subworkflow || null,
    scalable: params.scalable || null,
    humanInTheLoop: params.human_in_the_loop || null,
    maintenance: params.maintenance || null,
    score: params.score || null,
  });
}

export async function getWorkflowFilters(): Promise<WorkflowFilters> {
  return invoke('get_workflow_filters');
}

export interface OperationResult {
  success: boolean;
  message: string;
}

export async function installCommunityPackage(
  packageName: string,
  version?: string,
): Promise<OperationResult> {
  return invoke('install_community_package', {
    packageName,
    version: version || null,
  });
}

export async function importWorkflowTemplate(
  workflowId: string,
): Promise<OperationResult> {
  return invoke('import_workflow_template', { workflowId });
}

export async function translateToChinese(text: string): Promise<string> {
  if (!text.trim()) return '';
  try {
    return await invoke('translate_to_chinese', { text });
  } catch {
    return text;
  }
}

export interface InstalledPackage {
  packageName: string;
  installedVersion: string;
  authorName?: string;
  authorEmail?: string;
  installedNodes?: Array<{ name: string; type: string; latestVersion: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export async function getInstalledPackages(): Promise<InstalledPackage[]> {
  try {
    const result = await invoke('get_installed_packages');
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

export { PAGE_SIZE };
