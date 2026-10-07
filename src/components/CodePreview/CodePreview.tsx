import React, { useState, useMemo, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { useLogicEditorStore } from '../LogicEditor';
import { useResourceStore } from '../../resources/resourceStore';
import { useAppStore } from '../../store/appStore';
import { useProjectStore } from '../../store/projectStore';
import { generateCode, getGeneratedFileNames, downloadAsZip } from '../../codegen/lisp';
import type { LispGenOptions, LispFileName } from '../../codegen/lisp';
import { toast } from '../Toast';
import { t } from '../../i18n';
import './CodePreview.css';

const CodePreview: React.FC = () => {
  const { pages } = useEditorStore();
  const { graphs: logicGraphs } = useLogicEditorStore();
  const { currentTheme } = useThemeStore();
  const imageResources = useResourceStore((s) => s.images);
  const fontResources = useResourceStore((s) => s.fonts);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const getProjectConfig = useProjectStore((s) => s.getProjectConfig);
  const [selectedFile, setSelectedFile] = useState<LispFileName>('main.lisp');
  const [isLoading, setIsLoading] = useState(true);
  const [namingStyle, setNamingStyle] = useState<LispGenOptions['namingStyle']>('kebab-case');
  const [projectDefaultFont, setProjectDefaultFont] = useState<string | undefined>();
  const [projectDefaultFontSize, setProjectDefaultFontSize] = useState<number | undefined>();

  useEffect(() => {
    if (!currentProjectId) return;
    getProjectConfig(currentProjectId).then(cfg => {
      if (cfg) {
        setProjectDefaultFont(cfg.lvglConfig.defaultFont);
        setProjectDefaultFontSize(cfg.lvglConfig.defaultFontSize);
      }
    });
  }, [currentProjectId, getProjectConfig]);

  const fileNames = getGeneratedFileNames();

  const codeGenOptions: Partial<LispGenOptions> = useMemo(() => ({
    namingStyle,
  }), [namingStyle]);

  const generatedCode = useMemo(() => {
    try {
      return generateCode(pages, codeGenOptions, logicGraphs, currentTheme, imageResources, fontResources, projectDefaultFont, projectDefaultFontSize);
    } catch {
      console.error('Code generation error');
      return null;
    }
  }, [pages, codeGenOptions, logicGraphs, currentTheme, imageResources, fontResources, projectDefaultFont, projectDefaultFontSize]);

  const currentCode = generatedCode?.[selectedFile] || ';; Code generation failed';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      toast.success(t('Code copied to clipboard'));
    } catch {
      toast.error(t('Copy failed'));
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.split('/').pop() || selectedFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('{0} downloaded', selectedFile));
  };

  const handleDownloadAll = async () => {
    try {
      await downloadAsZip(pages, codeGenOptions, logicGraphs, 'lvgl_ui.zip', currentTheme, imageResources, fontResources, projectDefaultFont, projectDefaultFontSize);
      toast.success(t('All files downloaded'));
    } catch {
      toast.error(t('Download failed'));
    }
  };

  return (
    <div className="code-preview">
      <div className="code-preview-header">
        <div className="code-preview-tabs">
          {fileNames.map(fileName => (
            <button
              key={fileName}
              className={`code-tab ${selectedFile === fileName ? 'active' : ''}`}
              onClick={() => setSelectedFile(fileName)}
            >
              {fileName}
            </button>
          ))}
        </div>
        <div className="code-preview-actions">
          <select
            className="code-version-select"
            value={namingStyle}
            onChange={(e) => setNamingStyle(e.target.value as LispGenOptions['namingStyle'])}
            title={t('Naming style')}
          >
            <option value="kebab-case">kebab-case</option>
            <option value="snake_case">snake_case</option>
          </select>
          <button className="code-action-btn" onClick={handleCopy} title={t('Copy code')}>
            {t('📋 Copy')}
          </button>
          <button className="code-action-btn" onClick={handleDownload} title={t('Download current file')}>
            {t('💾 Download')}
          </button>
          <button className="code-action-btn primary" onClick={handleDownloadAll} title={t('Download all files')}>
            {t('📦 Download all')}
          </button>
        </div>
      </div>
      <div className="code-preview-editor">
        <div className="code-preview-editor-inner">
          <Editor
            width="100%"
            height="100%"
            language="scheme"
            theme="vs-dark"
            value={currentCode}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              automaticLayout: true,
              folding: true,
              renderLineHighlight: 'line',
              scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
            }}
            onMount={() => setIsLoading(false)}
            loading={
              <div className="code-preview-loading">
                <span>{t('Loading editor...')}</span>
              </div>
            }
          />
        </div>
        {isLoading && (
          <div className="code-preview-loading">
            <span>{t('Loading editor...')}</span>
          </div>
        )}
      </div>
      <div className="code-preview-footer">
        <span className="code-stats">
          {currentCode.split('\n').length} {t('lines |')} {new Blob([currentCode]).size} {t('bytes')}
        </span>
      </div>
    </div>
  );
};

export default CodePreview;
