import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Palette, Check, Trash2, Loader2, Code, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

interface ThemeInfo {
  id: string;
  name: string;
  description: string;
  preview_colors: string[];
  css: string;
}

export default function BeautifyPage() {
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [customCss, setCustomCss] = useState('');
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [containerReady, setContainerReady] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [themeList, config] = await Promise.all([
        invoke<ThemeInfo[]>('list_themes'),
        invoke<{ install_path: string }>('load_config'),
      ]);
      setThemes(themeList);

      const ready = await invoke<boolean>('check_beautify_ready', { installPath: config.install_path });
      setContainerReady(ready);

      if (ready) {
        const active = await invoke<string | null>('get_active_theme', { installPath: config.install_path });
        setActiveTheme(active);
      }
    } catch {
      setContainerReady(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (themeId: string) => {
    try {
      setApplying(themeId);
      setMessage(null);
      const config = await invoke<{ install_path: string }>('load_config');
      const result = await invoke<{ success: boolean; message: string }>('apply_theme', {
        installPath: config.install_path,
        themeId,
        customCss: editingTheme === themeId ? customCss : null,
      });
      if (result.success) {
        setActiveTheme(themeId);
        setMessage({ text: result.message, type: 'success' });
        setEditingTheme(null);
        setShowEditor(false);
      }
    } catch (err) {
      setMessage({ text: err as string, type: 'error' });
    } finally {
      setApplying(null);
    }
  };

  const handleRemove = async () => {
    try {
      setApplying('remove');
      setMessage(null);
      const config = await invoke<{ install_path: string }>('load_config');
      const result = await invoke<{ success: boolean; message: string }>('remove_theme', {
        installPath: config.install_path,
      });
      if (result.success) {
        setActiveTheme(null);
        setMessage({ text: result.message, type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err as string, type: 'error' });
    } finally {
      setApplying(null);
    }
  };

  const handleEditTheme = (theme: ThemeInfo) => {
    setEditingTheme(theme.id);
    setCustomCss(theme.css);
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af' }}>
          <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13 }}>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              <Palette style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>界面美化</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>
                自定义 n8n 工作流界面样式，选择预设主题或编写自定义 CSS
              </div>
            </div>
          </div>
        </div>

        {/* Container not running warning */}
        {!containerReady && (
          <div style={{
            padding: '16px 20px', borderRadius: 12, fontSize: 13,
            background: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>n8n 容器未运行，请先在「环境管理」中启动 n8n</span>
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 13,
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#059669' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {message.type === 'success' ? <Check style={{ width: 14, height: 14 }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
            {message.text}
            {message.type === 'success' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, opacity: 0.7 }}>
                <RefreshCw style={{ width: 12, height: 12 }} />
                刷新 n8n 页面即可生效
              </span>
            )}
          </div>
        )}

        {/* Theme Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {themes.map(theme => {
            const isActive = activeTheme === theme.id;
            const isApplying = applying === theme.id;
            const disabled = !containerReady || isApplying;
            return (
              <div
                key={theme.id}
                className="glass-card"
                style={{
                  padding: 20,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  border: isActive ? '2px solid #6366f1' : '2px solid transparent',
                  background: isActive ? '#faf5ff' : undefined,
                  transition: 'all 0.2s',
                  position: 'relative',
                  opacity: !containerReady ? 0.5 : 1,
                }}
                onClick={() => !disabled && handleApply(theme.id)}
              >
                {/* Active badge */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: '#6366f1', color: '#fff', borderRadius: 20,
                    fontSize: 10, padding: '2px 8px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Check style={{ width: 10, height: 10 }} />
                    使用中
                  </div>
                )}

                {/* Preview colors */}
                <div style={{
                  display: 'flex', gap: 6, marginBottom: 14,
                }}>
                  {theme.preview_colors.map((color, i) => (
                    <div key={i} style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: color, flexShrink: 0,
                      boxShadow: `0 2px 8px ${color}33`,
                    }} />
                  ))}
                </div>

                {/* Info */}
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  {theme.name}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, marginBottom: 12 }}>
                  {theme.description}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={isActive ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary'}
                    disabled={disabled}
                    onClick={(e) => { e.stopPropagation(); handleApply(theme.id); }}
                    style={{ flex: 1, fontSize: 12, padding: '6px 12px' }}
                  >
                    {isApplying ? (
                      <><Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> 应用中...</>
                    ) : isActive ? (
                      <><Check style={{ width: 12, height: 12 }} /> 已启用</>
                    ) : (
                      <><Sparkles style={{ width: 12, height: 12 }} /> 应用</>
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={(e) => { e.stopPropagation(); handleEditTheme(theme); }}
                    style={{ padding: '6px 8px', fontSize: 12 }}
                    title="编辑 CSS"
                    disabled={!containerReady}
                  >
                    <Code style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Remove theme button */}
        {activeTheme && containerReady && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-sm"
              onClick={handleRemove}
              disabled={applying === 'remove'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', fontSize: 12, borderRadius: 10,
                border: '1px solid #fecaca', color: '#dc2626',
                background: '#fef2f2',
              }}
            >
              {applying === 'remove' ? (
                <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 style={{ width: 12, height: 12 }} />
              )}
              移除当前主题
            </button>
          </div>
        )}

        {/* CSS Editor Modal */}
        {showEditor && editingTheme && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 20, padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
              width: 640, maxWidth: '90vw', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Code style={{ width: 18, height: 18, color: '#6366f1' }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  编辑 CSS - {themes.find(t => t.id === editingTheme)?.name}
                </span>
              </div>

              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, minHeight: 320, padding: 16,
                  fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
                  border: '1px solid #e5e7eb', borderRadius: 12,
                  background: '#f8fafc', color: '#374151',
                  resize: 'none', outline: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowEditor(false); setEditingTheme(null); }}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleApply(editingTheme)}
                  disabled={applying === editingTheme}
                >
                  {applying === editingTheme ? (
                    <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> 应用中...</>
                  ) : (
                    <>应用自定义 CSS</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
