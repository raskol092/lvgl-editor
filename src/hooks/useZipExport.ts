import { useCallback, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useThemeStore } from '../store/themeStore';
import { useAppStore } from '../store/appStore';
import { useProjectStore } from '../store/projectStore';
import { useResourceStore } from '../resources/resourceStore';
import { useLogicEditorStore } from '../components/LogicEditor';
import { downloadAsZip } from '../codegen/lisp';
import { validateLinks } from '../codegen/lisp/validate';
import { useExportIssuesStore } from '../components/ExportIssues/exportIssuesStore';
import type { LispGenOptions } from '../codegen/lisp';
import { toast } from '../components/Toast';
import { t } from '../i18n';

/** Download the generated project (main.lisp, ui/, assets/, font/) as one ZIP. */
export function useZipExport(options: Partial<LispGenOptions> = {}) {
  const [busy, setBusy] = useState(false);

  const download = useCallback(async () => {
    setBusy(true);
    try {
      const { pages } = useEditorStore.getState();
      const { graphs } = useLogicEditorStore.getState();
      const { currentTheme } = useThemeStore.getState();
      const { images, fonts } = useResourceStore.getState();
      const issues = validateLinks(pages, graphs);
      if (issues.length > 0) {
        useExportIssuesStore.getState().show(issues);
        return;
      }
      const { currentProjectId } = useAppStore.getState();
      const cfg = currentProjectId ? await useProjectStore.getState().getProjectConfig(currentProjectId) : undefined;
      const raw = (cfg?.name || '').replace(/[^\p{L}\p{N}._-]+/gu, '_');
      const name = /[A-Za-z0-9]/.test(raw) ? raw : 'lvgl_ui';
      await downloadAsZip(
        pages, options, graphs, `${name}.zip`, currentTheme, images, fonts,
        cfg?.lvglConfig?.defaultFont, cfg?.lvglConfig?.defaultFontSize
      );
      toast.success(t('ZIP downloaded'));
    } catch (err) {
      console.error('ZIP export failed:', err);
      toast.error(t('Download failed'));
    } finally {
      setBusy(false);
    }
  }, [options]);

  return { download, busy };
}
