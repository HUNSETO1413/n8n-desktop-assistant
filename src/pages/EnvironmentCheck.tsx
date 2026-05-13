import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import { CheckCircle2, XCircle, Download, ArrowRight, RotateCw, Zap, AlertTriangle } from 'lucide-react';
import type { EnvCheckResult, EnvItem } from '../types';

interface InstallProgress {
  package_name: string;
  winget_id: string;
  status: string;
  message: string;
}

interface EnvironmentCheckProps {
  onComplete: () => void;
}

export default function EnvironmentCheck({ onComplete }: EnvironmentCheckProps) {
  const [checking, setChecking] = useState(true);
  const [envResult, setEnvResult] = useState<EnvCheckResult | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installLog, setInstallLog] = useState<InstallProgress[]>([]);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => { checkEnvironment(); }, []);

  useEffect(() => {
    const unlisten = listen<InstallProgress>('install-progress', (event) => {
      setInstallLog(prev => {
        const exists = prev.findIndex(p => p.winget_id === event.payload.winget_id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = event.payload;
          return updated;
        }
        return [...prev, event.payload];
      });
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const checkEnvironment = async () => {
    setChecking(true);
    try {
      const result: EnvCheckResult = await invoke('check_env');
      setEnvResult(result);
    } catch { /* ignore */ }
    finally { setChecking(false); }
  };

  const handleInstall = (item: EnvItem) => {
    if (item.name === 'Docker Desktop' || item.name.startsWith('Docker Desktop'))
      open('https://www.docker.com/products/docker-desktop/');
    else if (item.name === 'Node.js') open('https://nodejs.org/');
    else if (item.name === 'Git') open('https://git-scm.com/downloads');
  };

  const handleOneClickInstall = async () => {
    setInstalling(true);
    setInstallLog([]);
    setInstallError(null);
    try {
      await invoke('install_dependencies');
      await checkEnvironment();
    } catch (err) {
      setInstallError(err as string);
    } finally {
      setInstalling(false);
    }
  };

  const missingItems = envResult?.items.filter(item => item.required && !item.status) ?? [];
  const dockerNotRunning = missingItems.some(item => item.name.includes('未启动'));
  const hasInstallProgress = installLog.length > 0;

  if (checking) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div style={{ textAlign: 'center' }} className="animate-fade-in">
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px',
            border: '4px solid #3b82f6', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>正在检测系统环境</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>请稍候...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
      <div style={{ width: '100%', maxWidth: 520 }} className="animate-slide-in">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>环境检查</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>检测您的系统是否满足运行要求</div>
        </div>

        {/* One-click install banner */}
        {missingItems.length > 0 && envResult?.winget_available && !installing && !hasInstallProgress && (
          <div style={{
            marginBottom: 16, padding: '16px 20px', borderRadius: 16,
            background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
            border: '1px solid #bfdbfe',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Zap style={{ width: 20, height: 20, color: '#3b82f6' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>检测到 {missingItems.length} 个缺失环境</span>
            </div>
            <div style={{ fontSize: 13, color: '#3b82f6', marginBottom: 12, lineHeight: 1.5 }}>
              支持通过 winget 自动安装以下组件：{missingItems.map(i => i.name).join('、')}
              {missingItems.some(i => i.name === 'npm') && '（npm 随 Node.js 一起安装）'}
            </div>
            <button onClick={handleOneClickInstall} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Zap style={{ width: 16, height: 16 }} /> 一键安装缺失环境
            </button>
          </div>
        )}

        {/* winget not available but has missing items */}
        {missingItems.length > 0 && !envResult?.winget_available && (
          <div style={{
            marginBottom: 16, padding: '14px 18px', borderRadius: 14,
            background: '#fffbeb', border: '1px solid #fef3c7',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#92400e' }}>
              未检测到 winget，请点击各组件旁的"安装"按钮手动下载安装
            </span>
          </div>
        )}

        {/* Install progress */}
        {hasInstallProgress && (
          <div style={{
            marginBottom: 16, borderRadius: 16,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#475569' }}>
              安装进度
            </div>
            {installLog.map((log) => (
              <div key={log.winget_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 18px',
                background: log.status === 'error' ? '#fef2f2' : log.status === 'success' ? '#f0fdf4' : '#f8fafc',
              }}>
                {log.status === 'installing' && (
                  <div style={{
                    width: 20, height: 20, flexShrink: 0,
                    border: '3px solid #3b82f6', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 1s linear infinite',
                  }} />
                )}
                {log.status === 'success' && <CheckCircle2 style={{ width: 20, height: 20, color: '#059669', flexShrink: 0 }} />}
                {log.status === 'error' && <XCircle style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{log.package_name}</div>
                  <div style={{ fontSize: 12, color: log.status === 'error' ? '#dc2626' : '#6b7280' }}>{log.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Install error */}
        {installError && (
          <div style={{
            marginBottom: 16, padding: '14px 18px', borderRadius: 14,
            background: '#fef2f2', border: '1px solid #fecaca',
            fontSize: 13, color: '#991b1b', lineHeight: 1.6,
          }}>
            {installError}
          </div>
        )}

        {/* Environment items */}
        <div className="glass-card" style={{ padding: 10 }}>
          {envResult?.items.map((item, index) => (
            <div key={index} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 12,
              background: !item.status ? '#fef2f2' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {item.status ? (
                  <CheckCircle2 style={{ width: 20, height: 20, color: '#059669', flexShrink: 0 }} />
                ) : (
                  <XCircle style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{item.name}</div>
                  {item.version && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.version}</div>
                  )}
                </div>
              </div>
              {!item.status && item.required && !envResult?.winget_available && (
                <button onClick={() => handleInstall(item)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                  <Download style={{ width: 14, height: 14 }} /> 安装
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Docker restart warning */}
        {envResult && !envResult.can_proceed && dockerNotRunning && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 14,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            fontSize: 13, color: '#1e40af', lineHeight: 1.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <AlertTriangle style={{ width: 16, height: 16, color: '#3b82f6', flexShrink: 0 }} />
              <strong>Docker Desktop 已安装但未运行</strong>
            </div>
            请启动 Docker Desktop 后点击"重新检测"。如果 Docker Desktop 没有在后台运行，所有容器操作将无法执行。
          </div>
        )}
        {envResult && !envResult.can_proceed && !dockerNotRunning && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 14,
            background: '#fffbeb', border: '1px solid #fef3c7',
            fontSize: 13, color: '#92400e', lineHeight: 1.6,
          }}>
            请安装缺失的环境后点击"重新检测"。Docker Desktop 安装后可能需要重启电脑。
          </div>
        )}

        {/* Action buttons */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!envResult?.can_proceed && (
            <button onClick={checkEnvironment} className="btn btn-secondary" disabled={checking || installing}>
              <RotateCw style={{ width: 16, height: 16 }} /> 重新检测
            </button>
          )}
          {envResult?.can_proceed && (
            <button onClick={onComplete} className="btn btn-primary btn-lg">
              继续 <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
