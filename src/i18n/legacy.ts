import { t } from './index';

// Projects saved by the original (Chinese) version keep their default names and node data.
// The Chinese literals are written as escapes so the source stays free of Chinese text.
const LEGACY_NAMES: Record<string, string> = {
  '\u672a\u547d\u540d\u9879\u76ee': 'Untitled project', // default project name
  '\u8fc1\u79fb\u9879\u76ee': 'Migrated project', // project migrated from the old autosave
  '\u65b0\u903b\u8f91\u56fe': 'New logic graph', // default logic graph name
};

const LEGACY_CUSTOM_CODE = '// \u81ea\u5b9a\u4e49\u4ee3\u7801\n';
const CJK = /[\u3001-\u303f\u4e00-\u9fff\uff00-\uffef]/;

export function hasCjk(s: string | undefined): boolean {
  return !!s && CJK.test(s);
}

/** Show a stored name; known legacy default names are shown in the current language. */
export function displayName(name: string): string {
  const english = LEGACY_NAMES[name];
  return english ? t(english) : name;
}

/** Same as displayName, with the legacy "(imported)" suffix of copied logic graphs handled. */
export function displayGraphName(name: string): string {
  const suffix = ' (\u5bfc\u5165)';
  if (name.endsWith(suffix)) return `${displayName(name.slice(0, -suffix.length))} (${t('imported')})`;
  return displayName(name);
}

export function legacyCustomCode(code: unknown): unknown {
  return code === LEGACY_CUSTOM_CODE ? ';; Custom code\n' : code;
}
