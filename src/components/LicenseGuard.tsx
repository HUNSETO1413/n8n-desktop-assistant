import { useState } from 'react';
import { ShieldCheck, Phone, MessageCircle, X, KeyRound, ExternalLink, Crown } from 'lucide-react';
import type { PageType, LicenseTier } from '../types';

/* ====== Unauthorized Modal (未授权) ====== */
interface UnauthorizedModalProps {
  onClose: () => void;
  onNavigate?: (page: PageType) => void;
}

function UnauthorizedModal({ onClose, onNavigate }: UnauthorizedModalProps) {
  return (
    <ModalShell onClose={onClose} icon={<ShieldCheck style={{ width: 22, height: 22, color: '#dc2626' }} />} iconBg="#fef2f2"
      title="需要授权" subtitle="此功能需要激活许可证">
      <ModalBody onClose={onClose} onNavigate={onNavigate} />
    </ModalShell>
  );
}

/* ====== Enterprise Upgrade Modal (专业版升级) ====== */
interface UpgradeModalProps {
  onClose: () => void;
}

function EnterpriseUpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <ModalShell onClose={onClose} icon={<Crown style={{ width: 22, height: 22, color: '#d97706' }} />} iconBg="#fffbeb"
      title="需要企业版" subtitle="此功能需要企业版授权">
      <div style={{ padding: '20px 28px 24px' }}>
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: '#fffbeb', border: '1px solid #fef3c7',
          fontSize: 13, color: '#92400e', lineHeight: 1.6, marginBottom: 18,
        }}>
          当前为专业版授权，升级到企业版后可使用：企业版功能注入、Worker 数量调整等高级功能。
        </div>
        <ContactInfo />
        <LicenseLink />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>关闭</button>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>
            <Crown style={{ width: 14, height: 14 }} /> 了解升级
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ====== Shared Modal Shell ====== */
function ModalShell({ onClose, icon, iconBg, title, subtitle, children }: {
  onClose: () => void; icon: React.ReactNode; iconBg: string;
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        width: 440, background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 48px rgba(0,0,0,0.15)', overflow: 'hidden',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: '#f3f4f6', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6b7280',
          }}><X style={{ width: 16, height: 16 }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ====== Shared Contact Info Block ====== */
function ContactInfo() {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ContactRow icon={<Phone style={{ width: 16, height: 16, color: '#3b82f6' }} />} iconBg="#eff6ff" label="电话" value="19560341319" />
        <ContactRow icon={<MessageCircle style={{ width: 16, height: 16, color: '#059669' }} />} iconBg="#ecfdf5" label="微信" value="399187854" />
      </div>
      <div style={{
        width: 130, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 12, borderRadius: 12, background: '#f8fafc',
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: 8,
          background: '#fff', overflow: 'hidden',
        }}>
          <img src="/wechat.png" alt="微信二维码" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>扫码添加微信</div>
      </div>
    </div>
  );
}

function ContactRow({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: '#f8fafc' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{value}</div>
      </div>
    </div>
  );
}

function LicenseLink() {
  return (
    <div style={{
      marginBottom: 20, padding: '10px 14px', borderRadius: 10,
      background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      overflow: 'hidden',
    }}>
      <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500, flexShrink: 0 }}>在线获取授权码</span>
      <a href="#" onClick={(e) => e.preventDefault()} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 12, color: '#3b82f6', fontWeight: 600, textDecoration: 'none', flexShrink: 0,
      }}>
        点击获取 <ExternalLink style={{ width: 12, height: 12 }} />
      </a>
    </div>
  );
}

/* ====== Unauthorized Modal Body ====== */
function ModalBody({ onClose, onNavigate }: { onClose: () => void; onNavigate?: (page: PageType) => void }) {
  return (
    <div style={{ padding: '20px 28px 24px' }}>
      <div style={{
        padding: '14px 16px', borderRadius: 12,
        background: '#fffbeb', border: '1px solid #fef3c7',
        fontSize: 13, color: '#92400e', lineHeight: 1.6, marginBottom: 18,
      }}>
        请联系开发者获取授权码，激活后即可使用全部功能。
      </div>
      <ContactInfo />
      <LicenseLink />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>关闭</button>
        <button onClick={() => { onClose(); onNavigate?.('license'); }} className="btn btn-primary" style={{ flex: 1 }}>
          <KeyRound style={{ width: 14, height: 14 }} /> 去激活
        </button>
      </div>
    </div>
  );
}

/* ====== Hook ====== */
type ModalType = 'none' | 'unauthorized' | 'upgrade';

export function useLicenseGuard(licenseValid: boolean, licenseTier: LicenseTier | null, onNavigate?: (page: PageType) => void) {
  const [modalType, setModalType] = useState<ModalType>('none');

  const guard = (action: () => void) => {
    if (!licenseValid) { setModalType('unauthorized'); return; }
    action();
  };

  const guardEnterprise = (action: () => void) => {
    if (!licenseValid) { setModalType('unauthorized'); return; }
    if (licenseTier !== 'enterprise') { setModalType('upgrade'); return; }
    action();
  };

  const closeModal = () => setModalType('none');

  const GuardModal = modalType === 'none' ? null : modalType === 'unauthorized'
    ? <UnauthorizedModal onClose={closeModal} onNavigate={onNavigate} />
    : <EnterpriseUpgradeModal onClose={closeModal} />;

  return { guard, guardEnterprise, GuardModal };
}
