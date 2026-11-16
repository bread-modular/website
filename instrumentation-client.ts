import { NAVIGATION_START } from '@/lib/navigation-events';

// Tells the loading screen that a page change has started (see NavigationLoader)
export function onRouterTransitionStart(url: string) {
  window.dispatchEvent(new CustomEvent(NAVIGATION_START, { detail: url }));
}
