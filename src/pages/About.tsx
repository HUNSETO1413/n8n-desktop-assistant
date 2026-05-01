import { Phone, MessageCircle, Globe, ShieldCheck, ExternalLink, Check, X, Crown, Settings2 } from 'lucide-react';

export default function About() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 800, margin: '0 auto' }}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Hero */}
        <div className="glass-card" style={{ padding: '36px 32px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(234,75,113,0.25)',
            overflow: 'hidden',
          }}>
            <img src="/icon.png" alt="n8n" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>n8n Desktop Assistant</div>
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
            n8n 桌面端管理助手，一键部署和管理 n8n 企业版容器化环境。
          </div>
          <div style={{ marginTop: 16 }}>
            <span className="badge badge-info">v1.0.0</span>
          </div>
        </div>

        {/* Developer + QR side by side */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>开发者信息</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Left: contacts */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: '#f8fafc' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff' }}>
                  <Phone style={{ width: 20, height: 20, color: '#3b82f6' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>联系电话</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>19560341319</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: '#f8fafc' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5' }}>
                  <MessageCircle style={{ width: 20, height: 20, color: '#059669' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>微信号</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>399187854</div>
                </div>
              </div>
            </div>
            {/* Right: QR code */}
            <div style={{
              width: 140, flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: 14, borderRadius: 14, background: '#f8fafc',
            }}>
              <div style={{
                width: 100, height: 100, borderRadius: 10,
                background: '#fff', overflow: 'hidden',
              }}>
                <img src="/wechat.png" alt="微信二维码" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>扫码添加微信</div>
            </div>
          </div>
        </div>

        {/* Desktop App Tier Comparison */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>桌面端版本对比</div>
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>功能</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#3b82f6', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Settings2 style={{ width: 14, height: 14 }} /> 专业版
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#7c3aed', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Crown style={{ width: 14, height: 14 }} /> 企业版
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: '容器管理（启动/停止/重启）', pro: true },
                  { feature: '日志查看', pro: true },
                  { feature: '版本管理与更新', pro: true },
                  { feature: '中文界面切换', pro: true },
                  { feature: '设置管理', pro: true },
                  { feature: '企业版功能注入', pro: false },
                  { feature: 'Worker 数量调整', pro: false },
                ].map(({ feature, pro }) => (
                  <tr key={feature}>
                    <td style={{ padding: '10px 12px', color: '#374151', borderBottom: '1px solid #f8fafc' }}>{feature}</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #f8fafc' }}>
                      {pro ? <Check style={{ width: 16, height: 16, color: '#059669', margin: '0 auto' }} /> : <X style={{ width: 16, height: 16, color: '#d1d5db', margin: '0 auto' }} />}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #f8fafc' }}>
                      <Check style={{ width: 16, height: 16, color: '#059669', margin: '0 auto' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* n8n Community vs Enterprise Comparison */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>n8n 社区版 vs 企业版</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>了解 n8n 平台版本功能差异</div>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>功能</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>社区版</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#7c3aed', fontWeight: 600, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Crown style={{ width: 13, height: 13 }} /> 企业版
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: '工作流', feature: '工作流数量与执行', free: '有限制（约 100 个）', ent: '无限工作流与执行' },
                  { cat: '工作流', feature: '执行频率', free: '有限制', ent: '按需定制，支持高频' },
                  { cat: '安全', feature: '基本安全（SSL/OAuth）', free: '支持', ent: '支持' },
                  { cat: '安全', feature: 'SSO（SAML/LDAP）', free: '不支持', ent: '支持' },
                  { cat: '安全', feature: '审计日志与合规', free: '不支持', ent: 'ISO 27001 / GDPR' },
                  { cat: '安全', feature: '数据加密', free: '基础', ent: '企业级' },
                  { cat: '监控', feature: '执行状态显示', free: '基本', ent: '详细分析报表' },
                  { cat: '监控', feature: '故障率/性能统计', free: '不支持', ent: '支持自定义报表' },
                  { cat: '数据', feature: '全局变量', free: '不支持', ent: '跨工作流变量' },
                  { cat: '数据', feature: '数据版本控制', free: '不支持', ent: '支持历史记录' },
                  { cat: '部署', feature: '部署方式', free: 'Docker/云服务器', ent: '私有化/多环境/集群' },
                  { cat: '部署', feature: '扩展性', free: '有限', ent: '负载均衡/密钥存储' },
                  { cat: '服务', feature: '技术支持', free: '社区支持', ent: 'SLA 保障/专属客户经理' },
                ].map(({ cat, feature, free, ent: entVal }) => (
                  <tr key={feature}>
                    <td style={{ padding: '8px 12px', color: '#374151', borderBottom: '1px solid #f8fafc', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 10, color: '#fff', background: cat === '工作流' ? '#3b82f6' : cat === '安全' ? '#059669' : cat === '监控' ? '#d97706' : cat === '数据' ? '#7c3aed' : cat === '部署' ? '#6366f1' : '#6b7280', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>{cat}</span>
                      {feature}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#6b7280', borderBottom: '1px solid #f8fafc', whiteSpace: 'nowrap' }}>{free}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#7c3aed', borderBottom: '1px solid #f8fafc', fontWeight: 500, whiteSpace: 'nowrap' }}>{entVal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Features */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>项目特性</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: ShieldCheck, text: '一键 Docker 部署', color: '#EA4B71', bg: '#fdf2f6' },
              { icon: ShieldCheck, text: '企业版功能注入', color: '#059669', bg: '#ecfdf5' },
              { icon: Globe, text: '中文界面支持', color: '#EA4B71', bg: '#fdf2f6' },
              { icon: ExternalLink, text: '版本管理与更新', color: '#7c3aed', bg: '#f5f3ff' },
            ].map(({ icon: Icon, text, color, bg }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#f8fafc', overflow: 'hidden' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
                  <Icon style={{ width: 18, height: 18, color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* License Link */}
        <div className="glass-card" style={{ padding: '20px 24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <ShieldCheck style={{ width: 20, height: 20, color: '#6b7280', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>获取授权码</div>
                <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>联系开发者获取正版授权</div>
              </div>
            </div>
            <a href="#" onClick={(e) => e.preventDefault()} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
              color: '#3b82f6', fontSize: 13, fontWeight: 500, textDecoration: 'none',
            }}>
              获取授权 <ExternalLink style={{ width: 14, height: 14 }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
