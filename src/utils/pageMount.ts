import type { RegisteredTab } from '../types';

/**
 * Whether the pager mounts a tab's page. Laziness comes from the tab's
 * `<Tabs.Screen lazy>` declaration, not the router descriptor: the library
 * never passes per-screen options to Expo Router, and from Expo Router 58 the
 * router-level `lazy` option has no effect. A tab the tab store has not
 * registered yet (the first render) is treated as lazy. A focused or
 * previously revealed page always renders.
 */
export function shouldRenderPage(
  tab: Pick<RegisteredTab, 'lazy'> | undefined,
  page: { isFocused: boolean; loaded: boolean }
): boolean {
  return !(tab?.lazy ?? true) || page.isFocused || page.loaded;
}
