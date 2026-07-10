import { createContext, useContext } from 'react';

import { useOptionalTabsContext } from './context';
import type { TabName } from '../types';

/** Identity of the tab a subtree belongs to. Provided per pager page. */
export interface TabScreenContextValue {
  name: TabName;
  index: number;
}

export const TabScreenContext = createContext<TabScreenContextValue | null>(null);

/**
 * Identifies which tab the calling component renders inside. Used by the list
 * wrappers to bind their scroll sync to the correct tab.
 */
export function useTabScreen(): TabScreenContextValue {
  const ctx = useContext(TabScreenContext);
  if (!ctx) {
    throw new Error(
      'expo-router-sticky-tabs: <Tabs.ScrollView /> (and the other list wrappers) must be rendered inside a tab screen.'
    );
  }
  return ctx;
}

export function useOptionalTabScreen(): TabScreenContextValue | null {
  return useContext(TabScreenContext);
}

/**
 * `true` only when both the `<Tabs>` provider **and** a tab-screen context are
 * present — i.e. scroll sync can actually run. The list wrappers use this to
 * decide whether to render their synced variant or fall back to the plain
 * primitive when used outside `<Tabs>`. Both hooks are called unconditionally so
 * the Rules of Hooks hold regardless of the result.
 */
export function useIsInsideTabScreen(): boolean {
  const hasProvider = useOptionalTabsContext() != null;
  const hasScreen = useOptionalTabScreen() != null;
  return hasProvider && hasScreen;
}
