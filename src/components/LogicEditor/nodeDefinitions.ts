// Logic Node Definitions - All available node types

import type { LogicNodeDefinition } from './types';
import { t } from '../../i18n';

// Color scheme for node categories
export const NODE_COLORS = {
  trigger: '#4CAF50',   // Green
  condition: '#FFC107', // Yellow/Amber
  action: '#2196F3',    // Blue
  data: '#9C27B0',      // Purple
  custom: '#607D8B',    // Gray
};

// All node definitions
export const NODE_DEFINITIONS: LogicNodeDefinition[] = [
  // ============ TRIGGER NODES (Green) ============
  {
    type: 'trigger',
    subType: 'event_trigger',
    label: t('Event trigger'),
    description: t('Receives events from components'),
    icon: '⚡',
    color: NODE_COLORS.trigger,
    defaultParams: {
      eventType: 'LV_EVENT_CLICKED',
    },
    inputs: [],
    outputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Event', type: 'any' },
    ],
  },
  {
    type: 'trigger',
    subType: 'timer_trigger',
    label: t('Timer trigger'),
    description: t('Delayed or periodic execution'),
    icon: '⏱️',
    color: NODE_COLORS.trigger,
    defaultParams: {
      mode: 'delay', // 'delay' | 'interval'
      duration: 1000, // ms
    },
    inputs: [
      { name: 'Start', type: 'execution' },
    ],
    outputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Count', type: 'int' },
    ],
  },

  // ============ CONDITION NODES (Yellow) ============
  {
    type: 'condition',
    subType: 'if_else',
    label: 'If/Else',
    description: t('Condition branch'),
    icon: '🔀',
    color: NODE_COLORS.condition,
    defaultParams: {},
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Condition', type: 'bool' },
    ],
    outputs: [
      { name: 'True', type: 'execution' },
      { name: 'False', type: 'execution' },
    ],
  },
  {
    type: 'condition',
    subType: 'switch',
    label: 'Switch',
    description: t('Multi-branch select'),
    icon: '🔃',
    color: NODE_COLORS.condition,
    defaultParams: {
      cases: [0, 1, 2],
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Value', type: 'int' },
    ],
    outputs: [
      { name: 'Case 0', type: 'execution' },
      { name: 'Case 1', type: 'execution' },
      { name: 'Case 2', type: 'execution' },
      { name: 'Default', type: 'execution' },
    ],
  },
  {
    type: 'condition',
    subType: 'compare',
    label: t('Compare'),
    description: t('Compare two values'),
    icon: '⚖️',
    color: NODE_COLORS.condition,
    defaultParams: {
      operator: '==',
    },
    inputs: [
      { name: 'A', type: 'any' },
      { name: 'B', type: 'any' },
    ],
    outputs: [
      { name: 'Result', type: 'bool' },
    ],
  },
  {
    type: 'condition',
    subType: 'logic_op',
    label: t('Logic operation'),
    description: 'AND, OR, NOT',
    icon: '🔗',
    color: NODE_COLORS.condition,
    defaultParams: {
      operator: 'AND',
    },
    inputs: [
      { name: 'A', type: 'bool' },
      { name: 'B', type: 'bool' },
    ],
    outputs: [
      { name: 'Result', type: 'bool' },
    ],
  },

  // ============ ACTION NODES (Blue) ============
  {
    type: 'action',
    subType: 'set_property',
    label: t('Set property'),
    description: t('Modify component property'),
    icon: '🎨',
    color: NODE_COLORS.action,
    defaultParams: {
      targetComponent: '',
      property: '',
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Value', type: 'any' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
    ],
  },
  {
    type: 'action',
    subType: 'navigate_page',
    label: t('Navigate page'),
    description: t('Switch to the specified page'),
    icon: '📄',
    color: NODE_COLORS.action,
    defaultParams: {
      targetPage: '',
      animation: 'none',
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
    ],
  },
  {
    type: 'action',
    subType: 'show_hide',
    label: t('Show/Hide'),
    description: t('Control component visibility'),
    icon: '👁️',
    color: NODE_COLORS.action,
    defaultParams: {
      targetComponent: '',
      action: 'toggle', // 'show' | 'hide' | 'toggle'
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
    ],
  },
  {
    type: 'action',
    subType: 'set_text',
    label: t('Set text'),
    description: t('Modify text content'),
    icon: '📝',
    color: NODE_COLORS.action,
    defaultParams: {
      targetComponent: '',
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Text', type: 'string' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
    ],
  },
  {
    type: 'action',
    subType: 'set_value',
    label: t('Set value'),
    description: t('Modify numeric property'),
    icon: '🔢',
    color: NODE_COLORS.action,
    defaultParams: {
      targetComponent: '',
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Number', type: 'int' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
    ],
  },
  {
    type: 'action',
    subType: 'call_function',
    label: t('Call function'),
    description: t('Call a custom Lisp function'),
    icon: '📞',
    color: NODE_COLORS.action,
    defaultParams: {
      functionName: '',
      arguments: [],
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Arg1', type: 'any' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
      { name: 'Return', type: 'any' },
    ],
  },
  {
    type: 'action',
    subType: 'delay',
    label: t('Delay'),
    description: t('Wait for the specified time'),
    icon: '⏳',
    color: NODE_COLORS.action,
    defaultParams: {
      duration: 1000, // ms
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
    ],
  },

  {
    type: 'action',
    subType: 'for_loop',
    label: t('Repeat'),
    description: t('Run the Body branch several times; "Index" is the counter (0, 1, 2, ...)'),
    icon: '🔁',
    color: NODE_COLORS.action,
    defaultParams: { count: 3 },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Count', type: 'int', defaultValue: 3 },
    ],
    outputs: [
      { name: 'Body', type: 'execution' },
      { name: 'Done', type: 'execution' },
      { name: 'Index', type: 'int' },
    ],
  },
  // ============ DATA NODES (Purple) ============
  {
    type: 'data',
    subType: 'var_read',
    label: t('Read variable'),
    description: t('Read global/local variable'),
    icon: '📖',
    color: NODE_COLORS.data,
    defaultParams: {
      variableId: '',
    },
    inputs: [],
    outputs: [
      { name: 'Value', type: 'any' },
    ],
  },
  {
    type: 'data',
    subType: 'var_write',
    label: t('Write variable'),
    description: t('Set variable value'),
    icon: '✏️',
    color: NODE_COLORS.data,
    defaultParams: {
      variableId: '',
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Value', type: 'any' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
    ],
  },
  {
    type: 'data',
    subType: 'math_op',
    label: t('Math operation'),
    description: t('Add, subtract, multiply, divide, modulo'),
    icon: '🧮',
    color: NODE_COLORS.data,
    defaultParams: {
      operator: '+',
    },
    inputs: [
      { name: 'A', type: 'float' },
      { name: 'B', type: 'float' },
    ],
    outputs: [
      { name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'data',
    subType: 'string_op',
    label: t('String operation'),
    description: t('Concatenate, format'),
    icon: '🔤',
    color: NODE_COLORS.data,
    defaultParams: {
      operation: 'concat',
    },
    inputs: [
      { name: 'A', type: 'string' },
      { name: 'B', type: 'string' },
    ],
    outputs: [
      { name: 'Result', type: 'string' },
    ],
  },
  {
    type: 'data',
    subType: 'get_property',
    label: t('Get property'),
    description: t('Read the component\'s current property value'),
    icon: '🔍',
    color: NODE_COLORS.data,
    defaultParams: {
      targetComponent: '',
      property: '',
    },
    inputs: [],
    outputs: [
      { name: 'Value', type: 'any' },
    ],
  },

  {
    type: 'data',
    subType: 'map_range',
    label: t('Map range'),
    description: t('Scale a value from one range to another (e.g. 0..4095 to 0..100)'),
    icon: '↔️',
    color: NODE_COLORS.data,
    defaultParams: {},
    inputs: [
      { name: 'Value', type: 'float' },
      { name: 'In min', type: 'float', defaultValue: 0 },
      { name: 'In max', type: 'float', defaultValue: 100 },
      { name: 'Out min', type: 'float', defaultValue: 0 },
      { name: 'Out max', type: 'float', defaultValue: 255 },
    ],
    outputs: [{ name: 'Result', type: 'float' }],
  },
  {
    type: 'data',
    subType: 'clamp',
    label: t('Clamp'),
    description: t('Limit a value to a minimum and a maximum'),
    icon: '📏',
    color: NODE_COLORS.data,
    defaultParams: {},
    inputs: [
      { name: 'Value', type: 'float' },
      { name: 'Min', type: 'float', defaultValue: 0 },
      { name: 'Max', type: 'float', defaultValue: 100 },
    ],
    outputs: [{ name: 'Result', type: 'float' }],
  },
  {
    type: 'data',
    subType: 'math_func',
    label: t('Math function'),
    description: t('Absolute value, square root, rounding, sine, cosine'),
    icon: 'ƒ',
    color: NODE_COLORS.data,
    defaultParams: { func: 'abs' },
    inputs: [{ name: 'A', type: 'float' }],
    outputs: [{ name: 'Result', type: 'float' }],
  },
  {
    type: 'data',
    subType: 'to_string',
    label: t('Number to text'),
    description: t('Convert a number to text with a printf-style format, e.g. %.1f'),
    icon: '🔡',
    color: NODE_COLORS.data,
    defaultParams: { format: '%d' },
    inputs: [{ name: 'Value', type: 'float' }],
    outputs: [{ name: 'Result', type: 'string' }],
  },
  {
    type: 'data',
    subType: 'random',
    label: t('Random number'),
    description: t('A random whole number between Min and Max'),
    icon: '🎲',
    color: NODE_COLORS.data,
    defaultParams: {},
    inputs: [
      { name: 'Min', type: 'int', defaultValue: 0 },
      { name: 'Max', type: 'int', defaultValue: 100 },
    ],
    outputs: [{ name: 'Result', type: 'int' }],
  },

  // ============ CUSTOM NODES (Gray) ============
  {
    type: 'custom',
    subType: 'c_code_block',
    label: t('Lisp code block'),
    description: t('Embed custom Lisp code'),
    icon: '💻',
    color: NODE_COLORS.custom,
    defaultParams: {
      code: ';; Custom code\n',
    },
    inputs: [
      { name: 'Exec', type: 'execution' },
      { name: 'Input1', type: 'any' },
    ],
    outputs: [
      { name: 'Done', type: 'execution' },
      { name: 'Output1', type: 'any' },
    ],
  },
];

// Get node definition by subType
export function getNodeDefinition(subType: string): LogicNodeDefinition | undefined {
  return NODE_DEFINITIONS.find(def => def.subType === subType);
}

// Get nodes by category
export function getNodesByCategory(category: string): LogicNodeDefinition[] {
  return NODE_DEFINITIONS.filter(def => def.type === category);
}

// Node categories for palette
export const NODE_CATEGORIES = [
  { id: 'trigger', name: 'Trigger', icon: '⚡', color: NODE_COLORS.trigger },
  { id: 'condition', name: 'Condition', icon: '🔀', color: NODE_COLORS.condition },
  { id: 'action', name: 'Action', icon: '🎬', color: NODE_COLORS.action },
  { id: 'data', name: 'Data', icon: '📊', color: NODE_COLORS.data },
  { id: 'custom', name: 'Custom', icon: '💻', color: NODE_COLORS.custom },
];
