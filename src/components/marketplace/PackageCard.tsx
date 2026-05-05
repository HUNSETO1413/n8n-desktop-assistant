import { useState } from 'react';
import { Package, Download, Clock, Eye, ExternalLink, Copy, Check } from 'lucide-react';
import type { NpmSearchObject, WorkflowItem } from '../../services/marketplace';

type CardItem =
  | { type: 'node'; data: NpmSearchObject }
  | { type: 'workflow'; data: WorkflowItem };

interface PackageCardProps {
  item: CardItem;
  onClick: () => void;
  zhDescription?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return '今天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 月前`;
  return `${Math.floor(days / 365)} 年前`;
}

function formatDownloads(n?: number): string {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function PackageCard({ item, onClick, zhDescription }: PackageCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (item.type === 'node') {
    const { data } = item;
    const pkg = data.package;
    const popularity = Math.round((data.score.detail.popularity || 0) * 100);
    const quality = Math.round((data.score.detail.quality || 0) * 100);

    return (
      <div
        className="glass-card"
        onClick={onClick}
        style={{
          padding: '18px 20px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 8,
          height: '100%',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Package style={{ width: 16, height: 16, color: '#7c3aed' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1f2937',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}>
                {zhDescription || pkg.description || pkg.name}
              </div>
              <div style={{
                fontSize: 11,
                color: '#9ca3af',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                marginTop: 1,
              }}>
                {pkg.name}
                <button
                  onClick={e => handleCopy(e, pkg.name)}
                  title="复制包名"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, color: copied ? '#22c55e' : '#b0b0b0',
                    borderRadius: 3, display: 'flex', alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {copied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                </button>
              </div>
            </div>
          </div>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#eff6ff',
            color: '#3b82f6',
            fontWeight: 500,
            flexShrink: 0,
          }}>
            v{pkg.version}
          </span>
        </div>

        {/* Description - show only if different from title */}
        {(!zhDescription && pkg.description) && (
          <div style={{
            fontSize: 12,
            color: '#9ca3af',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}>
            {pkg.description}
          </div>
        )}

        {/* Meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontSize: 11,
          color: '#9ca3af',
        }}>
          {pkg.publisher?.username && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {pkg.publisher.username}
            </span>
          )}
          {data.downloads?.monthly ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Download style={{ width: 11, height: 11 }} />
              {formatDownloads(data.downloads.monthly)}/月
            </span>
          ) : null}
          {pkg.date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock style={{ width: 11, height: 11 }} />
              {formatDate(pkg.date)}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <span title="质量" style={{ fontSize: 10, color: quality > 70 ? '#22c55e' : quality > 40 ? '#eab308' : '#ef4444' }}>
              质量 {quality}
            </span>
            <span title="热度" style={{ fontSize: 10, color: popularity > 70 ? '#22c55e' : popularity > 40 ? '#eab308' : '#ef4444' }}>
              热度 {popularity}
            </span>
          </span>
        </div>
      </div>
    );
  }

  // Workflow card
  const { data } = item;
  return (
    <div
      className="glass-card"
      onClick={onClick}
      style={{
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 10,
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #dcfce7, #d1fae5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ExternalLink style={{ width: 16, height: 16, color: '#16a34a' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}>
            {data.name}
          </div>
        </div>
        {data.price !== undefined && data.price > 0 && (
          <span style={{
            fontSize: 10, padding: '2px 8px',
            borderRadius: 6, background: '#fef3c7',
            color: '#92400e', fontWeight: 500, flexShrink: 0,
          }}>
            付费
          </span>
        )}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 1.5,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        flex: 1,
      }}>
        {data.description || '暂无描述'}
      </div>

      {/* Categories */}
      {data.categories && data.categories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {data.categories.slice(0, 3).map(cat => (
            <span key={cat} style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 6,
              background: '#f0fdf4',
              color: '#15803d',
              fontWeight: 500,
            }}>
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontSize: 11,
        color: '#9ca3af',
      }}>
        {data.author && (
          <span>{data.author}</span>
        )}
        {data.views ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Eye style={{ width: 11, height: 11 }} />
            {formatDownloads(data.views)}
          </span>
        ) : null}
        {data.created_at && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock style={{ width: 11, height: 11 }} />
            {formatDate(data.created_at)}
          </span>
        )}
      </div>
    </div>
  );
}
