import { richText } from '../../i18n/ti';
import { ti } from '../../i18n/ti';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { editorStateToJson } from './editorStateToJson';
import { t } from '../../i18n';
import './WasmPreview.css';

type Status = 'loading' | 'ready' | 'error';

const WasmPreviewInner: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const canvas = useEditorStore((s) => s.canvas);
  const theme = useThemeStore((s) => s.currentTheme);

  // Send UI JSON to iframe
  const sendToWasm = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || status !== 'ready') return;
    const json = editorStateToJson(pages, currentPageId, canvas, theme);
    iframe.contentWindow.postMessage({ type: 'load-ui', json }, '*');
  }, [pages, currentPageId, canvas, theme, status]);

  // Listen for lvgl-ready from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'lvgl-ready') {
        setStatus('ready');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Debounced sync on state change
  useEffect(() => {
    if (status !== 'ready') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      sendToWasm();
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pages, currentPageId, canvas, status, sendToWasm]);

  // Timeout for loading — mark error after 15s
  useEffect(() => {
    if (status !== 'loading') return;
    const t = setTimeout(() => {
      setStatus((prev) => (prev === 'loading' ? 'error' : prev));
    }, 15000);
    return () => clearTimeout(t);
  }, [status]);

  // The runtime creates its display at start-up, so a new canvas size needs a fresh iframe
  const iframeSrc = `/wasm/lvgl_wasm.html?w=${canvas.width}&h=${canvas.height}`;

  const handleRefresh = () => {
    setStatus('loading');
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = iframeSrc;
    }
  };

  const statusLabel =
    status === 'ready'
      ? t('✅ Ready')
      : status === 'loading'
        ? t('⏳ Loading LVGL runtime...')
        : t('❌ Failed to load');

  return (
    <div className="wasm-preview">
      <div className="wasm-preview-toolbar">
        <span className={`wasm-preview-status wasm-preview-status--${status}`}>
          {richText(statusLabel)}
        </span>
        <button className="wasm-preview-refresh" onClick={handleRefresh}>
          {ti('🔄 Refresh')}
        </button>
      </div>

      <div className="wasm-preview-body">
        <div
          className="wasm-preview-iframe-wrapper"
          style={{ width: canvas.width, height: canvas.height }}
        >
          {status === 'loading' && (
            <div className="wasm-preview-overlay">{t('Loading LVGL runtime...')}</div>
          )}
          {status === 'error' && (
            <div className="wasm-preview-overlay wasm-preview-overlay--error">
              {t('WASM failed to load, click Refresh to retry')}
            </div>
          )}
          <iframe
            ref={iframeRef}
            className="wasm-preview-iframe"
            src={iframeSrc}
            title={t('LVGL WASM preview')}
            width={canvas.width}
            height={canvas.height}
          />
        </div>
      </div>

      <div className="wasm-preview-footer">
        {t('Rendered with the LVGL WASM runtime, matching real device output')}
      </div>
    </div>
  );
};

// A new canvas size remounts the preview: the runtime creates its display only at start-up
const WasmPreview: React.FC = () => {
  const width = useEditorStore((s) => s.canvas.width);
  const height = useEditorStore((s) => s.canvas.height);
  return <WasmPreviewInner key={`${width}x${height}`} />;
};

export default WasmPreview;
