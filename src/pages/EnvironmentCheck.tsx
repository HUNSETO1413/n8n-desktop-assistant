import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { CheckCircle2, XCircle, Download, ArrowRight } from 'lucide-react';
import type { EnvCheckResult, EnvItem } from '../types';

interface EnvironmentCheckProps {
  onComplete: () => void;
}

export default function EnvironmentCheck({ onComplete }: EnvironmentCheckProps) {
  const [checking, setChecking] = useState(true);
  const [envResult, setEnvResult] = useState<EnvCheckResult | null>(null);

  useEffect(() => { checkEnvironment(); }, []);

  const checkEnvironment = async () => {
    try {
      const result: EnvCheckResult = await invoke('check_env');
      setEnvResult(result);
    } catch { /* ignore */ }
    finally { setChecking(false); }
  };

  const handleInstall = (item: EnvItem) => {
    if (item.name === 'Docker Desktop') open('https://www.docker.com/products/docker-desktop/');
    else if (item.name === 'Node.js') open('https://nodejs.org/');
    else if (item.name === 'Git') open('https://git-scm.com/downloads');
  };

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
      <div style={{ width: '100%', maxWidth: 480 }} className="animate-slide-in">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>环境检查</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>检测您的系统是否满足运行要求</div>
        </div>

        {/* Results */}
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
              {!item.status && item.required && (
                <button onClick={() => handleInstall(item)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                  <Download style={{ width: 14, height: 14 }} /> 安装
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Warning */}
        {envResult && !envResult.can_proceed && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 14,
            background: '#fffbeb', border: '1px solid #fef3c7',
            fontSize: 13, color: '#92400e', lineHeight: 1.6,
          }}>
            请安装缺失的环境后继续。Docker Desktop 约 800MB，安装后需重启。
          </div>
        )}

        {/* Continue */}
        {envResult?.can_proceed && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button onClick={onComplete} className="btn btn-primary btn-lg">
              继续 <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
