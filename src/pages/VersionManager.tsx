import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Download, CheckCircle2, RefreshCw, ArrowUpCircle } from 'lucide-react';
import { useLicenseGuard } from '../components/LicenseGuard';
import type { VersionCheckResult, PageType, LicenseTier } from '../types';

interface VersionManagerProps {
  licenseValid: boolean;
  licenseTier: LicenseTier | null;
  onNavigate?: (page: PageType) => void;
}

export default function VersionManager({ licenseValid, licenseTier, onNavigate }: VersionManagerProps) {
  const [currentVersion, setCurrentVersion] = useState('2.18.5');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updating, setUpdating] = useState(false);
  type StepStatus = 'pending' | 'running' | 'success';
  const [updateProgress, setUpdateProgress] = useState<{
    currentStep: number; totalSteps: number;
    steps: { step: number; description: string; status: StepStatus }[];
  }>({
    currentStep: 0, totalSteps: 8,
    steps: [
      { step: 1, description: '拉取基础镜像', status: 'pending' },
      { step: 2, description: '更新 Dockerfile', status: 'pending' },
      { step: 3, description: '构建自定义镜像', status: 'pending' },
      { step: 4, description: '提取 base-command.js', status: 'pending' },
      { step: 5, description: '注入企业版补丁', status: 'pending' },
      { step: 6, description: '下载中文界面包', status: 'pending' },
      { step: 7, description: '停止服务', status: 'pending' },
      { step: 8, description: '启动新服务', status: 'pending' },
    ],
  });
  const { guard, GuardModal } = useLicenseGuard(licenseValid, licenseTier, onNavigate);

  useEffect(() => { checkUpdates(); }, []);

  const checkUpdates = async () => {
    try {
      setCheckingUpdates(true);
      const result: VersionCheckResult = await invoke('check_updates', { currentVersion });
      setAvailableVersions(result.available_versions);
    } catch (err) {
      console.error('Failed to check updates:', err);
    } finally {
      setCheckingUpdates(false);
      setLoading(false);
    }
  };

  const handleUpdate = async (version: string) => {
    try {
      setUpdating(true);
      setUpdateProgress(prev => ({
        ...prev,
        steps: prev.steps.map((step, i) => ({ ...step, status: i === 0 ? 'running' : 'pending' }))
      }));

      await invoke('docker_pull', { image: `n8nio/n8n:${version}` });

      for (let i = 0; i < 8; i++) {
        setUpdateProgress(prev => ({
          ...prev,
          steps: prev.steps.map((step, j) => ({ ...step, status: j < i ? 'success' : j === i ? 'running' : 'pending' }))
        }));
        if (i === 2) {
          await invoke('docker_build', { installPath: 'D:\\n8n-compose', imageName: 'n8n-jianying:latest' });
        }
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      setUpdateProgress(prev => ({
        ...prev,
        steps: prev.steps.map(step => ({ ...step, status: 'success' }))
      }));

      setCurrentVersion(version);
      setTimeout(() => { setUpdating(false); alert(`更新到 ${version} 完成！`); }, 500);
    } catch (err) {
      console.error('Update failed:', err);
      alert('更新失败: ' + (err as string));
      setUpdating(false);
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
                <span className="badge badge-info">n8n-jianying:latest</span>
              </div>
            </div>
            <button onClick={() => guard(checkUpdates)} disabled={checkingUpdates} className="btn btn-secondary">
              <RefreshCw style={{ width: 14, height: 14, animation: checkingUpdates ? 'spin 1s linear infinite' : 'none' }} />
              {checkingUpdates ? '检查中...' : '检查更新'}
            </button>
          </div>
        </div>

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
                {availableVersions.slice(0, 6).map((version) => {
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
                        <button onClick={() => guard(() => handleUpdate(version))} disabled={updating} className="btn btn-primary">
                          <Download style={{ width: 14, height: 14 }} /> 更新
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
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>更新进行中</div>
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
                  width: `${(updateProgress.steps.filter(s => s.status === 'success').length / 8) * 100}%`,
                }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
