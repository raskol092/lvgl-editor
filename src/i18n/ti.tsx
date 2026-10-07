import React from 'react';
import { t } from './index';
import Emoji from '../components/icons/Emoji';
import { EMOJI_PATTERN } from '../components/icons/emojiMap';

/** Text with its emoji replaced by vector icons. */
export function richText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  EMOJI_PATTERN.lastIndex = 0;
  for (let m = EMOJI_PATTERN.exec(text); m; m = EMOJI_PATTERN.exec(text)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<Emoji key={key++} c={m[1]} />);
    last = m.index + m[0].length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Translate and show emoji as vector icons (for JSX children). */
export function ti(key: string, ...args: Array<string | number>): React.ReactNode {
  return richText(t(key, ...args));
}

/** Translate and drop emoji (for attributes and <option> texts, which cannot hold elements). */
export function tp(key: string, ...args: Array<string | number>): string {
  EMOJI_PATTERN.lastIndex = 0;
  return t(key, ...args).replace(EMOJI_PATTERN, '').replace(/\s{2,}/g, ' ').trim();
}
