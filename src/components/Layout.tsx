import type { PageType, LicenseTier } from '../types';
import { ReactNode, useState } from 'react';
import { Monitor, Settings, RefreshCw, FolderOpen, FileText, ShieldCheck, KeyRound, Info, Wifi, WifiOff, Bell, X, Ban, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle, InfoIcon, Store, Palette } from 'lucide-react';

interface ServerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

interface LayoutProps {
  page: PageType;
  licenseValid: boolean | null;
  licenseTier: LicenseTier | null;
  serverOnline: boolean;
  licenseEnabled: boolean;
  notifications: ServerNotification[];
  showNotif: boolean;
  children: ReactNode;
  onDismissNotif: (id: string) => void;
  onDismissAll: () => void;
  onToggleNotifPanel: () => void;
  onNavigate?: (page: PageType) => void;
}

const navItems: { id: PageType; label: string; icon: typeof Monitor }[] = [
  { id: 'dashboard', label: '仪表盘', icon: Monitor },
  { id: 'services', label: '服务管理', icon: RefreshCw },
  { id: 'version', label: '版本管理', icon: FolderOpen },
  { id: 'marketplace', label: '应用市场', icon: Store },
  { id: 'beautify', label: '界面美化', icon: Palette },
  { id: 'settings', label: '设置', icon: Settings },
  { id: 'logs', label: '日志', icon: FileText },
  { id: 'license', label: '授权管理', icon: KeyRound },
  { id: 'about', label: '关于我们', icon: Info },
];

const PAGE_SIZE = 5;

