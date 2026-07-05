import { useStore } from 'zustand';

import { useTabsContext } from '../provider/context';
import type { RegisteredTab, TabName } from '../types';

export interface UseTabsResult {
  /** All registered tabs in order. */
  tabs: RegisteredTab[];
  /** The focused tab's name (source of truth: Expo Router). */
  activeName: TabName | null;
  /** The focused tab's index. */
  activeIndex: number;
  /** Switch tab by name via Expo Router. */
  switchTab: (name: TabName) => void;
  /** Move the pager imperatively (also updates the router). */
  setPage: (index: number) => void;
}

/** High-level access to the tab set and navigation controls. */
export function useTabs(): UseTabsResult {
  const { tabStore, switchTab, setPage } = useTabsContext();
  const order = useStore(tabStore, (s) => s.order);
  const tabsMap = useStore(tabStore, (s) => s.tabs);
  const activeName = useStore(tabStore, (s) => s.activeName);
  const activeIndex = useStore(tabStore, (s) => s.activeIndex);

  const tabs = order.map((n) => tabsMap[n]).filter((t): t is RegisteredTab => Boolean(t));
  return { tabs, activeName, activeIndex, switchTab, setPage };
}
