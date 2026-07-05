import { createContext, useContext } from 'react';

import type { HeaderStore } from '../stores/headerStore';
import type { PagerStore } from '../stores/pagerStore';
import type { ScrollStore } from '../stores/scrollStore';
import type { TabStore } from '../stores/tabStore';
import type { TabName, TabsSharedValues } from '../types';

/**
 * The value handed to every descendant of `<Tabs />`. Every field is a stable
 * reference created once per provider instance, so the context value never
 * changes identity and consumers never re-render because of it. Reactive reads
 * happen through the individual zustand stores; animated reads happen through
 * the shared values.
 */
export interface TabsContextValue {
  tabStore: TabStore;
  pagerStore: PagerStore;
  headerStore: HeaderStore;
  scrollStore: ScrollStore;
  shared: TabsSharedValues;
  /** Switch to a tab by name — delegates to Expo Router (source of truth). */
  switchTab: (name: TabName) => void;
  /** Imperatively move the pager to an index without a router round-trip. */
  setPage: (index: number) => void;
  /** Register the pager's imperative `setPage`, called by `<Tabs.Slot />`. */
  registerPager: (setPage: (index: number) => void) => void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(
      'expo-router-sticky-tabs: this component must be rendered inside <Tabs> / <Tabs.Provider>.'
    );
  }
  return ctx;
}

/** Non-throwing variant used by components that may render outside a provider. */
export function useOptionalTabsContext(): TabsContextValue | null {
  return useContext(TabsContext);
}
