import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import Layout from './components/Layout';
import EnvironmentCheck from './pages/EnvironmentCheck';
import Activation from './pages/Activation';
import Wizard from './pages/Wizard';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Settings from './pages/Settings';
import VersionManager from './pages/VersionManager';
import Logs from './pages/Logs';
import LicensePage from './pages/LicensePage';
import About from './pages/About';
import { LicenseContext } from './contexts/LicenseContext';
import type { LicenseValidationResult, EnvCheckResult, PageType, LicenseTier } from './types';

const LICENSE_SERVER = 'http://165.99.43.206:9091';
const HEARTBEAT_INTERVAL = 3 * 60 * 1000;

interface ServerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

function parseTier(licenseType?: string): LicenseTier {
  if (!licenseType) return 'professional';
  const lower = licenseType.toLowerCase();
  if (lower.includes('enterprise')) return 'enterprise';
  return 'professional';
}

function App() {
  const [page, setPage] = useState<PageType>('dashboard');
  const [licenseValid, setLicenseValid] = useState(false);
  const [licenseTier, setLicenseTier] = useState<LicenseTier | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [licenseEnabled, setLicenseEnabled] = useState(true);
  const [notifications, setNotifications] = useState<ServerNotification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [appUpdate, setAppUpdate] = useState<Awaited<ReturnType<typeof check>> | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => { init(); }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const sendHeartbeat = async (machineId: string) => {
    try {
      const res = await fetch(`${LICENSE_SERVER}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machineId }),
      });
      if (res.ok) {
        setServerOnline(true);
        const data = await res.json();
        if (data.license_enabled === false) {
          setLicenseEnabled(false);
        } else {
          setLicenseEnabled(true);
        }
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(prev => {
            const existing = new Set(prev.map(n => n.id));
            const fresh = data.notifications.filter((n: ServerNotification) => !existing.has(n.id));
            return [...fresh, ...prev].slice(0, 50);
          });
          setShowNotif(true);
        }
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    (async () => {
      try {
        const id = await invoke('get_machine_id') as string;
        await sendHeartbeat(id);
        timer = setInterval(() => sendHeartbeat(id), HEARTBEAT_INTERVAL);
      } catch { /* ignore */ }
    })();
    return () => { if (timer) clearInterval(timer); };
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      loadingRef.current = true;
      try {
        const envResult: EnvCheckResult = await invoke('check_env');
        if (!envResult.can_proceed) { setPage('env-check'); return; }
      } catch { /* ignore */ }

      await refreshLicense();
    } catch {
      setPage('dashboard');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }

    // Check for app self-update after init
    try {
      const update = await check();
      if (update) {
        setAppUpdate(update);
      }
    } catch { /* ignore in dev or without updater config */ }
  };

  const refreshLicense = useCallback(async () => {
    try {
      const machineId = await invoke('get_machine_id') as string;
      const licenseResult: LicenseValidationResult = await invoke('validate_license', { machineId });
      console.log('[License] validate result:', licenseResult);
      setLicenseValid(licenseResult.valid);
      setLicenseTier(licenseResult.valid ? parseTier(licenseResult.license_type) : null);
      if (!licenseResult.valid && !loadingRef.current) { setPage('activation'); }
    } catch (err) {
      console.error('[License] validate error:', err);
      setLicenseValid(false);
      setLicenseTier(null);
    }
  }, []);

  const installUpdate = async () => {
    if (!appUpdate || updating) return;
    setUpdating(true);
    setUpdateProgress(0);
    try {
      await appUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setUpdateProgress(5);
            break;
          case 'Progress':
            setUpdateProgress(prev => Math.min(prev + 2, 90));
            break;
          case 'Finished':
            setUpdateProgress(95);
            break;
        }
      });
      setUpdateProgress(100);
      await relaunch();
    } catch (err) {
      console.error('[Update] install failed:', err);
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-logo">
          <div className="app-loading-icon">
            <img src="/icon.png" alt="n8n" style={{ width: 64, height: 64, borderRadius: 14 }} />
          </div>
          <div className="app-loading-text">Desktop Assistant</div>
          <div className="app-loading-bar"><div className="app-loading-bar-inner" /></div>
        </div>
      </div>
    );
  }

  return (
    <LicenseContext.Provider value={{ licenseValid, licenseTier, refreshLicense }}>
      <Layout page={page} licenseValid={licenseValid} licenseTier={licenseTier} serverOnline={serverOnline} licenseEnabled={licenseEnabled} notifications={notifications} showNotif={showNotif} onDismissNotif={dismissNotification} onToggleNotifPanel={() => setShowNotif(prev => !prev)} onNavigate={setPage}>
        {page === 'env-check' && <EnvironmentCheck onComplete={async () => {
        await refreshLicense();
        // refreshLicense will set licenseValid, but state won't be available immediately
        // So we read the result directly to decide the page
        try {
          const machineId = await invoke('get_machine_id') as string;
          const result = await invoke('validate_license', { machineId }) as LicenseValidationResult;
          setPage(result.valid ? 'dashboard' : 'activation');
        } catch {
          setPage('activation');
        }
      }} />}
        {page === 'activation' && <Activation onComplete={async () => { await refreshLicense(); setPage('dashboard'); }} />}
        {page === 'wizard' && <Wizard onComplete={() => setPage('dashboard')} />}
        {page === 'dashboard' && <Dashboard licenseValid={licenseValid} licenseTier={licenseTier} onNavigate={setPage} />}
        {page === 'services' && <Services licenseValid={licenseValid} licenseTier={licenseTier} onNavigate={setPage} />}
        {page === 'settings' && <Settings />}
        {page === 'version' && <VersionManager licenseValid={licenseValid} licenseTier={licenseTier} onNavigate={setPage} />}
        {page === 'logs' && <Logs licenseValid={licenseValid} licenseTier={licenseTier} onNavigate={setPage} />}
        {page === 'license' && <LicensePage />}
        {page === 'about' && <About />}
      </Layout>

      {/* App self-update modal */}
      {appUpdate && !updating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxWidth: 420, width: '90%',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>&#128640;</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              发现新版本 v{appUpdate.version}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
              {appUpdate.body || '更新了若干功能，建议立即更新'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setAppUpdate(null)}>
                稍后提醒
              </button>
              <button className="btn btn-primary" onClick={installUpdate}>
                立即更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Updating progress modal */}
      {updating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxWidth: 360, width: '90%',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              正在更新...
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              下载并安装更新中，请勿关闭应用
            </div>
            <div style={{
              height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                width: `${updateProgress}%`, transition: 'width 300ms',
              }} />
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{updateProgress}%</div>
          </div>
        </div>
      )}
    </LicenseContext.Provider>
  );
}

export default App;
