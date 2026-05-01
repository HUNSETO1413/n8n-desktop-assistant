import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RefreshCw, Trash2, Terminal } from 'lucide-react';
import { useLicenseGuard } from '../components/LicenseGuard';
import type { PageType, LicenseTier } from '../types';

interface LogsProps {
  licenseValid: boolean;
  licenseTier: LicenseTier | null;
  onNavigate?: (page: PageType) => void;
}

export default function Logs({ licenseValid, licenseTier, onNavigate }: LogsProps) {
  const [services] = useState<string[]>(['n8n-main', 'n8n-worker1', 'n8n-worker2', 'n8n-worker3', 'n8n-db', 'n8n-redis']);
  const [selectedService, setSelectedService] = useState('n8n-main');
  const [tailCount, setTailCount] = useState('200');
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { guard, GuardModal } = useLicenseGuard(licenseValid, licenseTier, onNavigate);

  useEffect(() => {
    loadLogs();
  }, [selectedService, tailCount]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await invoke('compose_logs', {
        installPath: 'D:\\n8n-compose',
        service: selectedService,
        tail: tailCount
      }) as { logs: string };
      const logLines = result.logs.split('\n').filter(line => line.trim());
      setLogs(logLines);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLogLevelColor = (line: string) => {
    const lower = line.toLowerCase();
    if (lower.includes('[info]')) return 'text-emerald-400';
    if (lower.includes('[warn]')) return 'text-amber-400';
    if (lower.includes('[error]')) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="flex flex-col h-full">
      {GuardModal}
      {/* Toolbar */}
      <div className="glass-card m-4 mb-0 rounded-xl">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="input py-1.5 px-3 text-sm min-w-[140px]"
              >
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
            <select
              value={tailCount}
              onChange={(e) => setTailCount(e.target.value)}
              className="input py-1.5 px-3 text-sm w-20"
            >
              <option value="50">50行</option>
              <option value="100">100行</option>
              <option value="200">200行</option>
              <option value="500">500行</option>
              <option value="1000">1000行</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <input type="checkbox" checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 rounded" />
              自动滚动
            </label>
            <button onClick={() => guard(loadLogs)} disabled={loading} className="btn btn-secondary btn-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 刷新
            </button>
            <button onClick={() => setLogs([])} className="btn btn-ghost btn-sm btn-icon">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Viewer */}
      <div className="flex-1 m-4 mt-3 overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
        <div
          ref={logContainerRef}
          className="h-full overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 text-center py-12">
              {loading ? '加载中...' : '选择服务查看日志'}
            </div>
          ) : (
            logs.map((line, index) => (
              <div key={index} className="flex gap-2 hover:bg-white/[0.02]">
                <span className="text-slate-600 select-none w-8 text-right shrink-0">{index + 1}</span>
                <span className={getLogLevelColor(line)}>{line}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
