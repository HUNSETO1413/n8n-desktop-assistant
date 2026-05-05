import { useState } from 'react';
import { Package, Workflow, HardDrive } from 'lucide-react';
import { CommunityNodesTab, WorkflowsTab } from '../components/marketplace';
import InstalledTab from '../components/marketplace/InstalledTab';

type TabType = 'nodes' | 'workflows' | 'installed';

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<TabType>('nodes');

  const tabs: { id: TabType; label: string; icon: typeof Package }[] = [
    { id: 'nodes', label: '社区节点', icon: Package },
    { id: 'workflows', label: '工作流模板', icon: Workflow },
    { id: 'installed', label: '已安装', icon: HardDrive },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="animate-fade-in">
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
            应用市场
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            发现社区节点和工作流模板，扩展你的 n8n 能力
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.6)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'linear-gradient(180deg, #5b9aff 0%, #2563eb 100%)'
                    : 'transparent',
                  color: isActive ? 'white' : '#6b7280',
                  boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'nodes' && <CommunityNodesTab />}
        {activeTab === 'workflows' && <WorkflowsTab />}
        {activeTab === 'installed' && <InstalledTab />}
      </div>
    </div>
  );
}
