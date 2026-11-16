// Bread Modular Original content keeps its existing URLs wherever they don't
// clash with the Eurorack version. Only the home page and module pages live
// under /original. New Eurorack docs must use different category names.
export const ORIGINAL_DOC_CATEGORIES = [
  'getting-started',
  'patch-ideas',
  'technical-details',
  '16bit',
  '8bit',
  '32bit',
];

const ORIGINAL_PREFIXES = ['/original', '/courses', '/launch-day', '/ui'];

function hasPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isOriginalDocsPath(pathname: string): boolean {
  return ORIGINAL_DOC_CATEGORIES.some(category => hasPrefix(pathname, `/docs/${category}`));
}

export function isOriginalPath(pathname: string): boolean {
  return ORIGINAL_PREFIXES.some(prefix => hasPrefix(pathname, prefix)) || isOriginalDocsPath(pathname);
}
