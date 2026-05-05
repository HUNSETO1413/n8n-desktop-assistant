import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export type SortOption = 'relevance' | 'popularity' | 'updated' | 'quality';

interface FilterBarProps {
  onSearch: (query: string) => void;
  onSort: (sort: SortOption) => void;
  placeholder?: string;
  total?: number;
}

export default function FilterBar({ onSearch, onSort, placeholder = '搜索...', total }: FilterBarProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('relevance');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  };

  const handleSort = (value: SortOption) => {
    setSort(value);
    onSort(value);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: '相关度' },
    { value: 'popularity', label: '热度' },
    { value: 'updated', label: '更新时间' },
    { value: 'quality', label: '质量评分' },
  ];

  return (
    <div className="glass-card" style={{
      padding: '16px 20px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap' as const,
    }}>
      <div style={{
        flex: 1,
        minWidth: 200,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}>
        <Search style={{
          width: 16, height: 16,
          position: 'absolute', left: 12,
          color: '#9ca3af',
          pointerEvents: 'none',
        }} />
        <input
          className="input"
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            paddingLeft: 36,
            paddingRight: 12,
            padding: '10px 12px 10px 36px',
            fontSize: 13,
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <ArrowUpDown style={{ width: 14, height: 14, color: '#6b7280' }} />
        <select
          value={sort}
          onChange={e => handleSort(e.target.value as SortOption)}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: 'rgba(255,255,255,0.8)',
            fontSize: 13,
            color: '#374151',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {total !== undefined && (
        <div style={{
          fontSize: 12,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 8,
        }}>
          <SlidersHorizontal style={{ width: 13, height: 13 }} />
          共 {total.toLocaleString()} 个结果
        </div>
      )}
    </div>
  );
}
