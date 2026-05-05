import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Copy } from 'lucide-react';

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const win = getCurrentWindow();
    win.isMaximized().then(setMaximized).catch(() => {});

    const unlisten = win.onResized(async () => {
      try {
        setMaximized(await win.isMaximized());
      } catch { /* ignore */ }
    });

    return () => { unlisten.then(fn => fn()); };
  }, []);

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleToggleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  return (
    <div className="titlebar">
      <div className="titlebar-drag" data-tauri-drag-region>
        <img src="/icon.png" alt="" className="titlebar-logo" />
        <span className="titlebar-title">n8n Desktop Assistant</span>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={handleMinimize} title="最小化">
          <Minus style={{ width: 14, height: 14 }} />
        </button>
        <button className="titlebar-btn" onClick={handleToggleMaximize} title={maximized ? '还原' : '最大化'}>
          {maximized
            ? <Copy style={{ width: 12, height: 12, transform: 'scaleX(-1)' }} />
            : <Square style={{ width: 12, height: 12 }} />
          }
        </button>
        <button className="titlebar-btn titlebar-btn-close" onClick={handleClose} title="关闭">
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
