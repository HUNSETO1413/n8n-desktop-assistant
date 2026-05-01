import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Folder, Shield, Cpu, Save, FolderOpen, Lock, Globe } from 'lucide-react';
import { useLicenseGuard } from '../components/LicenseGuard';
import { useLicense } from '../contexts/LicenseContext';
import type { AppConfig, LicenseValidationResult } from '../types';

type TabId = 'paths' | 'security' | 'features' | 'authorization';

const tabs: { id: TabId; label: string; icon: typeof Folder }[] = [
  { id: 'paths', label: '路径配置', icon: FolderOpen },
  { id: 'security', label: '安全配置', icon: Lock },
  { id: 'features', label: '功能配置', icon: Globe },
  { id: 'authorization', label: '授权信息', icon: Shield },
];

export default function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [license, setLicense] = useState<LicenseValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('paths');
  const [saving, setSaving] = useState(false);
  const { licenseValid, licenseTier } = useLicense();
  const { guard, guardEnterprise, GuardModal } = useLicenseGuard(licenseValid, licenseTier);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const loadedConfig = await invoke('load_config') as AppConfig;
      setConfig(loadedConfig);
      try {
        const machineId = await invoke('get_machine_id') as string;
        const licenseResult = await invoke('validate_license', { machineId }) as LicenseValidationResult;
        setLicense(licenseResult);
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      setSaving(true);
      await invoke('save_config', { config });
      alert('配置已保存');
    } catch (err) {
      alert('保存失败: ' + (err as string));
    } finally {
      setSaving(false);
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let key = '';
    for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    if (config) setConfig({ ...config, encryption_key: key });
  };

  if (!config) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      {GuardModal}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 6, padding: 6,
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)',
          borderRadius: 14, border: '1px solid rgba(0,0,0,0.05)',
        }}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'all 150ms ease',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#111827' : '#6b7280',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <TabIcon style={{ width: 16, height: 16 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="glass-card" style={{ padding: 28 }}>
          {activeTab === 'paths' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>路径配置</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>配置安装和数据存储目录</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>工作目录</label>
                <input type="text" value={config.install_path}
                  onChange={(e) => setConfig({ ...config, install_path: e.target.value })}
                  className="input" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {([
                  ['postgresql', 'PostgreSQL 数据'],
                  ['n8n_data', 'n8n 主数据'],
                  ['external', '外部文件'],
                  ['ffmpeg', 'FFmpeg'],
                  ['images', '图片资源'],
                  ['mcp', 'MCP 配置'],
                ] as [keyof AppConfig['data_paths'], string][]).map(([key, label]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{label}</label>
                    <input type="text" value={config.data_paths[key]}
                      onChange={(e) => setConfig({ ...config, data_paths: { ...config.data_paths, [key]: e.target.value } })}
                      className="input" style={{ width: '100%', fontSize: 13 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>安全配置</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>加密密钥和数据库密码</div>
              </div>

              <div style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 12, lineHeight: 1.6,
                color: '#92400e', background: '#fffbeb', border: '1px solid #fef3c7',
              }}>
                如果您已有 n8n 数据，请使用原有加密密钥，否则已保存的凭证将无法解密。
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                  加密密钥 (N8N_ENCRYPTION_KEY)
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="text" value={config.encryption_key}
                    onChange={(e) => setConfig({ ...config, encryption_key: e.target.value })}
                    className="input" style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }} />
                  <button onClick={generateRandomKey} className="btn btn-secondary">随机生成</button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>数据库密码</label>
                <input type="text" value={config.db_password}
                  onChange={(e) => setConfig({ ...config, db_password: e.target.value })}
                  className="input" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>功能配置</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>启用或禁用各项功能</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {([
                  { key: 'enterprise_enabled' as const, label: '企业版功能', desc: '自动注入企业版授权', icon: Shield },
                  { key: 'chinese_ui_enabled' as const, label: '中文界面', desc: '自动下载汉化包', icon: Globe },
                ]).map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: 14, background: '#f8fafc',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        <Icon style={{ width: 16, height: 16, color: '#6b7280' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{label}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{desc}</div>
                      </div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={config[key] as boolean}
                        onChange={(e) => {
                          if (key === 'enterprise_enabled') { guardEnterprise(() => setConfig({ ...config, [key]: e.target.checked })); return; }
                          setConfig({ ...config, [key]: e.target.checked });
                        }} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Workers</label>
                  <input type="number" value={config.workers}
                    onChange={(e) => setConfig({ ...config, workers: parseInt(e.target.value) || 1 })}
                    min="1" max="10" className="input" style={{ width: '100%', textAlign: 'center' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>端口</label>
                  <input type="number" value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5678 })}
                    min="1" max="65535" className="input" style={{ width: '100%', textAlign: 'center' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>镜像名称</label>
                  <input type="text" value={config.image_name}
                    onChange={(e) => setConfig({ ...config, image_name: e.target.value })}
                    className="input" style={{ width: '100%', fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Webhook URL</label>
                <input type="text" value={config.webhook_url}
                  onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                  className="input" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {activeTab === 'authorization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>授权信息</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>查看和管理许可证</div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '20px 24px', borderRadius: 14, background: '#f8fafc',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: license?.valid ? '#d1fae5' : '#fee2e2',
                }}>
                  <Cpu style={{ width: 24, height: 24, color: license?.valid ? '#059669' : '#dc2626' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>授权状态</div>
                  <div style={{ fontSize: 14, color: license?.valid ? '#059669' : '#dc2626', fontWeight: 600 }}>
                    {license?.valid ? '已激活' : '未激活'}
                  </div>
                </div>
              </div>

              {license?.valid && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {license.license_type && (
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: '#f8fafc' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>授权类型</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{license.license_type}</div>
                    </div>
                  )}
                  {license.expire_time && (
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: '#f8fafc' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>签发时间</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{license.expire_time}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => guard(handleSaveConfig)} disabled={saving} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
            <Save style={{ width: 16, height: 16 }} /> {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
