import { useState, useEffect } from 'react';
import { X, ExternalLink, Download, Clock, Tag, Globe, BookOpen, DollarSign, Loader2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { installCommunityPackage, importWorkflowTemplate, translateToChinese } from '../../services/marketplace';
import type { NpmSearchObject, WorkflowItem, NpmPackageDetail } from '../../services/marketplace';

type DetailItem =
  | { type: 'node'; data: NpmSearchObject; detail?: NpmPackageDetail }
  | { type: 'workflow'; data: WorkflowItem };

interface PackageDetailModalProps {
  item: DetailItem;
  onClose: () => void;
}

type InstallState = 'idle' | 'loading' | 'success' | 'error';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '未知';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDownloads(n?: number): string {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function PackageDetailModal({ item, onClose }: PackageDetailModalProps) {
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [installMsg, setInstallMsg] = useState('');
  const [zhDesc, setZhDesc] = useState('');
  const [zhReadme, setZhReadme] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Auto-translate node descriptions
  useEffect(() => {
    if (item.type !== 'node') return;
    setZhDesc('');
    setZhReadme('');
    const desc = item.detail?.description || item.data.package.description || '';
    if (desc) {
      translateToChinese(desc).then(setZhDesc);
    }
  }, [item]);

  const handleTranslateReadme = async () => {
    if (item.type !== 'node') return;
    const readme = item.detail?.readme;
    if (readme) {
      const translated = await translateToChinese(readme.slice(0, 2000));
      setZhReadme(translated);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const openUrl = (url?: string) => {
    if (url) open(url);
  };

  const handleInstallPackage = async () => {
    if (item.type !== 'node') return;
    setInstallState('loading');
    setInstallMsg('正在安装...');
    try {
      const result = await installCommunityPackage(
        item.data.package.name,
        item.detail?.version || item.data.package.version,
      );
      setInstallState(result.success ? 'success' : 'error');
      setInstallMsg(result.message);
    } catch (err) {
      setInstallState('error');
      setInstallMsg(typeof err === 'string' ? err : '安装失败');
    }
  };

  const handleImportWorkflow = async () => {
    if (item.type !== 'workflow') return;
    setInstallState('loading');
    setInstallMsg('正在导入工作流...');
    try {
      const result = await importWorkflowTemplate(item.data.id);
      setInstallState(result.success ? 'success' : 'error');
      setInstallMsg(result.message);
    } catch (err) {
      setInstallState('error');
      setInstallMsg(typeof err === 'string' ? err : '导入失败');
    }
  };

  if (item.type === 'node') {
    const { data, detail } = item;
    const pkg = data.package;
    const desc = detail?.description || pkg.description || '暂无描述';
    const readme = detail?.readme;

    return (
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          maxWidth: 640,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInUp 0.3s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 28px 16px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                {zhDesc || desc}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: '#9ca3af', overflow: 'hidden' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{pkg.name}</span>
                <button
                  onClick={() => handleCopy(pkg.name)}
                  title="复制包名"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, color: copied ? '#22c55e' : '#b0b0b0',
                    borderRadius: 3, display: 'flex', alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                <span className="badge-info" style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                  v{detail?.version || pkg.version}
                </span>
                {pkg.license && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Tag style={{ width: 11, height: 11 }} />
                    {pkg.license}
                  </span>
                )}
                {pkg.publisher?.username && (
                  <span>作者: {pkg.publisher.username}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, color: '#9ca3af', borderRadius: 8,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 28px', overflow: 'auto', flex: 1 }}>
            {/* Score */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {(['quality', 'popularity', 'maintenance'] as const).map(key => {
                const val = Math.round((data.score.detail[key] || 0) * 100);
                const label = key === 'quality' ? '质量' : key === 'popularity' ? '热度' : '维护';
                const color = val > 70 ? '#22c55e' : val > 40 ? '#eab308' : '#ef4444';
                return (
                  <div key={key} style={{
                    flex: 1, padding: '10px 12px',
                    borderRadius: 10, background: '#f9fafb',
                    textAlign: 'center' as const,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{label}</div>
                  </div>
                );
              })}
            </div>

            {/* Downloads */}
            {data.downloads?.monthly && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 16, fontSize: 13, color: '#374151',
              }}>
                <Download style={{ width: 14, height: 14, color: '#6b7280' }} />
                月下载量: <strong>{formatDownloads(data.downloads.monthly)}</strong>
              </div>
            )}

            {/* Description - Chinese */}
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
              {zhDesc || desc}
            </div>

            {/* Keywords */}
            {(detail?.keywords || pkg.keywords) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16 }}>
                {(detail?.keywords || pkg.keywords || []).map(kw => (
                  <span key={kw} style={{
                    fontSize: 11, padding: '3px 10px',
                    borderRadius: 6, background: '#f3f4f6',
                    color: '#4b5563',
                  }}>
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* README preview */}
            {readme && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' as const }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen style={{ width: 14, height: 14 }} />
                    README
                  </span>
                  {!zhReadme && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handleTranslateReadme}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6 }}
                    >
                      翻译为中文
                    </button>
                  )}
                </div>
                {zhReadme && (
                  <div style={{
                    fontSize: 12, color: '#4b5563',
                    background: '#f0fdf4', padding: 16,
                    borderRadius: 10, overflow: 'auto',
                    maxHeight: 200, lineHeight: 1.6,
                    marginBottom: 8, borderLeft: '3px solid #22c55e',
                    whiteSpace: 'pre-wrap' as const,
                    wordBreak: 'break-word' as const,
                  }}>
                    {zhReadme}
                  </div>
                )}
                <pre style={{
                  fontSize: 12, color: '#9ca3af',
                  background: '#f9fafb', padding: 16,
                  borderRadius: 10, overflow: 'auto',
                  maxHeight: zhReadme ? 120 : 200, lineHeight: 1.6,
                  whiteSpace: 'pre-wrap' as const,
                  wordBreak: 'break-word' as const,
                }}>
                  {readme.slice(0, 2000)}{readme.length > 2000 ? '...' : ''}
                </pre>
              </div>
            )}

            {/* Updated */}
            {(detail?.time || pkg.date) && (
              <div style={{
                fontSize: 12, color: '#9ca3af', marginTop: 12,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Clock style={{ width: 12, height: 12 }} />
                最后更新: {formatDate(
                  detail?.time
                    ? Object.entries(detail.time).sort((a, b) => b[1].localeCompare(a[1]))[0]?.[1]
                    : pkg.date
                )}
              </div>
            )}
          </div>

          {/* Install status */}
          {installState !== 'idle' && (
            <div style={{
              padding: '10px 28px',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13,
              background: installState === 'success' ? '#f0fdf4'
                : installState === 'error' ? '#fef2f2'
                : '#eff6ff',
              color: installState === 'success' ? '#15803d'
                : installState === 'error' ? '#dc2626'
                : '#2563eb',
            }}>
              {installState === 'loading' && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
              {installState === 'success' && <CheckCircle2 style={{ width: 14, height: 14 }} />}
              {installState === 'error' && <AlertCircle style={{ width: 14, height: 14 }} />}
              {installMsg}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '16px 28px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}>
            {pkg.links?.repository && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openUrl(pkg.links!.repository)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Globe style={{ width: 13, height: 13 }} />
                源码
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={handleInstallPackage}
              disabled={installState === 'loading' || installState === 'success'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: installState === 'loading' || installState === 'success' ? 0.7 : 1,
              }}
            >
              {installState === 'loading'
                ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                : <Download style={{ width: 13, height: 13 }} />}
              {installState === 'success' ? '已安装' : installState === 'loading' ? '安装中...' : '安装到 n8n'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => openUrl(pkg.links?.npm || `https://www.npmjs.com/package/${pkg.name}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ExternalLink style={{ width: 13, height: 13 }} />
              在 npm 查看
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workflow detail
  const { data } = item;
  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        maxWidth: 640,
        width: '100%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInUp 0.3s ease',
      }}>
        <div style={{
          padding: '24px 28px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', margin: 0 }}>
              {data.name}
            </h2>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
              {data.author && <span>作者: {data.author}</span>}
              {data.price !== undefined && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <DollarSign style={{ width: 11, height: 11 }} />
                  {data.price === 0 ? '免费' : '付费'}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, color: '#9ca3af', borderRadius: 8,
            display: 'flex', alignItems: 'center',
          }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ padding: '20px 28px', overflow: 'auto', flex: 1 }}>
          {data.description && (
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
              {data.description}
            </div>
          )}

          {data.categories && data.categories.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16 }}>
              {data.categories.map(cat => (
                <span key={cat} style={{
                  fontSize: 11, padding: '3px 10px',
                  borderRadius: 6, background: '#f0fdf4',
                  color: '#15803d', fontWeight: 500,
                }}>
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const }}>
            {data.views !== undefined && (
              <div style={{
                flex: '1 1 auto', padding: '10px 12px',
                borderRadius: 10, background: '#f9fafb',
                textAlign: 'center' as const, minWidth: 80,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>
                  {formatDownloads(data.views)}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>总浏览</div>
              </div>
            )}
            {data.views_recent !== undefined && (
              <div style={{
                flex: '1 1 auto', padding: '10px 12px',
                borderRadius: 10, background: '#f9fafb',
                textAlign: 'center' as const, minWidth: 80,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                  {data.views_recent}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>近期浏览</div>
              </div>
            )}
            {data.node_count !== undefined && (
              <div style={{
                flex: '1 1 auto', padding: '10px 12px',
                borderRadius: 10, background: '#f9fafb',
                textAlign: 'center' as const, minWidth: 80,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6' }}>
                  {data.node_count}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>节点数</div>
              </div>
            )}
            {data.setup_cost !== undefined && (
              <div style={{
                flex: '1 1 auto', padding: '10px 12px',
                borderRadius: 10, background: '#f9fafb',
                textAlign: 'center' as const, minWidth: 80,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                  {data.setup_cost}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>搭建成本</div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
            {data.created_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock style={{ width: 12, height: 12 }} />
                创建: {formatDate(data.created_at)}
              </span>
            )}
            {data.updated_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock style={{ width: 12, height: 12 }} />
                更新: {formatDate(data.updated_at)}
              </span>
            )}
          </div>
        </div>

        {/* Import status */}
        {installState !== 'idle' && (
          <div style={{
            padding: '10px 28px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13,
            background: installState === 'success' ? '#f0fdf4'
              : installState === 'error' ? '#fef2f2'
              : '#eff6ff',
            color: installState === 'success' ? '#15803d'
              : installState === 'error' ? '#dc2626'
              : '#2563eb',
          }}>
            {installState === 'loading' && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
            {installState === 'success' && <CheckCircle2 style={{ width: 14, height: 14 }} />}
            {installState === 'error' && <AlertCircle style={{ width: 14, height: 14 }} />}
            {installMsg}
          </div>
        )}

        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleImportWorkflow}
            disabled={installState === 'loading' || installState === 'success'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: installState === 'loading' || installState === 'success' ? 0.7 : 1,
            }}
          >
            {installState === 'loading'
              ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
              : <Download style={{ width: 13, height: 13 }} />}
            {installState === 'success' ? '已导入' : installState === 'loading' ? '导入中...' : '导入到 n8n'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openUrl(data.url || `https://n8n.io/workflows/${data.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ExternalLink style={{ width: 13, height: 13 }} />
            在 n8n.io 查看
          </button>
        </div>
      </div>
    </div>
  );
}
