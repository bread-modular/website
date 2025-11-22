/**
 * Configuration for displaying modules on the modules page.
 * This allows customizing titles, descriptions, and ordering
 * independently from the module metadata files.
 * 
 * Later, this can be extended to show different firmwares
 * as separate modules (e.g., multiple 8bit firmwares, multiple 16bit firmwares).
 */
export interface ModuleDisplayConfig {
  /** Module ID (matches the module file name without prefix) */
  moduleId: string;
  /** Category for grouping modules */
  category: 'Featured' | 'IO' | 'Sound Sources' | 'Control' | 'Effects' | 'Audio Computers' | 'Others';
  /** Override title (optional - uses module metadata if not provided) */
  title?: string;
  /** Override description (optional - uses module metadata if not provided) */
  description?: string;
  /** Override image (optional - uses module metadata if not provided) */
  image?: string;
  /** Override featured status (optional - uses module metadata if not provided) */
  featured?: boolean;
  /** Override size (optional - uses module metadata if not provided) */
  size?: 'base' | 'double' | 'triple';
}

/**
 * Module display configuration.
 * Modules are displayed in the order they appear in this array.
 */
export const modulesDisplayConfig: ModuleDisplayConfig[] = [
  // Featured
  { moduleId: 'starter-kit', category: 'Featured' },
  
  // IO
  {
    moduleId: 'base', 
    category: 'IO', 
    description: "Base for 12 modules with line/headphones out and USB-C power."
  },
  { moduleId: 'midi', category: 'IO' },
  { moduleId: 'line_in', category: 'IO' },
  { moduleId: 'line_out', category: 'IO' },
  { moduleId: 'head', category: 'IO' },
  
  // Sound Sources
  { moduleId: 'noise', category: 'Sound Sources' },
  { moduleId: 'hihat', category: 'Sound Sources' },
  { moduleId: 'mco', category: 'Sound Sources' },
  { moduleId: 'wave', category: 'Sound Sources' },
  { 
    moduleId: '8bit', category: 'Sound Sources',
    title: 'Supersaw',
    description: 'A MIDI controllable supersaw oscillator as firmware for 8bit module.'
  },
  {
    moduleId: '16bit', category: 'Sound Sources',
    title: 'Polysynth',
    description: 'A 9-voice polysynth with a moog-like filter as a firmware for 16bit module.'
  },
  {
    moduleId: '16bit', category: 'Sound Sources',
    title: 'Drum Sampler',
    description: 'A 12-voice drum sampler with effects as a firmware for 16bit module.'
  },
  
  // Control
  { moduleId: 'env', category: 'Control' },
  { 
    moduleId: '8bit', category: 'Control',
    title: 'LFO',
    description: 'An LFO as firmware for 8bit module.'
  },
  { moduleId: 'v2ca', category: 'Control' },
  { moduleId: 'mcc', category: 'Control' },
  { moduleId: 'imix', category: 'Control' },
  { moduleId: '4mix', category: 'Control' },
  
  // Effects
  { moduleId: 'drive', category: 'Effects' },
  { moduleId: 'svf', category: 'Effects' },
  { moduleId: 'low', category: 'Effects' },
  {
    moduleId: '32bit', category: 'Effects',
    title: 'FX Rack',
    description: 'Delay/Reverb & Comb Filter as a firmware for 32bit.'
  },
  
  // Audio Computers
  { moduleId: '8bit', category: 'Audio Computers' },
  { moduleId: '16bit', category: 'Audio Computers' },
  { moduleId: '32bit', category: 'Audio Computers' },
  
  // Others
  { moduleId: 'lab-kit', category: 'Others' },
  { moduleId: 'updi-programmer', category: 'Others' },
  { moduleId: 'travel-case', category: 'Others' },
];

/**
 * Category display order.
 * Categories are displayed in the order they appear in this array.
 */
export const categoryOrder: ModuleDisplayConfig['category'][] = [
  'Featured',
  'IO',
  'Sound Sources',
  'Control',
  'Effects',
  'Audio Computers',
  'Others',
];
