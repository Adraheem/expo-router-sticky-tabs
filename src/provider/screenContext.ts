import { createContext, useContext } from 'react';

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
