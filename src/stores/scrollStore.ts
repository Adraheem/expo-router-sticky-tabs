import type { SharedValue } from 'react-native-reanimated';
import { createStore, type StoreApi } from 'zustand/vanilla';

import type { TabName } from '../types';

/**
 * Per-tab scroll registration. Each `Tabs.*List` wrapper registers itself so
 * the header driver can read the focused tab's live offset and so a tab can be
 * scrolled programmatically (e.g. scroll-to-top on tab re-press).
 */
export interface ScrollEntry {
  /** The tab's own live scroll offset. Written on every scroll frame. */
  lastOffset: SharedValue<number>;
  /** Imperatively scroll this tab's list to an offset. */
  scrollToOffset: (offset: number, animated?: boolean) => void;
}

export interface ScrollStoreState {
  tabs: Record<TabName, ScrollEntry>;
  register: (name: TabName, entry: ScrollEntry) => void;
  unregister: (name: TabName) => void;
}

export type ScrollStore = StoreApi<ScrollStoreState>;

export function createScrollStore(): ScrollStore {
  return createStore<ScrollStoreState>((set) => ({
    tabs: {},
    register: (name, entry) => set((s) => ({ tabs: { ...s.tabs, [name]: entry } })),
    unregister: (name) =>
      set((s) => {
        if (!s.tabs[name]) return s;
        const tabs = { ...s.tabs };
        delete tabs[name];
        return { tabs };
      }),
  }));
}
