import { useState, useEffect } from 'react';
import { Package, Loader2, AlertCircle } from 'lucide-react';
import { getInstalledPackages } from '../../services/marketplace';
import type { InstalledPackage } from '../../services/marketplace';

export default function InstalledTab() {
  const [packages, setPackages] = useState<InstalledPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getInstalledPackages();
      setPackages(result);
    } catch (err) {
      setError(typeof err === 'string' ? err : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 0', gap: 10, color: '#6b7280',
      }}>
        <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13 }}>加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 0', gap: 8, color: '#ef4444', fontSize: 13,
      }}>
        <AlertCircle style={{ width: 16, height: 16 }} />
        {error}
        <button className="btn btn-ghost btn-sm" onClick={loadData} style={{ marginLeft: 8 }}>
          重试
        </button>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div style={{
        textAlign: 'center' as const,
        padding: '60px 0',
        color: '#9ca3af',
        fontSize: 13,
      }}>
        <Package style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
        <div>暂无已安装的社区节点</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>前往「社区节点」标签安装</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
        共 {packages.length} 个已安装的社区节点
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {packages.map(pkg => (
          <div
            key={pkg.packageName}
            className="glass-card"
            style={{
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #dcfce7, #d1fae5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Package style={{ width: 16, height: 16, color: '#16a34a' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                }}>
                  {pkg.packageName}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  v{pkg.installedVersion}
                  {pkg.authorName && ` · ${pkg.authorName}`}
                </div>
              </div>
            </div>

            {/* Nodes */}
            {pkg.installedNodes && pkg.installedNodes.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                {pkg.installedNodes.map(node => (
                  <span key={node.type} style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#f0fdf4',
                    color: '#15803d',
                    fontWeight: 500,
                  }}>
                    {node.name}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 500 }}>已安装</span>
              {pkg.updatedAt && (
                <span style={{ fontSize: 10, color: '#9ca3af' }}>
                  {new Date(pkg.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
