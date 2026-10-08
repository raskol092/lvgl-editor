import { richText } from '../../i18n/ti';
import { ti } from '../../i18n/ti';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { encodeImagesForWasm } from './imageData';
import { useResourceStore } from '../../resources/resourceStore';
import type { LvglComponent } from '../../types';
import { editorStateToJson } from './editorStateToJson';
import { createPreviewRuntime } from './previewRuntime';
import { useLogicEditorStore } from '../LogicEditor/logicEditorStore';
import { t } from '../../i18n';
import './WasmPreview.css';

type Status = 'loading' | 'ready' | 'error';

const WasmPreviewInner: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const pages = useEditorStore((s) => s.pages);
  const editorPageId = useEditorStore((s) => s.currentPageId);
  // the preview has its own current page: buttons navigate here without moving the editor
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const currentPageId = previewPageId && pages.some((p) => p.id === previewPageId) ? previewPageId : editorPageId;
  useEffect(() => { setPreviewPageId(null); }, [editorPageId]);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const pageIdRef = useRef(currentPageId);
  pageIdRef.current = currentPageId;
  const runtimeRef = useRef<ReturnType<typeof createPreviewRuntime> | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = createPreviewRuntime({
      getWasm: () => (iframeRef.current?.contentWindow as unknown as { Module?: { ccall: never } } | null)?.Module as never ?? null,
      getPage: () => pagesRef.current.find((p) => p.id === pageIdRef.current),
      getGraphs: () => useLogicEditorStore.getState().graphs,
      navigate: (name) => {
        const target = pagesRef.current.find((p) => p.name === name);
        if (target) setPreviewPageId(target.id);
      },
    });
  }
  const canvas = useEditorStore((s) => s.canvas);
  const theme = useThemeStore((s) => s.currentTheme);

  // Send UI JSON to iframe
  const sendToWasm = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || status !== 'ready') return;
    const page = pages.find((p) => p.id === currentPageId);
    const used = new Set<string>();
    const walk = (list: LvglComponent[]) => list.forEach((c) => {
      if (c.type === 'img' && c.props.src) used.add(String(c.props.src));
      walk(c.children);
    });
    if (page) walk(page.components);
    const resources = useResourceStore.getState().images.filter((i) => used.has(i.id) || used.has(i.name) || used.has(i.cArrayName));
    encodeImagesForWasm(resources).then((images) => {
      const json = editorStateToJson(pages, currentPageId, canvas, theme, images);
      iframe.contentWindow?.postMessage({ type: 'load-ui', json }, window.location.origin);
      // the UI is built synchronously by the runtime: start timers / graphs once it exists
      window.setTimeout(() => runtimeRef.current?.start(), 60);
    });
  }, [pages, currentPageId, canvas, theme, status]);

  // Listen for lvgl-ready from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // only the preview iframe of this page may talk to the editor
      if (e.source !== iframeRef.current?.contentWindow || e.origin !== window.location.origin) return;
      if (e.data?.type === 'lvgl-ready') {
        setStatus('ready');
      } else if (e.data?.type === 'lvgl-event') {
        runtimeRef.current?.handleEvent(String(e.data.id), String(e.data.name));
      }
    };
    window.addEventListener('message', handler);
    return () => { window.removeEventListener('message', handler); runtimeRef.current?.stop(); };
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
