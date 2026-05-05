import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { searchNpmPackages, getPackageDetail, PAGE_SIZE, translateToChinese } from '../../services/marketplace';
import type { NpmSearchObject, NpmPackageDetail, SortOption } from './index';
import FilterBar from './FilterBar';
import PackageCard from './PackageCard';
import PackageDetailModal from './PackageDetailModal';

export default function CommunityNodesTab() {
  const [results, setResults] = useState<NpmSearchObject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedItem, setSelectedItem] = useState<{
    data: NpmSearchObject;
    detail?: NpmPackageDetail;
  } | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const sortResults = useCallback((items: NpmSearchObject[], sort: SortOption): NpmSearchObject[] => {
    const sorted = [...items];
    switch (sort) {
      case 'popularity':
        sorted.sort((a, b) => (b.score.detail.popularity || 0) - (a.score.detail.popularity || 0));
        break;
      case 'updated':
        sorted.sort((a, b) => {
          const da = a.package.date || '';
          const db = b.package.date || '';
          return db.localeCompare(da);
        });
        break;
      case 'quality':
        sorted.sort((a, b) => (b.score.detail.quality || 0) - (a.score.detail.quality || 0));
        break;
      default:
        break;
    }
    return sorted;
  }, []);

  const loadData = useCallback(async (query: string, pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await searchNpmPackages(query, pageNum);
      setResults(res.objects);
      setTotal(res.total);
      setTranslations({});
    } catch (err) {
      setError(typeof err === 'string' ? err : '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(searchQuery, page);
  }, [loadData, searchQuery, page]);

  // Background translate descriptions
  useEffect(() => {
    if (results.length === 0) return;
    let cancelled = false;
    (async () => {
      const descs = results.map(r => r.package.description || '');
      const translated = await Promise.all(
        descs.map(d => d.trim() ? translateToChinese(d).catch(() => '') : Promise.resolve(''))
      );
      if (cancelled) return;
      const map: Record<string, string> = {};
      results.forEach((r, i) => {
        if (translated[i]) map[r.package.name] = translated[i];
      });
      setTranslations(map);
    })();
    return () => { cancelled = true; };
  }, [results]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleSort = (sort: SortOption) => {
    setSortBy(sort);
    setResults(prev => sortResults(prev, sort));
  };

  const handleCardClick = async (item: NpmSearchObject) => {
    setSelectedItem({ data: item });
    try {
      const detail = await getPackageDetail(item.package.name);
      setSelectedItem({ data: item, detail });
    } catch {
      // detail fetch failed, still show basic info
    }
  };

  const displayResults = sortBy !== 'relevance' ? sortResults(results, sortBy) : results;

  return (
    <div>
      <FilterBar
        onSearch={handleSearch}
        onSort={handleSort}
        placeholder="搜索社区节点..."
        total={total}
      />

      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 0', gap: 10, color: '#6b7280',
        }}>
          <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13 }}>加载中...</span>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 0', gap: 8, color: '#ef4444', fontSize: 13,
        }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          {error}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => loadData(searchQuery, page)}
            style={{ marginLeft: 8 }}
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && displayResults.length === 0 && (
        <div style={{
          textAlign: 'center' as const,
          padding: '60px 0',
          color: '#9ca3af',
          fontSize: 13,
        }}>
          未找到匹配的社区节点
        </div>
      )}

      {!loading && !error && displayResults.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {displayResults.map(obj => (
              <PackageCard
                key={obj.package.name}
                item={{ type: 'node', data: obj }}
                zhDescription={translations[obj.package.name]}
                onClick={() => handleCardClick(obj)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 28,
              padding: '12px 0',
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

      {selectedItem && (
        <PackageDetailModal
          item={{ type: 'node', data: selectedItem.data, detail: selectedItem.detail }}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
