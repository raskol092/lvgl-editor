import Emoji from './components/icons/Emoji';
import { ti } from './i18n/ti';
import { displayName } from './i18n/legacy';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import ComponentPanel from './components/ComponentPanel';
import Canvas from './components/Canvas';
import PropertyEditor from './components/PropertyEditor';
import EventPanel from './components/EventPanel';
import AnimationPanel from './components/AnimationPanel';
import PageManager from './components/PageManager';
import StatusBar from './components/StatusBar';
import AlignToolbar from './components/AlignToolbar';
import HelpPanel from './components/HelpPanel';
import Toast, { useToast } from './components/Toast';
import Modal, { modal } from './components/Modal';
import CodePreview from './components/CodePreview';
import { LogicEditor } from './components/LogicEditor';
import PreviewPanel from './components/Preview';
import WasmPreview from './components/WasmPreview';
import { HierarchyPanel } from './components/HierarchyPanel';
import { ThemeSelector } from './components/ThemeSelector';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ResourcePanel, useResourceStore } from './resources';
import { useLogicEditorStore } from './components/LogicEditor';
import { ProjectListPage } from './components/ProjectManager';
import { ProjectSettings } from './components/ProjectSettings';
import {
  downloadProject,
  loadProjectFromFile,
} from './resources/projectManager';
import { useEditorStore } from './store/editorStore';
import { useAppStore, parseFontSize } from './store/appStore';
import { useProjectStore } from './store/projectStore';
import type { LvglComponent, Page } from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useZipExport } from './hooks/useZipExport';
import { useSplit } from './hooks/useSplit';
import Splitter from './components/Splitter/Splitter';
import { getIconImageResource } from './resources/iconToImage';
import { toast } from './components/Toast';
import { getComponentDefinition } from './utils/componentDefinitions';
import { t } from './i18n';
import ToolIcon from './components/icons/ToolIcon';
import './App.css';

type TabType = 'design' | 'logic' | 'code' | 'preview';

