import { create } from 'zustand';
import type { LinkIssue } from '../../codegen/lisp/validate';

interface State {
  issues: LinkIssue[] | null;
  show: (issues: LinkIssue[]) => void;
  close: () => void;
}

export const useExportIssuesStore = create<State>((set) => ({
  issues: null,
  show: (issues) => set({ issues }),
  close: () => set({ issues: null }),
}));
