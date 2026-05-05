import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Download, CheckCircle2, RefreshCw, ArrowUpCircle, Upload, X, Loader2 } from 'lucide-react';
import { useLicenseGuard } from '../components/LicenseGuard';
import type { VersionCheckResult, PageType, LicenseTier } from '../types';

interface AppConfig {
  install_path: string;
  n8n_version: string;
}

interface VersionManagerProps {
  licenseValid: boolean;
  licenseTier: LicenseTier | null;
  onNavigate?: (page: PageType) => void;
}

type StepStatus = 'pending' | 'running' | 'success';

const PULL_SOURCES = [
  { id: 'dockerhub', label: 'Docker Hub', image: 'hunseto001/n8n-jianying' },
  { id: 'ghcr', label: 'GitHub (ghcr.io)', image: 'ghcr.io/hunseto1413/n8n-jianying' },
];

const PUSH_TARGETS = [
  { id: 'dockerhub', label: 'Docker Hub', prefix: '', registry: '' },
  { id: 'ghcr', label: 'GitHub (ghcr.io)', prefix: 'ghcr.io/', registry: 'ghcr.io' },
];

export default function VersionManager({ licenseValid, licenseTier, onNavigate }: VersionManagerProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentVersion, setCurrentVersion] = useState('--');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [pullSource, setPullSource] = useState('dockerhub');
  const [loading, setLoading] = useState(true);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{
    steps: { description: string; status: StepStatus }[];
  }>({
    steps: [
      { description: '拉取镜像', status: 'pending' },
      { description: '标记本地镜像', status: 'pending' },
      { description: '停止服务', status: 'pending' },
      { description: '启动新服务', status: 'pending' },
    ],
  });

  // Push dialog
  const [pushDialog, setPushDialog] = useState(false);
  const [pushSource, setPushSource] = useState('n8n-jianying:latest');
  const [pushTarget, setPushTarget] = useState('ghcr');
  const [pushTag, setPushTag] = useState('');
  const [pushUsername, setPushUsername] = useState('');
  const [pushPassword, setPushPassword] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [pushError, setPushError] = useState<string | null>(null);

  const { guard, GuardModal } = useLicenseGuard(licenseValid, licenseTier, onNavigate);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const cfg = await invoke<AppConfig>('load_config');
      setConfig(cfg);
      setCurrentVersion(cfg.n8n_version || '--');
    } catch { /* ignore */ }
    setLoading(false);
  };

  const installPath = config?.install_path || 'D:\\n8n-compose';

  const checkUpdates = async () => {
    try {
      setCheckingUpdates(true);
      const result: VersionCheckResult = await invoke('check_updates', { currentVersion });
      setAvailableVersions(result.available_versions);
    } catch (err) {
      console.error('Failed to check updates:', err);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const setStep = (index: number, status: StepStatus) => {
    setUpdateProgress(prev => ({
      steps: prev.steps.map((s, i) => i === index ? { ...s, status } : s),
    }));
  };

  const handleInstall = async (version: string) => {
    try {
      setUpdating(true);
      setUpdateProgress(prev => ({ steps: prev.steps.map(s => ({ ...s, status: 'pending' as StepStatus })) }));

      const source = PULL_SOURCES.find(s => s.id === pullSource)!;
      const fullImage = `${source.image}:${version}`;

      // Step 1: Pull
      setStep(0, 'running');
      await invoke('docker_pull', { image: fullImage });
      setStep(0, 'success');

      // Step 2: Tag as local
      setStep(1, 'running');
      await invoke('tag_image', { source: fullImage, target: 'n8n-jianying:latest' });
      setStep(1, 'success');

      // Step 3: Stop
      setStep(2, 'running');
      await invoke('compose_down', { installPath });
      setStep(2, 'success');

      // Step 4: Start
      setStep(3, 'running');
      await invoke('compose_up', { installPath });
      setStep(3, 'success');

      setCurrentVersion(version);
      setTimeout(() => { setUpdating(false); }, 800);
    } catch (err) {
      alert('安装失败: ' + (err as string));
      setUpdating(false);
    }
  };

  const openPushDialog = () => {
    const t = PUSH_TARGETS.find(t => t.id === pushTarget)!;
    setPushTag(`${t.prefix}hunseto001/n8n-jianying:latest`);
    setPushError(null);
    setPushStatus('');
    setPushDialog(true);
  };

  const handlePush = async () => {
    if (!pushSource || !pushTag || !pushUsername || !pushPassword) {
      setPushError('请填写所有字段');
      return;
    }
    try {
      setPushing(true);
      setPushError(null);

      const target = PUSH_TARGETS.find(t => t.id === pushTarget)!;

      setPushStatus('登录仓库...');
      await invoke('docker_login', { registry: target.registry, username: pushUsername, password: pushPassword });

      if (pushTag !== pushSource) {
        setPushStatus('标记镜像...');
        await invoke('tag_image', { source: pushSource, target: pushTag });
      }

      setPushStatus('推送中...');
      await invoke('push_image', { image: pushTag });

      setPushStatus('推送成功！');
      setTimeout(() => { setPushDialog(false); setPushing(false); }, 1000);
    } catch (err) {
      setPushError(err as string);
      setPushing(false);
      setPushStatus('');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      {GuardModal}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Current Version */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>当前版本</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>v{currentVersion}</span>
                <span className="badge badge-info">n8n-jianying</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => guard(checkUpdates)} disabled={checkingUpdates} className="btn btn-secondary">
                <RefreshCw style={{ width: 14, height: 14, animation: checkingUpdates ? 'spin 1s linear infinite' : 'none' }} />
                {checkingUpdates ? '检查中...' : '检查更新'}
              </button>
              <button onClick={openPushDialog} className="btn btn-primary">
                <Upload style={{ width: 14, height: 14 }} /> 推送镜像
              </button>
            </div>
          </div>
        </div>

        {/* Pull source selector */}
        {availableVersions.length > 0 && (
          <div className="glass-card" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>拉取源：</span>
              {PULL_SOURCES.map(src => (
                <button key={src.id} onClick={() => setPullSource(src.id)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${pullSource === src.id ? '#3b82f6' : '#e5e7eb'}`,
                  background: pullSource === src.id ? '#eff6ff' : '#fff',
                  color: pullSource === src.id ? '#1d4ed8' : '#6b7280',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {src.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Versions */}
        <div className="glass-card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>可用版本</div>
          </div>
          <div style={{ padding: 16 }}>
            {availableVersions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
                {checkingUpdates ? '正在获取版本列表...' : '点击"检查更新"获取可用版本'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {availableVersions.slice(0, 10).map((version) => {
                  const isCurrent = version === currentVersion;
                  return (
                    <div key={version} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 12,
                      background: isCurrent ? '#eff6ff' : 'transparent',
                      transition: 'background 150ms ease',
                    }} onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = '#f8fafc'; }}
                       onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isCurrent ? (
                          <CheckCircle2 style={{ width: 20, height: 20, color: '#3b82f6' }} />
                        ) : (
                          <ArrowUpCircle style={{ width: 20, height: 20, color: '#cbd5e1' }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: isCurrent ? '#1d4ed8' : '#374151' }}>
                            v{version}
                          </span>
                          {isCurrent && <span className="badge badge-info">当前</span>}
                        </div>
                      </div>
                      {!isCurrent && (
                        <button onClick={() => guard(() => handleInstall(version))} disabled={updating} className="btn btn-primary">
                          <Download style={{ width: 14, height: 14 }} /> 安装
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Update Progress */}
        {updating && (
          <div className="glass-card animate-slide-in">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>安装进行中</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {updateProgress.steps.map((step, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600,
                    background: step.status === 'success' ? '#d1fae5' : step.status === 'running' ? '#dbeafe' : '#f1f5f9',
                    color: step.status === 'success' ? '#059669' : step.status === 'running' ? '#2563eb' : '#94a3b8',
                  }}>
                    {step.status === 'success' ? '✓' : step.status === 'running' ? '...' : index + 1}
                  </div>
                  <span style={{
                    fontSize: 13,
                    color: step.status === 'success' ? '#9ca3af' : step.status === 'running' ? '#111827' : '#9ca3af',
                    fontWeight: step.status === 'running' ? 600 : 400,
                    textDecoration: step.status === 'success' ? 'line-through' : 'none',
                  }}>
                    {step.description}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 24px 20px' }}>
              <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6, transition: 'width 500ms ease',
                  background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  width: `${(updateProgress.steps.filter(s => s.status === 'success').length / updateProgress.steps.length) * 100}%`,
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Push Dialog */}
      {pushDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 28,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            width: 520, maxWidth: '90vw',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload style={{ width: 20, height: 20, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>推送镜像</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>将本地构建的镜像推送到远程仓库</div>
                </div>
              </div>
              <button onClick={() => { if (!pushing) setPushDialog(false); }} style={{
                border: 'none', background: '#f3f4f6', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <X style={{ width: 16, height: 16, color: '#6b7280' }} />
              </button>
            </div>

            {/* Source image */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                本地镜像
              </label>
              <input value={pushSource} onChange={(e) => setPushSource(e.target.value)}
                placeholder="n8n-jianying:2.18.5"
                className="input" style={{ fontSize: 13, fontFamily: 'monospace' }} disabled={pushing} />
            </div>

            {/* Target registry */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>目标仓库</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {PUSH_TARGETS.map(t => (
                  <button key={t.id} onClick={() => {
                    setPushTarget(t.id);
                    setPushTag(`${t.prefix}hunseto001/n8n-jianying:${pushSource.split(':').pop() || 'latest'}`);
                  }} style={{
                    flex: 1, padding: '12px 16px', borderRadius: 12,
                    border: `2px solid ${pushTarget === t.id ? '#3b82f6' : '#e5e7eb'}`,
                    background: pushTarget === t.id ? '#eff6ff' : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: pushTarget === t.id ? '#1d4ed8' : '#374151' }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {t.id === 'dockerhub' ? 'docker.io' : 'ghcr.io'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target tag */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                目标标签
              </label>
              <input value={pushTag} onChange={(e) => setPushTag(e.target.value)}
                placeholder={pushTarget === 'dockerhub' ? 'hunseto001/n8n-jianying:2.18.5' : 'ghcr.io/hunseto1413/n8n-jianying:2.18.5'}
                className="input" style={{ fontSize: 13, fontFamily: 'monospace' }} disabled={pushing} />
            </div>

            {/* Credentials */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  {pushTarget === 'ghcr' ? 'GitHub 用户名' : 'Docker Hub 用户名'}
                </label>
                <input value={pushUsername} onChange={(e) => setPushUsername(e.target.value)}
                  placeholder={pushTarget === 'ghcr' ? 'GitHub username' : 'Docker Hub username'}
                  className="input" style={{ fontSize: 13 }} disabled={pushing} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  {pushTarget === 'ghcr' ? 'Personal Access Token' : '密码 / Access Token'}
                </label>
                <input value={pushPassword} onChange={(e) => setPushPassword(e.target.value)}
                  type="password" placeholder={pushTarget === 'ghcr' ? 'ghp_xxxx...' : '密码或Token'}
                  className="input" style={{ fontSize: 13 }} disabled={pushing} />
              </div>
            </div>

            {/* Status */}
            {pushStatus && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 12,
                background: pushError ? '#fef2f2' : '#eff6ff',
                color: pushError ? '#dc2626' : '#2563eb',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {pushing && !pushError && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
                {pushStatus}
              </div>
            )}
            {pushError && !pushStatus && (
              <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 12, background: '#fef2f2', color: '#dc2626' }}>
                {pushError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { if (!pushing) setPushDialog(false); }} className="btn btn-secondary" disabled={pushing}>
                取消
              </button>
              <button onClick={handlePush} className="btn btn-primary" disabled={pushing || !pushSource || !pushTag || !pushUsername || !pushPassword}>
                {pushing ? (
                  <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> 推送中...</>
                ) : (
                  <><Upload style={{ width: 14, height: 14 }} /> 推送到 {PUSH_TARGETS.find(t => t.id === pushTarget)?.label}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
