// Emoji -> vector icon table (LVGL Studio AI icon set)
import {
  Clipboard, Trash2, Package, BarChart3, FileText, Image as ImageIcon, Link2, Zap, File, Hourglass, Pencil,
  Smartphone, Hammer, Ruler, Palette, Code, Save, Upload, Download, Settings, Shuffle, Eye, CaseSensitive,
  Clapperboard, Unlock, Lock, FileArchive, Play, Hash, Search, CheckCircle2, XCircle, RefreshCw, ArrowUpLeft,
  ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CheckSquare, Square,
  Menu, Star, Monitor, ChevronLeft, ChevronDown, Undo2, Redo2, HelpCircle, SkipForward, Pause,
  Bug, Timer, ArrowDownUp, Scale, Phone, BookOpen, Calculator, Circle, MessageSquare, Globe, AlertTriangle,
  Sun, Moon, Scissors, X, Check, FolderOpen, Wrench, LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Entry { icon: LucideIcon; color?: string; fill?: string }

// One vector icon (LVGL Studio AI set) per emoji used in the UI texts
export const MAP: Record<string, Entry> = {
  '📋': { icon: Clipboard }, '🗑': { icon: Trash2 }, '📦': { icon: Package }, '📊': { icon: BarChart3 },
  '📝': { icon: FileText }, '🖼': { icon: ImageIcon }, '🔗': { icon: Link2 }, '⚡': { icon: Zap },
  '📄': { icon: File }, '⏳': { icon: Hourglass }, '✏': { icon: Pencil }, '📱': { icon: Smartphone },
  '🔨': { icon: Hammer }, '📐': { icon: Ruler }, '🎨': { icon: Palette }, '💻': { icon: Code },
  '💾': { icon: Save }, '📤': { icon: Upload }, '📥': { icon: Download }, '⚙': { icon: Settings },
  '🔀': { icon: Shuffle }, '👁': { icon: Eye }, '🔤': { icon: CaseSensitive }, '🎬': { icon: Clapperboard },
  '🔓': { icon: Unlock }, '🔒': { icon: Lock }, '🗜': { icon: FileArchive }, '▶': { icon: Play },
  '🔢': { icon: Hash }, '🔍': { icon: Search }, '✅': { icon: CheckCircle2, color: '#22c55e' },
  '❌': { icon: XCircle, color: '#ef4444' }, '🔄': { icon: RefreshCw }, '↖': { icon: ArrowUpLeft },
  '↗': { icon: ArrowUpRight }, '↙': { icon: ArrowDownLeft }, '↘': { icon: ArrowDownRight },
  '⬆': { icon: ArrowUp }, '⬇': { icon: ArrowDown }, '⬅': { icon: ArrowLeft }, '➡': { icon: ArrowRight },
  '↑': { icon: ArrowUp }, '↓': { icon: ArrowDown }, '←': { icon: ArrowLeft }, '→': { icon: ArrowRight },
  '☑': { icon: CheckSquare }, '⏹': { icon: Square, fill: 'currentColor' }, '☰': { icon: Menu },
  '⭐': { icon: Star }, '🖥': { icon: Monitor }, '◀': { icon: ChevronLeft }, '▼': { icon: ChevronDown },
  '▶️': { icon: Play }, '↩': { icon: Undo2 }, '↪': { icon: Redo2 }, '❓': { icon: HelpCircle },
  '⏭': { icon: SkipForward }, '⏸': { icon: Pause }, '🐛': { icon: Bug }, '⏱': { icon: Timer },
  '🔃': { icon: ArrowDownUp }, '⚖': { icon: Scale }, '📞': { icon: Phone }, '📖': { icon: BookOpen },
  '🧮': { icon: Calculator }, '🔴': { icon: Circle, color: '#ef4444', fill: '#ef4444' },
  '🟢': { icon: Circle, color: '#22c55e', fill: '#22c55e' }, '🗨': { icon: MessageSquare },
  '🌐': { icon: Globe }, '⚠': { icon: AlertTriangle }, '☀': { icon: Sun }, '🌙': { icon: Moon },
  '✂': { icon: Scissors }, '✕': { icon: X }, '✓': { icon: Check }, '📁': { icon: FolderOpen }, '📂': { icon: FolderOpen }, '▦': { icon: LayoutGrid }, '🔧': { icon: Wrench },
};

/** Characters that have a vector replacement (variation selectors stripped). */
export const EMOJI_PATTERN = new RegExp(
  '(' + Object.keys(MAP).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\uFE0F?',
  'g'
);

export function hasEmoji(text: string): boolean {
  EMOJI_PATTERN.lastIndex = 0;
  return EMOJI_PATTERN.test(text);
}