const App: React.FC = () => {
  const { currentView, currentProjectId, showProjectSettings, openProject, goToProjectList, setShowProjectSettings, setLastSaveTime, setDefaultFontSize } = useAppStore();
  const { loadProjectData, getProjectConfig, saveProjectData, exportProject, importProject } = useProjectStore();

  // On mount: check lastOpenProjectId
  useEffect(() => {
    const lastId = localStorage.getItem('lastOpenProjectId');
    if (lastId) {
      // Verify project still exists, then open
      getProjectConfig(lastId).then(cfg => {
        if (cfg) {
          // Load project data into stores
          loadProjectData(lastId).then(({ data, images, fonts }) => {
            useEditorStore.getState().setPages(data.pages as Page[]);
            useEditorStore.getState().setCanvasSize(cfg.display.width, cfg.display.height);
            useResourceStore.getState().importResources({ images, fonts });
            if (data.logicGraphs) {
              useLogicEditorStore.getState().setGraphs(data.logicGraphs);
            }
            // Set default font size from project config
            const fontRes = fonts.find(f => f.cFontName === cfg.lvglConfig.defaultFont);
            setDefaultFontSize(parseFontSize(cfg.lvglConfig.defaultFont, fontRes?.sizes, cfg.lvglConfig.defaultFontSize));
            openProject(lastId);
          }).catch(() => {
            // Failed to load, show project list
          });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast hook must be called unconditionally (before any early return)
  const { messages: toastMessages, removeToast: removeGlobalToast } = useToast();

  if (currentView === 'projectList') {
    return (
      <div className="app">
        <ProjectListPage />
        <Toast messages={toastMessages} onRemove={removeGlobalToast} />
        <Modal />
      </div>
    );
  }

  return <EditorView
    currentProjectId={currentProjectId}
    showProjectSettings={showProjectSettings}
    setShowProjectSettings={setShowProjectSettings}
    goToProjectList={goToProjectList}
    setLastSaveTime={setLastSaveTime}
    setDefaultFontSize={setDefaultFontSize}
    saveProjectData={saveProjectData}
    exportProject={exportProject}
    importProject={importProject}
    loadProjectData={loadProjectData}
    getProjectConfig={getProjectConfig}
    openProject={openProject}
  />;
};

// Separate editor view to keep hooks stable
interface EditorViewProps {
  currentProjectId: string | null;
  showProjectSettings: boolean;
  setShowProjectSettings: (v: boolean) => void;
  goToProjectList: () => void;
  setLastSaveTime: (t: number) => void;
  setDefaultFontSize: (size: number) => void;
  saveProjectData: (id: string, pages: Page[], logicGraphs: import('./components/LogicEditor/types').LogicGraph[], images: import('./resources/types').ImageResource[], fonts: import('./resources/types').FontResource[]) => Promise<void>;
  exportProject: (id: string) => Promise<import('./resources/types').ProjectFile>;
  importProject: (file: import('./resources/types').ProjectFile, name?: string) => Promise<string>;
  loadProjectData: (id: string) => Promise<{ data: { pages: Page[]; logicGraphs: import('./components/LogicEditor/types').LogicGraph[] }; images: import('./resources/types').ImageResource[]; fonts: import('./resources/types').FontResource[] }>;
  getProjectConfig: (id: string) => Promise<import('./store/projectStore').ProjectConfig | undefined>;
  openProject: (id: string) => void;
}

const EditorView: React.FC<EditorViewProps> = ({
  currentProjectId,
  showProjectSettings,
  setShowProjectSettings,
  goToProjectList,
  setLastSaveTime,
  setDefaultFontSize,
  saveProjectData,
  exportProject,
  importProject,
  loadProjectData,
  getProjectConfig,
  openProject,
}) => {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const { addComponent, pages, setPages, setCanvasSize } = useEditorStore();
  const { images, fonts, importResources } = useResourceStore();
  const { messages, removeToast, success, error } = useToast();

  // UI State
  const [showResourcePanel, setShowResourcePanel] = useState(false);

  // Resizable panels (sizes are remembered)
  const leftW = useSplit('left-width', 260, 180, 520, 'x', 1);
  const rightW = useSplit('right-width', 320, 240, 640, 'x', -1);
  const compH = useSplit('components-height', 340, 120, 700, 'y', 1);
  const eventsH = useSplit('events-height', 150, 60, 500, 'y', -1);
  const animH = useSplit('animations-height', 150, 60, 500, 'y', -1);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('design');
  const [previewMode, setPreviewMode] = useState<'simple' | 'wasm'>('simple');
  const [projectName, setProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load project name
  useEffect(() => {
    if (!currentProjectId) return;
    getProjectConfig(currentProjectId).then(cfg => {
      if (cfg) setProjectName(cfg.name);
    });
  }, [currentProjectId, getProjectConfig]);

  // Configure drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const sensors = useSensors(mouseSensor);

  // Track dragging state for overlay
  const [activeDragType, setActiveDragType] = React.useState<string | null>(null);

  // Auto-save to IndexedDB
  useEffect(() => {
    if (!currentProjectId) return;

    const doSave = async () => {
      try {
        const logicGraphs = useLogicEditorStore.getState().graphs;
        await saveProjectData(currentProjectId, pages, logicGraphs, images, fonts);
        setLastSaveTime(Date.now());
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    };

    // Debounce: save shortly after any change, plus periodic interval
    const debounceTimer = setTimeout(doSave, 1000);
    const saveInterval = setInterval(doSave, 30000);

    // Save on beforeunload
    const handleBeforeUnload = () => {
      // Fire-and-forget; IndexedDB transactions may or may not complete
      doSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(debounceTimer);
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentProjectId, pages, images, fonts, saveProjectData, setLastSaveTime]);

  // Project management handlers
  const { download: downloadZip, busy: zipBusy } = useZipExport();

  const handleSaveProject = useCallback(async () => {
    if (!currentProjectId) return;
    try {
      const logicGraphs = useLogicEditorStore.getState().graphs;
      await saveProjectData(currentProjectId, pages, logicGraphs, images, fonts);
      setLastSaveTime(Date.now());
      success(t('Project saved'));
    } catch (err) {
      error(t('Save failed') + ': ' + String(err));
    }
  }, [currentProjectId, pages, images, fonts, saveProjectData, setLastSaveTime, success, error]);

  const handleExportProject = useCallback(async () => {
    if (!currentProjectId) return;
    try {
      // Save first
      const logicGraphs = useLogicEditorStore.getState().graphs;
      await saveProjectData(currentProjectId, pages, logicGraphs, images, fonts);
      const project = await exportProject(currentProjectId);
      downloadProject(project);
      success(t('Project exported'));
    } catch (err) {
      error(t('Export failed') + ': ' + String(err));
    }
  }, [currentProjectId, pages, images, fonts, saveProjectData, exportProject, success, error]);

  const handleImportProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = await loadProjectFromFile(file);
      const id = await importProject(project, project.name);
      const cfg = await getProjectConfig(id);
      if (cfg) {
        const { data, images: imgs, fonts: fnts } = await loadProjectData(id);
        setPages(data.pages as Page[]);
        setCanvasSize(cfg.display.width, cfg.display.height);
        importResources({ images: imgs, fonts: fnts });
        if (data.logicGraphs) {
          useLogicEditorStore.getState().setGraphs(data.logicGraphs);
        }
        const fontRes = fnts.find(f => f.cFontName === cfg.lvglConfig.defaultFont);
        setDefaultFontSize(parseFontSize(cfg.lvglConfig.defaultFont, fontRes?.sizes, cfg.lvglConfig.defaultFontSize));
        openProject(id);
        setProjectName(cfg.name);
      }
      success(t('Project "{0}" imported successfully', project.name));
    } catch (err) {
      error(t('Import failed') + ': ' + String(err));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNewProjectClick = useCallback(async () => {
    if (await modal.confirm(t('Creating a new project returns to the project list; the current project is saved automatically. Continue?'))) {
      // Save current project first
      if (currentProjectId) {
        const logicGraphs = useLogicEditorStore.getState().graphs;
        await saveProjectData(currentProjectId, pages, logicGraphs, images, fonts);
      }
      goToProjectList();
    }
  }, [currentProjectId, pages, images, fonts, saveProjectData, goToProjectList]);

  const handleBackToList = useCallback(async () => {
    // Save current project first
    if (currentProjectId) {
      try {
        const logicGraphs = useLogicEditorStore.getState().graphs;
        await saveProjectData(currentProjectId, pages, logicGraphs, images, fonts);
      } catch {
        // ignore
      }
    }
    goToProjectList();
  }, [currentProjectId, pages, images, fonts, saveProjectData, goToProjectList]);

  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleToggleHelp = () => setShowHelpPanel(prev => !prev);
    const handleSaveProjectEvt = () => handleSaveProject();
    const handleOpenProject = () => handleImportProject();
    const handleNewProject = () => handleNewProjectClick();

    window.addEventListener('toggle-help-panel', handleToggleHelp);
    window.addEventListener('save-project', handleSaveProjectEvt);
    window.addEventListener('open-project', handleOpenProject);
    window.addEventListener('new-project', handleNewProject);

    return () => {
      window.removeEventListener('toggle-help-panel', handleToggleHelp);
      window.removeEventListener('save-project', handleSaveProjectEvt);
      window.removeEventListener('open-project', handleOpenProject);
      window.removeEventListener('new-project', handleNewProject);
    };
  }, [handleSaveProject, handleNewProjectClick]);

  const [activeDragIcon, setActiveDragIcon] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data?.type === 'new-component') {
      setActiveDragType(data.componentType);
    } else if (data?.type === 'new-icon') {
      setActiveDragIcon(data.path as string);
    } else if (data?.type === 'new-image') {
      setActiveDragIcon(null);
      setActiveDragType('img');
    }
  }, []);

  // Track last mouse position for accurate drop placement
  const lastMousePos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  /** Where a new component of the given size lands when dropped at the pointer (null: not over the canvas). */
  const resolveDrop = useCallback((width: number, height: number) => {
    const canvasElement = document.querySelector('.canvas');
    if (!canvasElement) return null;
    const rect = canvasElement.getBoundingClientRect();
    const currentCanvas = useEditorStore.getState().canvas;

    // Use tracked mouse position — immune to CSS transform issues with dnd-kit delta
    const dropX = (lastMousePos.current.x - rect.left) / currentCanvas.zoom;
    const dropY = (lastMousePos.current.y - rect.top) / currentCanvas.zoom;

    const state = useEditorStore.getState();
    const currentPage = state.pages.find(p => p.id === state.currentPageId);
    const components = currentPage?.components || [];

    type HitResult = { comp: LvglComponent; absX: number; absY: number } | null;

    const findDeepestContainer = (comps: LvglComponent[], offsetX: number, offsetY: number): HitResult => {
      // Iterate in reverse so top-most (last rendered) components are checked first
      for (let i = comps.length - 1; i >= 0; i--) {
        const comp = comps[i];
        const absX = comp.x + offsetX;
        const absY = comp.y + offsetY;
        if (dropX >= absX && dropX <= absX + comp.width && dropY >= absY && dropY <= absY + comp.height) {
          const def = getComponentDefinition(comp.type);
          if (def?.isContainer) {
            const deeper = findDeepestContainer(comp.children, absX, absY);
            return deeper || { comp, absX, absY };
          }
        }
      }
      return null;
    };

    const container = findDeepestContainer(components, 0, 0);
    let x = dropX;
    let y = dropY;
    let parentId: string | null = null;
    if (container) {
      x = dropX - container.absX;
      y = dropY - container.absY;
      parentId = container.comp.id;
    }

    // Center the component on the drop point
    x -= width / 2;
    y -= height / 2;

    if (container) {
      x = Math.max(0, Math.min(x, container.comp.width - (width || 50)));
      y = Math.max(0, Math.min(y, container.comp.height - (height || 50)));
    } else {
      x = Math.max(0, Math.min(x, currentCanvas.width - 50));
      y = Math.max(0, Math.min(y, currentCanvas.height - 50));
    }
    return { x, y, parentId };
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragType(null);
    setActiveDragIcon(null);
    const data = active.data.current;
    if (over?.id !== 'canvas-drop-area' || !data) return;

    if (data.type === 'new-component') {
      const definition = getComponentDefinition(data.componentType);
      const drop = resolveDrop(definition?.defaultWidth ?? 100, definition?.defaultHeight ?? 50);
      if (drop) addComponent(data.componentType, drop.x, drop.y, drop.parentId);
      return;
    }

    // Resources dragged from the resource manager become image components
    const placeImage = (imageId: string, w: number, h: number) => {
      const drop = resolveDrop(w, h);
      if (!drop) return;
      const id = addComponent('img', drop.x, drop.y, drop.parentId);
      const store = useEditorStore.getState();
      const comp = store.getComponentById(id);
      store.updateComponent(id, { width: w, height: h, props: { ...(comp?.props ?? {}), src: imageId } });
    };

    if (data.type === 'new-image') {
      const scale = Math.min(1, 160 / Math.max(data.width, data.height));
      placeImage(data.imageId, Math.max(8, Math.round(data.width * scale)), Math.max(8, Math.round(data.height * scale)));
    } else if (data.type === 'new-icon') {
      getIconImageResource(data.iconName as string, data.path as string)
        .then(img => placeImage(img.id, 48, 48))
        .catch(() => toast.error(t('Failed to add icon')));
    }
  }, [addComponent, resolveDrop]);

  // Render drag overlay
  const renderDragOverlay = () => {
    if (activeDragIcon) {
      return (
        <div className="drag-overlay-item">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d={activeDragIcon} fill="currentColor" /></svg>
        </div>
      );
    }
    if (!activeDragType) return null;

    const definition = getComponentDefinition(activeDragType);
    if (!definition) return null;

    return (
      <div className="drag-overlay-item">
        <span className="drag-overlay-icon"><ToolIcon name={definition.type} size={18} fallback={definition.icon} /></span>
        <span className="drag-overlay-name">{definition.name}</span>
      </div>
    );
  };

  // Render main content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case 'design':
        return (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="app-body">
              <div className="left-panel" style={{ width: leftW.size }}>
                <div className="panel-slot" style={{ height: compH.size }}>
                  <ComponentPanel />
                </div>
                <Splitter orientation="horizontal" onPointerDown={compH.onPointerDown} onReset={compH.reset} />
                <div className="panel-slot grow">
                  <HierarchyPanel />
                </div>
              </div>
              <Splitter orientation="vertical" onPointerDown={leftW.onPointerDown} onReset={leftW.reset} />
              <div className="canvas-area">
                <AlignToolbar />
                <Canvas />
                <PageManager />
              </div>
              <Splitter orientation="vertical" onPointerDown={rightW.onPointerDown} onReset={rightW.reset} />
              <div className="right-panel" style={{ width: rightW.size }}>
                <div className="panel-slot grow">
                  <PropertyEditor />
                </div>
                <Splitter orientation="horizontal" onPointerDown={eventsH.onPointerDown} onReset={eventsH.reset} />
                <div className="panel-slot" style={{ height: eventsH.size }}>
                  <EventPanel />
                </div>
                <Splitter orientation="horizontal" onPointerDown={animH.onPointerDown} onReset={animH.reset} />
                <div className="panel-slot" style={{ height: animH.size }}>
                  <AnimationPanel />
                </div>
              </div>
              {showResourcePanel && (
                <div className="resource-panel-container">
                  <ResourcePanel />
                </div>
              )}
            </div>
            <DragOverlay dropAnimation={null}>
              {renderDragOverlay()}
            </DragOverlay>
          </DndContext>
        );

      case 'logic':
        return (
          <div className="app-body full-panel">
            <LogicEditor />
          </div>
        );

      case 'code':
        return (
          <div className="app-body full-panel">
            <CodePreview />
          </div>
        );

      case 'preview':
        return (
          <div className="app-body full-panel">
            <div className="preview-sub-tabs">
              <button
                className={`preview-sub-tab ${previewMode === 'simple' ? 'active' : ''}`}
                onClick={() => setPreviewMode('simple')}
              >
                {ti('📱 Simple preview')}
              </button>
              <button
                className={`preview-sub-tab ${previewMode === 'wasm' ? 'active' : ''}`}
                onClick={() => setPreviewMode('wasm')}
              >
                {ti('🖥️ LVGL preview')}
              </button>
            </div>
            <div className="preview-sub-content">
              {previewMode === 'simple' ? <PreviewPanel /> : <WasmPreview />}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <div className="app-logo">
          <button className="back-to-list-btn" onClick={handleBackToList} title={t('Back to project list')}>
            <Emoji c="◀" />
          </button>
          <span className="logo-icon"><Emoji c="📐" /></span>
          <span className="logo-text project-name-display">{projectName ? displayName(projectName) : 'LVGL UI Editor'}</span>
        </div>

        {/* Main tabs */}
        <div className="app-tabs">
          <button
            className={`tab-btn ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => setActiveTab('design')}
          >
            {ti('🎨 Design')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'logic' ? 'active' : ''}`}
            onClick={() => setActiveTab('logic')}
          >
            {ti('🔗 Logic')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            {ti('💻 Code')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            {ti('📱 Preview')}
          </button>
        </div>

        <div className="app-toolbar">
          <ToolbarButton icon="💾" label={t('Save')} onClick={handleSaveProject} shortcut="Ctrl+S" />
          <ToolbarButton icon="📤" label={t('Export')} onClick={handleExportProject} />
          <ToolbarButton icon="📥" label={t('Import')} onClick={handleImportProject} />
          <ToolbarButton icon="🗜️" label={zipBusy ? t('Exporting...') : t('Download ZIP')} onClick={downloadZip} disabled={zipBusy} />
          <div className="toolbar-divider" />
          <ToolbarButton icon="↩️" label={t('Undo')} onClick={() => useEditorStore.getState().undo()} shortcut="Ctrl+Z" />
          <ToolbarButton icon="↪️" label={t('Redo')} onClick={() => useEditorStore.getState().redo()} shortcut="Ctrl+Y" />
          <div className="toolbar-divider" />
          <ToolbarButton
            icon="📦"
            label={t('Resources')}
            onClick={() => setShowResourcePanel(!showResourcePanel)}
            active={showResourcePanel}
          />
          <ToolbarButton
            icon="⚙️"
            label={t('Settings')}
            onClick={() => setShowProjectSettings(true)}
          />
          <div className="toolbar-divider" />
          <LanguageSwitcher />
          <ThemeSelector />
          <div className="toolbar-divider" />
          <ToolbarButton
            icon="❓"
            label={t('Help')}
            onClick={() => setShowHelpPanel(true)}
            shortcut="F1"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.lvgl.json"
          onChange={handleFileLoad}
          style={{ display: 'none' }}
        />
      </div>

      {renderMainContent()}

      <StatusBar />

      {/* Help Panel */}
      <HelpPanel isOpen={showHelpPanel} onClose={() => setShowHelpPanel(false)} />

      {/* Project Settings */}
      {showProjectSettings && <ProjectSettings />}

      {/* Toast notifications */}
      <Toast messages={messages} onRemove={removeToast} />

      {/* Global modal dialogs */}
      <Modal />
    </div>
  );
};

// Toolbar button component
interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, label, onClick, disabled, active, shortcut }) => (
  <button
    className={`toolbar-button ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`}
    onClick={onClick}
    disabled={disabled}
    title={shortcut ? `${label} (${shortcut})` : label}
  >
    <span className="toolbar-icon"><Emoji c={icon} /></span>
    <span className="toolbar-label">{label}</span>
  </button>
);

export default App;
