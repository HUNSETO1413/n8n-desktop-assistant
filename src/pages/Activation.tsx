import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Copy, KeyRound, CheckCircle2 } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';

interface ActivationProps {
  onComplete: () => void;
}

export default function Activation({ onComplete }: ActivationProps) {
  const { refreshLicense } = useLicense();
  const [machineId, setMachineId] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMachineId = async () => {
      try {
        const id = await invoke('get_machine_id') as string;
        setMachineId(id);
      } catch (err) {
        console.error('Failed to get machine ID:', err);
      }
    };
    fetchMachineId();
  }, []);

  const handleCopyMachineId = async () => {
    try {
      await navigator.clipboard.writeText(machineId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      setError('请输入激活码');
      return;
    }
    try {
      setActivating(true);
      setError(null);
      await invoke('activate_license', { machineId, activationCode });
      await refreshLicense();
      onComplete();
    } catch (err) {
      setError(err as string);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-slide-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
          }}>
            <KeyRound style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>激活许可证</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>请输入激活码以继续使用</div>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Machine ID */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em' }}>
                本机机器码
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={machineId}
                  readOnly
                  className="input"
                  style={{ flex: 1, background: '#f9fafb', fontFamily: 'monospace', fontSize: 12 }}
                />
                <button
                  onClick={handleCopyMachineId}
                  className={`btn btn-sm btn-icon ${copied ? 'btn-success' : 'btn-secondary'}`}
                  title="复制"
                >
                  {copied ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>激活码</span>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            </div>

            {/* Activation Code */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em' }}>
                输入激活码
              </label>
              <input
                type="text"
                value={activationCode}
                onChange={(e) => { setActivationCode(e.target.value); setError(null); }}
                placeholder="粘贴您的激活码..."
                className="input"
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 12, color: '#dc2626',
                background: '#fef2f2', border: '1px solid #fecaca',
              }}>
                {error}
              </div>
            )}

            {/* Activate Button */}
            <button
              onClick={handleActivate}
              disabled={activating}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              {activating ? '激活中...' : '激活'}
            </button>

            <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              请将机器码发送给管理员获取激活码
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
