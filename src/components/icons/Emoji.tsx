import React from 'react';
import { MAP } from './emojiMap';

interface EmojiProps {
  /** the emoji character, e.g. "💾" */
  c: string;
  size?: number | string;
  className?: string;
}

/** Renders the vector icon for an emoji; unknown characters are shown as text. */
const Emoji: React.FC<EmojiProps> = ({ c, size = '1.15em', className }) => {
  const entry = MAP[c.replace(/️/g, '')];
  if (!entry) return <>{c}</>;
  const Icon = entry.icon;
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      color={entry.color}
      fill={entry.fill ?? 'none'}
      className={`emoji-icon${className ? ' ' + className : ''}`}
      aria-hidden
    />
  );
};

export default Emoji;
