import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ShieldCheck, Cpu, KeyRound, Copy, CheckCircle2 } from 'lucide-react';
import type { LicenseValidationResult } from '../types';
import { useLicense } from '../contexts/LicenseContext';

export default function LicensePage() {
  const [license, setLicense] = useState<LicenseValidationResult | null>(null);
  const [machineId, setMachineId] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { refreshLicense } = useLicense();

  useEffect(() => { loadLicense(); }, []);

  const loadLicense = async () => {
    try {
      const id = await invoke('get_machine_id') as string;
      setMachineId(id);
      const result = await invoke('validate_license', { machineId: id }) as LicenseValidationResult;
      setLicense(result);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMachineId = async () => {
    try {
      await navigator.clipboard.writeText(machineId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
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
      await loadLicense();
      await refreshLicense();
      setActivationCode('');
    } catch (err) {
      setError(err as string);
    } finally {
      setActivating(false);
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
    <div style={{ padding: '28px 32px', maxWidth: 800, margin: '0 auto' }}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Status Card */}
        <div className="glass-card" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: license?.valid ? '#d1fae5' : '#fee2e2',
            }}>
              {license?.valid ? (
                <ShieldCheck style={{ width: 28, height: 28, color: '#059669' }} />
              ) : (
                <Cpu style={{ width: 28, height: 28, color: '#dc2626' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>授权状态</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: license?.valid ? '#059669' : '#dc2626',
                }}>
                  {license?.valid ? '已激活' : '未激活'}
                </span>
                {license?.valid && <span className="badge badge-success">有效</span>}
              </div>
            </div>
          </div>

          {license?.valid && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
              {license.license_type && (
                <div style={{ padding: '16px 20px', borderRadius: 12, background: '#f8fafc' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>授权类型</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{license.license_type}</div>
                </div>
              )}
              {license.expire_time && (
                <div style={{ padding: '16px 20px', borderRadius: 12, background: '#f8fafc' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>签发时间</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{license.expire_time}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Machine ID Card */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>机器码</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>将此机器码发送给管理员获取激活码</div>
          </div>
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

        {/* Activation Card */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <KeyRound style={{ width: 16, height: 16, color: '#6b7280' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>激活许可证</span>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>输入管理员提供的激活码</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={activationCode}
              onChange={(e) => { setActivationCode(e.target.value); setError(null); }}
              placeholder="粘贴激活码..."
              className="input"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
            />
            <button
              onClick={handleActivate}
              disabled={activating}
              className="btn btn-primary"
            >
              {activating ? '激活中...' : '激活'}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12,
              color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