export default function Layout({ page, licenseValid, licenseTier, serverOnline, licenseEnabled, notifications, showNotif, children, onDismissNotif, onDismissAll, onToggleNotifPanel, onNavigate }: LayoutProps) {
  const [notifPage, setNotifPage] = useState(0);
  const tierLabel = licenseValid
    ? licenseTier === 'enterprise' ? '企业版' : '专业版'
    : '';

  const unreadCount = notifications.length;
  const totalPages = Math.ceil(unreadCount / PAGE_SIZE);
  const pageNotifs = notifications.slice(notifPage * PAGE_SIZE, (notifPage + 1) * PAGE_SIZE);

  const handleDismiss = (id: string) => {
    onDismissNotif(id);
    // if last item on page, go back
    const remainingAfterDismiss = unreadCount - 1;
    const maxPage = Math.max(0, Math.ceil(remainingAfterDismiss / PAGE_SIZE) - 1);
    if (notifPage > maxPage) setNotifPage(maxPage);
  };

  const handleClose = () => {
    setNotifPage(0);
    onDismissAll();
    onToggleNotifPanel();
  };

  const typeIcon = (type: string) => {
    if (type === 'error') return <AlertCircle style={{ width: 18, height: 18, color: '#dc2626', flexShrink: 0 }} />;
    if (type === 'warning') return <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0 }} />;
    return <InfoIcon style={{ width: 18, height: 18, color: '#3b82f6', flexShrink: 0 }} />;
  };

  const typeColor = (type: string) => {
    if (type === 'error') return '#fef2f2';
    if (type === 'warning') return '#fffbeb';
    return '#eff6ff';
  };

  const typeBorder = (type: string) => {
    if (type === 'error') return '#fecaca';
    if (type === 'warning') return '#fde68a';
    return '#bfdbfe';
  };

  return (
    <div className="flex h-screen">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img src="/icon.png" alt="n8n" style={{ width: 20, height: 20, borderRadius: 4 }} />
          </div>
          <div>
            <div className="sidebar-brand-name">n8n</div>
            <div className="sidebar-brand-sub">Desktop Assistant</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">主菜单</div>
          {navItems.map((item) => {
            const isActive = page === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate?.(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                <item.icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
                {isActive && <div className="sidebar-nav-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            padding: '8px 10px', borderRadius: 8,
            background: serverOnline ? '#f0fdf4' : '#fef2f2',
            fontSize: 12, color: serverOnline ? '#059669' : '#dc2626',
          }}>
            {serverOnline ? <Wifi style={{ width: 14, height: 14 }} /> : <WifiOff style={{ width: 14, height: 14 }} />}
            <span>{serverOnline ? '服务器在线' : '服务器离线'}</span>
          </div>
          <button onClick={() => onNavigate?.('license')} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 0, border: 'none', background: 'transparent',
            cursor: 'pointer', width: '100%', textAlign: 'left',
          }}>
            {licenseValid && !licenseEnabled ? (
              <Ban className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
            ) : (
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: licenseValid ? '#059669' : '#dc2626' }} />
            )}
            <div className="sidebar-license-info">
              <span className="sidebar-license-label">授权状态</span>
              {!licenseValid ? (
                <span className="sidebar-license-invalid">未授权</span>
              ) : !licenseEnabled ? (
                <span className="sidebar-license-invalid">已被禁用</span>
              ) : (
                <span className="sidebar-license-valid">{tierLabel}</span>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="sidebar-content" style={{ position: 'relative' }}>
        {/* Notification bell - always visible when there are notifications */}
        {unreadCount > 0 && (
          <button
            onClick={onToggleNotifPanel}
            style={{
              position: 'absolute', top: 16, right: 24, zIndex: 30,
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
              padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 150ms',
            }}
          >
            <Bell style={{ width: 16, height: 16, color: '#3b82f6' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{unreadCount} 条通知</span>
          </button>
        )}

        {/* Global notification modal */}
        {showNotif && unreadCount > 0 && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 200ms ease',
          }}>
            <div style={{
              background: '#fff', borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
              width: 480, maxWidth: '90vw',
              maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding: '20px 24px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                  }}>
                    <Bell style={{ width: 18, height: 18, color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>消息通知</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>共 {unreadCount} 条未读</div>
                  </div>
                </div>
                <button onClick={handleClose} style={{
                  border: 'none', background: '#f3f4f6', borderRadius: 8,
                  cursor: 'pointer', padding: 6, display: 'flex',
                }}>
                  <X style={{ width: 16, height: 16, color: '#6b7280' }} />
                </button>
              </div>

              {/* Notification list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {pageNotifs.map(n => (
                  <div key={n.id} style={{
                    padding: 14, borderRadius: 12, marginBottom: 10,
                    background: typeColor(n.type), border: `1px solid ${typeBorder(n.type)}`,
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ marginTop: 1 }}>{typeIcon(n.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                          {new Date(n.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <button onClick={() => handleDismiss(n.id)} style={{
                        border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: 6,
                        cursor: 'pointer', padding: 4, flexShrink: 0,
                      }}>
                        <X style={{ width: 14, height: 14, color: '#9ca3af' }} />
                      </button>
                    </div>
                  </div>
                ))}

                {unreadCount === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                    <Bell style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: 14 }}>暂无通知</div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '12px 24px 16px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
                }}>
                  <button
                    onClick={() => setNotifPage(p => Math.max(0, p - 1))}
                    disabled={notifPage === 0}
                    style={{
                      border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff',
                      padding: '6px 10px', cursor: notifPage === 0 ? 'not-allowed' : 'pointer',
                      opacity: notifPage === 0 ? 0.4 : 1, display: 'flex',
                    }}
                  >
                    <ChevronLeft style={{ width: 16, height: 16 }} />
                  </button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => setNotifPage(i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: i === notifPage ? '#3b82f6' : '#f3f4f6',
                        color: i === notifPage ? '#fff' : '#6b7280',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setNotifPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={notifPage >= totalPages - 1}
                    style={{
                      border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff',
                      padding: '6px 10px', cursor: notifPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      opacity: notifPage >= totalPages - 1 ? 0.4 : 1, display: 'flex',
                    }}
                  >
                    <ChevronRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* License disabled overlay */}
        {licenseValid && !licenseEnabled && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxWidth: 400,
            }}>
              <Ban style={{ width: 48, height: 48, color: '#dc2626', marginBottom: 16 }} />
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>授权已被禁用</div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>管理员已禁用您的授权，请联系管理员</div>
              <button onClick={() => onNavigate?.('license')} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                查看授权信息
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
