import { useStore } from 'zustand';

import { useTabsContext } from '../provider/context';
import type { RegisteredTab, TabName } from '../types';

export interface UseCurrentTabResult {
  tab: RegisteredTab | undefined;
  name: TabName | null;
  index: number;
}

/** The currently focused tab and its metadata. */
export function useCurrentTab(): UseCurrentTabResult {
  const { tabStore } = useTabsContext();
  const name = useStore(tabStore, (s) => s.activeName);
  const index = useStore(tabStore, (s) => s.activeIndex);
  const tab = useStore(tabStore, (s) => (s.activeName ? s.tabs[s.activeName] : undefined));
  return { tab, name, index };
}
