export type ModuleSize = 'base' | 'double' | 'triple';

// Helper function to get placeholder image based on module size
export function getPlaceholderImage(size: ModuleSize): string {
  return `/images/modules/placeholder-${size}.svg`;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  image: string;
  size: ModuleSize;
  featured?: boolean;
}

export const modules: Module[] = [
  {
    id: 'starter-kit',
    title: 'Starter Kit',
    description: 'Everything you need to get started with Bread Modular',
    image: getPlaceholderImage('triple'),
    size: 'triple',
    featured: true
  },
  {
    id: 'base-module',
    title: 'Base Module',
    description: 'The foundation of your modular setup',
    image: getPlaceholderImage('double'),
    size: 'double'
  },
  {
    id: 'kick',
    title: 'Kick',
    description: 'Analog kick drum module',
    image: getPlaceholderImage('base'),
    size: 'base'
  },
  {
    id: 'midi',
    title: 'MIDI',
    description: 'USB-C MIDI interface module',
    image: getPlaceholderImage('base'),
    size: 'base'
  }
]; 