import Emoji from '../icons/Emoji';
import { ti } from '../../i18n/ti';
import React, { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { DisplayConfig, LvglConfig } from '../../store/projectStore';
import { useAppStore } from '../../store/appStore';
import { useEditorStore } from '../../store/editorStore';
import { useResourceStore } from '../../resources';
import { useLogicEditorStore } from '../LogicEditor';
import { loadProjectFromFile, loadAutoSavedProject, clearAutoSave } from '../../resources/projectManager';
import { modal } from '../Modal';
import { toast } from '../Toast';
import ProjectCard from './ProjectCard';
import NewProjectDialog from './NewProjectDialog';
import type { Page } from '../../types';
import { t } from '../../i18n';
import { LanguageSwitcher } from '../LanguageSwitcher';
import './ProjectListPage.css';

const ProjectListPage: React.FC = () => {
  const { projects, loading, init, createProject, deleteProject, importProject, loadProjectData, getProjectConfig } = useProjectStore();
  const { openProject } = useAppStore();
  const { setPages, setCanvasSize } = useEditorStore();
  const { importResources } = useResourceStore();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [migrationChecked, setMigrationChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize store
  useEffect(() => {
    init();
  }, [init]);

  // Check for legacy localStorage data migration
  useEffect(() => {
    if (migrationChecked) return;
    setMigrationChecked(true);

    const autoSaved = loadAutoSavedProject();
    if (autoSaved && autoSaved.pages && autoSaved.pages.length > 0) {
      modal.confirm(t('Legacy auto-saved data found. Import it as a new project?')).then(async (yes) => {
        if (yes) {
          try {
            const id = await importProject(autoSaved, autoSaved.name || t('Migrated project'));
            clearAutoSave();
            toast.success(t('Legacy data imported as a new project'));
            handleOpenProject(id);
          } catch (err) {
            toast.error(t('Import failed') + ': ' + String(err));
          }
        } else {
          clearAutoSave();
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenProject = async (id: string) => {
    try {
      const config = await getProjectConfig(id);
      if (!config) { toast.error(t('Project does not exist')); return; }

      const { data, images, fonts } = await loadProjectData(id);
      setPages(data.pages as Page[]);
      setCanvasSize(config.display.width, config.display.height);
      importResources({ images, fonts });
      if (data.logicGraphs) {
        useLogicEditorStore.getState().setGraphs(data.logicGraphs);
      }
      openProject(id);
    } catch (err) {
      toast.error(t('Failed to open project') + ': ' + String(err));
    }
  };

  const handleCreate = async (name: string, display: DisplayConfig, lvglConfig: LvglConfig) => {
    try {
      const id = await createProject(name, display, lvglConfig);
      setShowNewDialog(false);
      await handleOpenProject(id);
    } catch (err) {
      console.error('Failed to create project:', err);
      toast.error(t('Failed to create project') + ': ' + String(err));
    }
  };

  const handleDelete = async (id: string) => {
    const config = await getProjectConfig(id);
    const confirmed = await modal.confirm(t('Delete project "{0}"? This cannot be undone.', config?.name || id));
    if (confirmed) {
      await deleteProject(id);
      toast.success(t('Project deleted'));
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = await loadProjectFromFile(file);
      const id = await importProject(project, project.name);
      toast.success(t('Project "{0}" imported successfully', project.name));
      handleOpenProject(id);
    } catch (err) {
      toast.error(t('Import failed') + ': ' + String(err));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = search
    ? projects.filter(p => p.config.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="project-list-page">
      <div className="plp-header">
        <div className="plp-logo">
          <span className="plp-logo-icon"><Emoji c="📐" /></span>
          <span className="plp-logo-text">LVGL UI Editor</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="plp-content">
        <div className="plp-toolbar">
          <input
            className="plp-search"
            type="text"
            placeholder={t('Search projects...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="plp-actions">
            <button className="plp-btn plp-btn-primary" onClick={() => setShowNewDialog(true)}>
              {t('+ New project')}
            </button>
            <button className="plp-btn" onClick={() => fileInputRef.current?.click()}>
              {ti('📂 Import project')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="plp-empty">{t('Loading...')}</div>
        ) : filtered.length === 0 ? (
          <div className="plp-empty">
            {search ? t('No matching projects') : t('No projects yet. Click "New project" to start')}
          </div>
        ) : (
          <div className="plp-grid">
            {filtered.map(item => (
              <ProjectCard
                key={item.config.id}
                item={item}
                onOpen={handleOpenProject}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.lvgl.json"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />

      {showNewDialog && (
        <NewProjectDialog
          onClose={() => setShowNewDialog(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default ProjectListPage;
