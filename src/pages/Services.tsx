import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Play, RotateCw, FileText, RefreshCw, Power, Settings2 } from 'lucide-react';
import { useLicenseGuard } from '../components/LicenseGuard';
import type { ContainerStatus, ComposePsResult, PageType, LicenseTier } from '../types';

interface ServicesProps {
  licenseValid: boolean;
  licenseTier: LicenseTier | null;
  onNavigate?: (page: PageType) => void;
}

export default function Services({ licenseValid, licenseTier, onNavigate }: ServicesProps) {
  const [services, setServices] = useState<ContainerStatus[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [workers, setWorkers] = useState(3);
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { guard, guardEnterprise, GuardModal } = useLicenseGuard(licenseValid, licenseTier, onNavigate);

  useEffect(() => {
    loadServices();
    const interval = setInterval(loadServices, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      setError(null);
      const result: ComposePsResult = await invoke('compose_ps', { installPath: 'D:\\n8n-compose' });
      if (result.success) setServices(result.services);
      else setError(result.error || '未知错误');
      setLoading(false);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  const handleStartAll = () => guard(async () => {
    try { await invoke('compose_up', { installPath: 'D:\\n8n-compose' }); setTimeout(() => loadServices(), 1500); }
    catch (err) { alert('启动失败: ' + (err as string)); }
  });
  const handleStopAll = () => guard(async () => {
    try { await invoke('compose_down', { installPath: 'D:\\n8n-compose' }); setTimeout(() => loadServices(), 1500); }
    catch (err) { alert('停止失败: ' + (err as string)); }
  });
  const handleRestart = (_serviceName: string) => guard(async () => {
    try { await invoke('compose_down', { installPath: 'D:\\n8n-compose' }); await invoke('compose_up', { installPath: 'D:\\n8n-compose' }); setTimeout(() => loadServices(), 1500); }
    catch (err) { alert('重启失败: ' + (err as string)); }
  });
  const handleScaleWorkers = () => guard(async () => {
    try { await invoke('compose_up', { installPath: 'D:\\n8n-compose' }); setTimeout(() => loadServices(), 2000); }
    catch (err) { alert('Worker 扩缩失败: ' + (err as string)); }
  });
  const handleViewLogs = (serviceName: string) => guard(async () => {
    try {
      const result = await invoke('compose_logs', { installPath: 'D:\\n8n-compose', service: serviceName, tail: '200' }) as { logs: string };
      setSelectedService(serviceName);
      setLogs(result.logs);
    } catch (err) { alert('加载日志失败: ' + (err as string)); }
  });

  const runningCount = services.filter(s => s.status.toLowerCase().includes('up') || s.status.toLowerCase().includes('running')).length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {GuardModal}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="glass-card">
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>服务管理</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>{runningCount}/{services.length} 个服务运行中</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleStartAll} className="btn btn-success">
                <Play style={{ width: 14, height: 14 }} /> 全部启动
              </button>
              <button onClick={handleStopAll} className="btn btn-danger">
                <Power style={{ width: 14, height: 14 }} /> 全部停止
              </button>
              <button onClick={() => loadServices()} className="btn btn-secondary">
                <RefreshCw style={{ width: 14, height: 14 }} /> 刷新
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>容器列表</div>
          </div>
          <div style={{ padding: 20 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>加载中...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>
                <button onClick={loadServices} className="btn btn-secondary">
                  <RefreshCw style={{ width: 14, height: 14 }} /> 重试
                </button>
              </div>
            ) : services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 12 }}>暂无服务</div>
                <button onClick={handleStartAll} className="btn btn-primary">
                  <Play style={{ width: 14, height: 14 }} /> 启动服务
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {services.map((service) => {
                  const isRunning = service.status.toLowerCase().includes('up') || service.status.toLowerCase().includes('running');
                  return (
                    <div key={service.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
                      borderRadius: 12, transition: 'background 150ms ease',
                    }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                       onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        background: isRunning ? '#34d399' : '#d1d5db',
                        boxShadow: isRunning ? '0 0 8px rgba(52,211,153,0.5)' : 'none',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{service.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.image}</div>
                      </div>
                      <span className={`badge ${isRunning ? 'badge-success' : 'badge-neutral'}`}>
                        {isRunning ? '运行中' : '已停止'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleRestart(service.name)} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} title="重启">
                          <RotateCw style={{ width: 14, height: 14 }} />
                        </button>
                        <button onClick={() => handleViewLogs(service.name)} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} title="日志">
                          <FileText style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings2 style={{ width: 20, height: 20, color: '#7c3aed' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Worker 数量</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>调整 worker 进程数量</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="number" value={workers}
                onChange={(e) => setWorkers(parseInt(e.target.value) || 1)}
                min="1" max="10" className="input" style={{ width: 80, textAlign: 'center' }} />
              <button onClick={() => guardEnterprise(handleScaleWorkers)} className="btn btn-primary">应用</button>
            </div>
          </div>
        </div>

        {logs && (
          <div className="glass-card animate-slide-in">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>最近日志 — {selectedService || 'n8n-main'}</div>
              <button onClick={() => setLogs('')} className="btn btn-ghost" style={{ fontSize: 12 }}>清除</button>
            </div>
            <div style={{
              background: '#0f172a', borderRadius: '0 0 16px 16px', padding: 16,
              maxHeight: 220, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8',
            }}>
              {logs.split('\n').slice(-20).map((line, i) => (
                <div key={i} style={{ lineHeight: 1.7 }}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
