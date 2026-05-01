import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ArrowLeft, ArrowRight, Check, Rocket, Shield, Globe, Lock } from 'lucide-react';
import type { AppConfig } from '../types';

interface WizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: '欢迎', icon: Rocket },
  { id: 2, title: '安装路径', icon: ArrowRight },
  { id: 3, title: '安全配置', icon: Lock },
  { id: 4, title: '功能配置', icon: Shield },
  { id: 5, title: '确认初始化', icon: Check },
] as const;

export default function Wizard({ onComplete }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<AppConfig>({
    schema_version: 1,
    install_path: 'D:\\n8n-compose',
    data_paths: {
      postgresql: 'D:\\n8n-postgresql',
      n8n_data: 'D:\\n8n-data',
      external: 'D:\\n8n-external',
      ffmpeg: 'D:\\n8n-ffmpeg',
      images: 'D:\\n8n-images',
      mcp: 'D:\\n8n-mcp',
    },
    n8n_version: '2.18.5',
    workers: 3,
    webhook_url: 'http://localhost:5678/',
    encryption_key: 'iX2PxOqkh71A+AStsT8hEic+Co597arX',
    db_password: 'n8n',
    enterprise_enabled: true,
    chinese_ui_enabled: true,
    port: 5678,
    image_name: 'n8n-jianying:latest',
  });
  const [useQuickConfig, setUseQuickConfig] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const nextStep = () => { if (currentStep < STEPS.length) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig({ ...config, encryption_key: key });
  };

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      await invoke('save_config', { config });
      await invoke('generate_dockerfile', { installPath: config.install_path, n8nVersion: config.n8n_version });
      await invoke('generate_compose', { installPath: config.install_path, config: JSON.stringify(config) });
      const extractResult = await invoke('extract_base_command', { n8nVersion: config.n8n_version }) as { content: string };
      await invoke('inject_enterprise', { installPath: config.install_path, content: extractResult.content });
      if (config.chinese_ui_enabled) {
        await invoke('download_i18n', { n8nVersion: config.n8n_version, installPath: config.install_path });
      }
      await invoke('docker_build', { installPath: config.install_path, imageName: config.image_name });
      await invoke('compose_up', { installPath: config.install_path });
      setTimeout(() => onComplete(), 1000);
    } catch (err) {
      alert('初始化失败: ' + (err as string));
      setInitializing(false);
    }
  };

  return (
    <div className="page-container-centered">
      <div className="w-full max-w-xl animate-fade-in">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index + 1 === currentStep;
            const isDone = index + 1 < currentStep;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25' :
                    isDone ? 'bg-emerald-100 text-emerald-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${index + 1 < currentStep ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="glass-card p-6">
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-4">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">欢迎使用 n8n Desktop Assistant</h2>
                <p className="text-sm text-slate-400 mt-1">快速部署和管理 n8n 企业版</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  '一键部署 Docker 容器',
                  '自动注入企业版功能',
                  '中文界面一键切换',
                  '版本管理与一键更新',
                ].map(text => (
                  <div key={text} className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="section-title">安装路径配置</h3>
                <p className="section-desc">选择安装和数据存储位置</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setUseQuickConfig(true)}
                  className={`btn btn-sm ${useQuickConfig ? 'btn-primary' : 'btn-secondary'}`}>
                  一键配置（推荐）
                </button>
                <button onClick={() => setUseQuickConfig(false)}
                  className={`btn btn-sm ${!useQuickConfig ? 'btn-primary' : 'btn-secondary'}`}>
                  自定义配置
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">安装路径</label>
                <input type="text" value={config.install_path}
                  onChange={(e) => setConfig({ ...config, install_path: e.target.value })}
                  className="input w-full" />
                {useQuickConfig && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    将在上述路径下自动创建所有数据目录
                  </p>
                )}
              </div>

              {!useQuickConfig && (
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['postgresql', 'PostgreSQL'],
                    ['n8n_data', 'n8n 数据'],
                    ['external', '外部文件'],
                    ['ffmpeg', 'FFmpeg'],
                    ['images', '图片'],
                    ['mcp', 'MCP'],
                  ] as [keyof AppConfig['data_paths'], string][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-400 mb-1">{label}</label>
                      <input type="text" value={config.data_paths[key]}
                        onChange={(e) => setConfig({ ...config, data_paths: { ...config.data_paths, [key]: e.target.value } })}
                        className="input w-full text-sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="section-title">安全配置</h3>
                <p className="section-desc">设置加密密钥和数据库密码</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                如果您已有 n8n 数据，请使用原有加密密钥，否则已保存的凭证将无法解密。
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">加密密钥</label>
                <div className="flex gap-3">
                  <input type="text" value={config.encryption_key}
                    onChange={(e) => setConfig({ ...config, encryption_key: e.target.value })}
                    className="input flex-1 font-mono text-sm" />
                  <button onClick={generateRandomKey} className="btn btn-secondary btn-sm">随机</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">数据库密码</label>
                <input type="text" value={config.db_password}
                  onChange={(e) => setConfig({ ...config, db_password: e.target.value })}
                  className="input w-full" />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="section-title">功能配置</h3>
                <p className="section-desc">启用或禁用各项功能</p>
              </div>

              <div className="space-y-3">
                {([
                  { key: 'enterprise_enabled' as const, label: '企业版功能', desc: '自动注入企业版授权', icon: Shield },
                  { key: 'chinese_ui_enabled' as const, label: '中文界面', desc: '自动下载汉化包', icon: Globe },
                ]).map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{label}</div>
                        <div className="text-xs text-slate-400">{desc}</div>
                      </div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={config[key] as boolean}
                        onChange={(e) => setConfig({ ...config, [key]: e.target.checked })} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Workers</label>
                  <input type="number" value={config.workers}
                    onChange={(e) => setConfig({ ...config, workers: parseInt(e.target.value) || 1 })}
                    min="1" max="10" className="input w-full text-center" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">端口</label>
                  <input type="number" value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5678 })}
                    min="1" max="65535" className="input w-full text-center" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Webhook URL</label>
                  <input type="text" value={config.webhook_url}
                    onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                    className="input w-full text-sm" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="section-title">确认并初始化</h3>
                <p className="section-desc">请确认以下配置信息</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">安装路径</span>
                  <span className="text-slate-700 font-medium">{config.install_path}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">n8n 版本</span>
                  <span className="text-slate-700 font-medium">v{config.n8n_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">企业版</span>
                  <span className={config.enterprise_enabled ? 'text-emerald-600' : 'text-slate-400'}>
                    {config.enterprise_enabled ? '已启用' : '未启用'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">中文界面</span>
                  <span className={config.chinese_ui_enabled ? 'text-emerald-600' : 'text-slate-400'}>
                    {config.chinese_ui_enabled ? '已启用' : '未启用'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Workers</span>
                  <span className="text-slate-700 font-medium">{config.workers} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">端口</span>
                  <span className="text-slate-700 font-medium">{config.port}</span>
                </div>
              </div>

              {initializing && (
                <div className="text-center py-4">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <div className="text-sm text-slate-600 font-medium">初始化中...</div>
                  <div className="text-xs text-slate-400 mt-1">这可能需要几分钟</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-5">
          <button onClick={prevStep} disabled={currentStep === 1 || initializing}
            className="btn btn-secondary btn-lg">
            <ArrowLeft className="w-4 h-4" /> 上一步
          </button>
          <button
            onClick={currentStep === 5 ? handleInitialize : nextStep}
            disabled={initializing}
            className="btn btn-primary btn-lg"
          >
            {currentStep === 5 ? '开始初始化' : '下一步'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
