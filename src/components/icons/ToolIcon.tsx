import React from 'react';
import {
  MousePointerClick, Type, Sliders, CheckSquare, CircleDashed, Box, BarChart3, Image as ImageIcon,
  Loader, Table, Calendar, AppWindow, LayoutDashboard, Files, ListFilter, AlignLeft, ToggleRight,
  RectangleHorizontal, Activity, Zap, Timer, GitBranch, GitFork, Scale, Link2, SlidersHorizontal,
  Navigation, Eye, Hash, SquareFunction, Hourglass, BookOpen, PenLine, Calculator, CaseSensitive,
  Lightbulb, ChevronsUpDown, Plus, Keyboard, List, MessageSquare, Gauge, Search, CodeXml, Clapperboard, Database, Code, Package, FolderOpen, Monitor, Square,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Widget icons follow LVGL Studio AI; logic-node icons are drawn from the same lucide set.
const ICONS: Record<string, LucideIcon> = {
  // widgets
  btn: MousePointerClick, label: Type, img: ImageIcon, line: Activity, textarea: AlignLeft,
  dropdown: ListFilter, checkbox: CheckSquare, switch: ToggleRight, slider: Sliders,
  obj: Box, container: Box, panel: Box, tabview: Files, tileview: LayoutDashboard,
  win: AppWindow, window: AppWindow, led: Lightbulb, roller: ChevronsUpDown, spinbox: Plus, keyboard: Keyboard, list: List, msgbox: MessageSquare, scale: Gauge, bar: RectangleHorizontal, arc: CircleDashed,
  spinner: Loader, chart: BarChart3, table: Table, calendar: Calendar,
  // widget categories
  'cat:basic': Package, 'cat:input': PenLine, 'cat:container': FolderOpen, 'cat:display': Monitor,
  // logic nodes
  event_trigger: Zap, timer_trigger: Timer, if_else: GitBranch, switch_node: GitFork,
  compare: Scale, logic_op: Link2, set_property: SlidersHorizontal, navigate_page: Navigation,
  show_hide: Eye, set_text: Type, set_value: Hash, call_function: SquareFunction,
  delay: Hourglass, var_read: BookOpen, var_write: PenLine, math_op: Calculator,
  string_op: CaseSensitive, get_property: Search, c_code_block: CodeXml,
  // logic categories
  'cat:trigger': Zap, 'cat:condition': GitBranch, 'cat:action': Clapperboard,
  'cat:data': Database, 'cat:custom': Code,
};

interface ToolIconProps {
  /** Widget type, node subType, or `cat:<categoryId>` */
  name: string;
  size?: number;
  /** Shown when no vector icon exists for `name` */
  fallback?: React.ReactNode;
  className?: string;
}

const ToolIcon: React.FC<ToolIconProps> = ({ name, size = 18, fallback, className }) => {
  const Icon = ICONS[name];
  if (!Icon) return <>{fallback ?? <Square size={size} className={className} />}</>;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden />;
};

export default ToolIcon;
