import { v4 as uuidv4 } from 'uuid';
import type { Page } from '../../types';

// Maximum history entries for undo/redo
export const MAX_HISTORY = 50;

/** Types that are created with width/height = content */
export const CONTENT_SIZED_TYPES = new Set(['checkbox']);

// Create default page
export function createDefaultPage(): Page {
  return {
    id: uuidv4(),
    name: 'Page 1',
    components: [],
    backgroundColor: '#F5F5F5',
  };
}
