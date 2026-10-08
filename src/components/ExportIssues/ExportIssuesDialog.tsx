import React from 'react';
import { useExportIssuesStore } from './exportIssuesStore';
import { t } from '../../i18n';
import './ExportIssuesDialog.css';

/** Shown instead of the download when logic / events / bindings point at things that no longer exist. */
const ExportIssuesDialog: React.FC = () => {
  const issues = useExportIssuesStore(s => s.issues);
  const close = useExportIssuesStore(s => s.close);
  if (!issues) return null;
  return (
    <div className="export-issues-overlay" onClick={close}>
      <div className="export-issues" onClick={(e) => e.stopPropagation()} role="alertdialog">
        <h3>{t('Export stopped: logic and UI are not connected')}</h3>
        <p>{t('The board would fail with "variable_not_bound". Fix these links (select another component, or delete the node / event) and export again:')}</p>
        <ul>
          {issues.map((i, k) => (
            <li key={k}><b>{i.where}</b>: {i.message}</li>
          ))}
        </ul>
        <button onClick={close}>{t('OK')}</button>
      </div>
    </div>
  );
};

export default ExportIssuesDialog;
