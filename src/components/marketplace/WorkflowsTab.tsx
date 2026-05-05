import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Search, SlidersHorizontal, X, ChevronDown,
} from 'lucide-react';
import { searchWorkflows, getWorkflowFilters } from '../../services/marketplace';
import type { WorkflowItem, WorkflowFilters, WorkflowFilterParams } from '../../services/marketplace';
import PackageCard from './PackageCard';
import PackageDetailModal from './PackageDetailModal';

const WF_PAGE_SIZE = 20;

// 筛选维度的中文映射
const FILTER_LABELS: Record<string, string> = {
  time_period: '时间范围',
  category: '分类',
  popularity: '排序',
  price: '价格',
  complexity: '复杂度',
  business_layer: '业务层',
  business_type: '业务类型',
  business_category: '业务分类',
  department: '部门',
  industry: '行业',
  model: '模型',
  start_type: '触发方式',
  ai: 'AI',
  agent: 'Agent',
  mcp: 'MCP',
  rag: 'RAG',
  ai_cost: 'AI 成本',
  setup_time: '搭建时间',
  setup_cost: '搭建成本',
  security: '安全',
  subworkflow: '子工作流',
  generic: '通用',
  scalable: '可扩展',
  human_in_the_loop: '人机协作',
  error_ratio: '错误率',
  maintenance: '维护难度',
  score: '评分',
  node_type: '节点类型',
};

// 默认显示的主要筛选维度
const PRIMARY_FILTERS = ['category', 'popularity', 'complexity', 'price', 'time_period'];
const ADVANCED_FILTERS = ['business_layer', 'business_type', 'department', 'industry', 'start_type', 'ai', 'agent', 'mcp', 'rag', 'model', 'ai_cost', 'setup_time', 'setup_cost', 'security', 'subworkflow', 'scalable', 'human_in_the_loop', 'maintenance', 'score'];

