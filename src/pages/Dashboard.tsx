import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Play, Square, ExternalLink, RefreshCw, RotateCw, FileText, PowerOff, ShieldCheck, Globe, Cpu } from 'lucide-react';
import { useLicenseGuard } from '../components/LicenseGuard';
import type { ContainerStatus, DockerPsResult, PageType, LicenseTier } from '../types';

interface DashboardProps {
  licenseValid: boolean;
  licenseTier: LicenseTier | null;
  onNavigate?: (page: PageType) => void;
}

export default function Dashboard({ licenseValid, licenseTier, onNavigate }: DashboardProps) {
  const [containers, setContainers] = useState<ContainerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [n8nVersion] = useState('2.18.5');
  const [enterpriseEnabled] = useState(true);
  const [chineseUIEnabled] = useState(true);
  const [workersCount] = useState(3);
  const { guard, GuardModal } = useLicenseGuard(licenseValid, licenseTier, onNavigate);

  useEffect(() => {
    loadContainerStatus();
    const interval = setInterval(loadContainerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadContainerStatus = async () => {
    try {
      const result: DockerPsResult = await invoke('docker_ps');
      if (result.success) setContainers(result.containers);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleStartAll = () => guard(async () => {
    try { await invoke('compose_up', { installPath: 'D:\\n8n-compose' }); setTimeout(() => loadContainerStatus(), 2000); }
    catch (err) { alert('启动失败: ' + (err as string)); }
  });
  const handleStopAll = () => guard(async () => {
    try { await invoke('compose_down', { installPath: 'D:\\n8n-compose' }); setTimeout(() => loadContainerStatus(), 2000); }
    catch (err) { alert('停止失败: ' + (err as string)); }
  });
  const handleOpenN8n = () => guard(() => window.open('http://localhost:5678', '_blank'));
  const handleRestart = (_name: string) => guard(async () => {
    try { await invoke('compose_down', { installPath: 'D:\\n8n-compose' }); await invoke('compose_up', { installPath: 'D:\\n8n-compose' }); setTimeout(() => loadContainerStatus(), 2000); }
    catch (err) { console.error(err); }
  });

  const runningCount = containers.filter(c => c.status.toLowerCase().includes('up') || c.status.toLowerCase().includes('running')).length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {GuardModal}
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: Cpu, label: '版本', value: `v${n8nVersion}`, color: 'blue' },
          { icon: ShieldCheck, label: '企业版', value: enterpriseEnabled ? '已启用' : '未启用', color: 'green' },
          { icon: Globe, label: '中文界面', value: chineseUIEnabled ? '已启用' : '未启用', color: 'violet' },
          { icon: RefreshCw, label: 'Workers', value: `${workersCount} 个`, color: 'amber' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: color === 'blue' ? '#eff6ff' : color === 'green' ? '#ecfdf5' : color === 'violet' ? '#f5f3ff' : '#fffbeb',
              }}>
                <Icon style={{ width: 22, height: 22, color: color === 'blue' ? '#3b82f6' : color === 'green' ? '#059669' : color === 'violet' ? '#7c3aed' : '#d97706' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Container Status */}
      <div className="glass-card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>容器状态</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>运行中 {runningCount}/{containers.length} 个容器</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleStartAll} className="btn btn-success">
              <Play style={{ width: 14, height: 14 }} /> 全部启动
            </button>
            <button onClick={handleStopAll} className="btn btn-danger">
              <PowerOff style={{ width: 14, height: 14 }} /> 全部停止
            </button>
            <button onClick={handleOpenN8n} className="btn btn-primary">
              <ExternalLink style={{ width: 14, height: 14 }} /> 打开 n8n
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>加载中...</div>
          ) : containers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Square style={{ width: 48, height: 48, margin: '0 auto 12px', color: '#e5e7eb' }} />
              <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>暂无运行中的容器</div>
              <button onClick={handleStartAll} className="btn btn-primary">
                <Play style={{ width: 14, height: 14 }} /> 启动服务
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {containers.map((c) => {
                const isRunning = c.status.toLowerCase().includes('up') || c.status.toLowerCase().includes('running');
                return (
                  <div key={c.id} className="glass-card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isRunning ? '#34d399' : '#d1d5db' }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.image}</div>
                    <span className={`badge ${isRunning ? 'badge-success' : 'badge-neutral'}`}>
                      {isRunning ? '运行中' : '已停止'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', marginTop: 14 }}>
                      <button onClick={() => handleRestart(c.name)} className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}>
                        <RotateCw style={{ width: 12, height: 12 }} /> 重启
                      </button>
                      <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}>
                        <FileText style={{ width: 12, height: 12 }} /> 日志
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
