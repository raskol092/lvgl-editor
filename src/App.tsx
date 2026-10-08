import React, { useEffect } from 'react';
import Toast, { useToast } from './components/Toast';
import Modal from './components/Modal';
import { useResourceStore } from './resources';
import { useLogicEditorStore } from './components/LogicEditor';
import { ProjectListPage } from './components/ProjectManager';
import { useEditorStore } from './store/editorStore';
import { useAppStore, parseFontSize } from './store/appStore';
import { useProjectStore } from './store/projectStore';
import type { Page } from './types';
import { EditorView } from './EditorView';
import './App.css';

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

export default App;