export default function WorkflowsTab() {
  const [results, setResults] = useState<WorkflowItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null);
  const [filters, setFilters] = useState<WorkflowFilters>({});
  const [activeFilters, setActiveFilters] = useState<WorkflowFilterParams>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / WF_PAGE_SIZE));

  // 加载筛选项
  useEffect(() => {
    (async () => {
      setFiltersLoading(true);
      try {
        const f = await getWorkflowFilters();
        setFilters(f);
      } catch {
        // 筛选加载失败不阻塞主流程
      } finally {
        setFiltersLoading(false);
      }
    })();
  }, []);

  // 加载工作流数据
  const loadData = useCallback(async (params: WorkflowFilterParams) => {
    setLoading(true);
    setError('');
    try {
      const res = await searchWorkflows(params);
      setResults(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(typeof err === 'string' ? err : '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData({ ...activeFilters, query: searchQuery || undefined, page });
  }, [loadData, searchQuery, page, activeFilters]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      if (value === '' || value === 'all') {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (next as Record<string, string | undefined>)[key];
      } else {
        (next as Record<string, string | undefined>)[key] = value;
      }
      return next;
    });
    setPage(0);
    setOpenDropdown(null);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setPage(0);
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  // 渲染筛选下拉
  const renderFilterSelect = (filterKey: string) => {
    const options = filters[filterKey as keyof WorkflowFilters];
    if (!options || options.length === 0) return null;

    const currentVal = (activeFilters as Record<string, string | undefined>)[filterKey] || '';
    const label = FILTER_LABELS[filterKey] || filterKey;

    return (
      <div key={filterKey} style={{ position: 'relative' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setOpenDropdown(openDropdown === filterKey ? null : filterKey)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', fontSize: 12, borderRadius: 8,
            border: currentVal ? '1px solid #3b82f6' : '1px solid #e5e7eb',
            background: currentVal ? '#eff6ff' : 'rgba(255,255,255,0.8)',
            color: currentVal ? '#3b82f6' : '#374151',
            fontWeight: currentVal ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          {label}
          {currentVal && (
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#3b82f6', display: 'inline-block',
            }} />
          )}
          <ChevronDown style={{ width: 12, height: 12 }} />
        </button>
        {openDropdown === filterKey && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
              onClick={() => setOpenDropdown(null)}
            />
            <div style={{
              position: 'absolute', top: '100%', left: 0,
              marginTop: 4, background: 'white',
              borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              border: '1px solid #e5e7eb',
              minWidth: 180, maxHeight: 280,
              overflow: 'auto', zIndex: 101,
              padding: '4px 0',
            }}>
              <div
                onClick={() => handleFilterChange(filterKey, '')}
                style={{
                  padding: '8px 14px', fontSize: 12, cursor: 'pointer',
                  color: !currentVal ? '#3b82f6' : '#6b7280',
                  fontWeight: !currentVal ? 600 : 400,
                  background: !currentVal ? '#eff6ff' : 'transparent',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f9fafb'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = !currentVal ? '#eff6ff' : 'transparent'; }}
              >
                全部
              </div>
              {options.map(opt => {
                const displayLabel = opt.label_zh || opt.label;
                const isActive = currentVal === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleFilterChange(filterKey, opt.value)}
                    style={{
                      padding: '8px 14px', fontSize: 12, cursor: 'pointer',
                      color: isActive ? '#3b82f6' : '#374151',
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? '#eff6ff' : 'transparent',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f9fafb'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = isActive ? '#eff6ff' : 'transparent'; }}
                  >
                    {displayLabel}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* 搜索栏 */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap' as const,
      }}>
        <div style={{
          flex: 1, minWidth: 200, position: 'relative',
          display: 'flex', alignItems: 'center',
        }}>
          <Search style={{
            width: 16, height: 16, position: 'absolute',
            left: 12, color: '#9ca3af', pointerEvents: 'none',
          }} />
          <input
            className="input"
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="搜索工作流模板..."
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12,
              padding: '10px 12px 10px 36px', fontSize: 13,
            }}
          />
        </div>

        <div style={{
          fontSize: 12, color: '#9ca3af',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <SlidersHorizontal style={{ width: 13, height: 13 }} />
          共 {total.toLocaleString()} 个模板
        </div>
      </div>

      {/* 主要筛选栏 */}
      {!filtersLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 12, flexWrap: 'wrap' as const,
        }}>
          {PRIMARY_FILTERS.map(renderFilterSelect)}

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', fontSize: 12, borderRadius: 8,
              border: '1px dashed #d1d5db', color: '#6b7280',
            }}
          >
            <SlidersHorizontal style={{ width: 12, height: 12 }} />
            高级筛选
            {ADVANCED_FILTERS.reduce((count, key) => {
              const val = (activeFilters as Record<string, string | undefined>)[key];
              return count + (val ? 1 : 0);
            }, 0) > 0 && (
              <span style={{
                background: '#3b82f6', color: 'white', borderRadius: 10,
                fontSize: 10, padding: '1px 6px', fontWeight: 600,
              }}>
                {ADVANCED_FILTERS.reduce((count, key) => {
                  const val = (activeFilters as Record<string, string | undefined>)[key];
                  return count + (val ? 1 : 0);
                }, 0)}
              </span>
            )}
            <ChevronDown style={{
              width: 12, height: 12,
              transform: showAdvanced ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
          </button>

          {activeFilterCount > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearAllFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', fontSize: 11, borderRadius: 8,
                color: '#ef4444',
              }}
            >
              <X style={{ width: 12, height: 12 }} />
              清除筛选 ({activeFilterCount})
            </button>
          )}
        </div>
      )}

      {/* 高级筛选栏 */}
      {showAdvanced && !filtersLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 12, flexWrap: 'wrap' as const,
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(249,250,251,0.8)', border: '1px solid #e5e7eb',
        }}>
          {ADVANCED_FILTERS.map(renderFilterSelect)}
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 0', gap: 10, color: '#6b7280',
        }}>
          <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13 }}>加载中...</span>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 0', gap: 8, color: '#ef4444', fontSize: 13,
        }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          {error}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => loadData({ ...activeFilters, query: searchQuery || undefined, page })}
            style={{ marginLeft: 8 }}
          >
            重试
          </button>
        </div>
      )}

      {/* 空结果 */}
      {!loading && !error && results.length === 0 && (
        <div style={{
          textAlign: 'center' as const,
          padding: '60px 0', color: '#9ca3af', fontSize: 13,
        }}>
          未找到匹配的工作流模板
        </div>
      )}

      {/* 卡片网格 */}
      {!loading && !error && results.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {results.map(item => (
              <PackageCard
                key={item.id}
                item={{ type: 'workflow', data: item }}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              marginTop: 28, padding: '12px 0',
            }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  opacity: page === 0 ? 0.4 : 1,
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
                上一页
              </button>
              <span style={{ fontSize: 12, color: '#6b7280', padding: '0 12px' }}>
                第 {page + 1} / {totalPages} 页
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  opacity: page >= totalPages - 1 ? 0.4 : 1,
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                下一页
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </>
      )}

      {/* 详情弹窗 */}
      {selectedItem && (
        <PackageDetailModal
          item={{ type: 'workflow', data: selectedItem }}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
