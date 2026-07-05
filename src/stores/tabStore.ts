import { createStore, type StoreApi } from 'zustand/vanilla';

import type { RegisteredTab, TabName } from '../types';

export interface TabStoreState {
  /** Ordered list of tab names, matching the router route order. */
  order: TabName[];
  /** Registered tab metadata keyed by name. */
  tabs: Record<TabName, RegisteredTab>;
  /** Currently focused tab name (source of truth: Expo Router). */
  activeName: TabName | null;
  /** Currently focused tab index. */
  activeIndex: number;

  /** Replace the full set of registered tabs (called when screens change). */
  setTabs: (tabs: RegisteredTab[]) => void;
  /** Sync the active tab from the router navigation state. */
  setActive: (name: TabName, index: number) => void;
  /** Update a badge without re-registering every tab. */
  setBadge: (name: TabName, badge: number | string | undefined) => void;
}

export type TabStore = StoreApi<TabStoreState>;

export function createTabStore(): TabStore {
  return createStore<TabStoreState>((set) => ({
    order: [],
    tabs: {},
    activeName: null,
    activeIndex: 0,

    setTabs: (list) =>
      set(() => {
        const tabs: Record<TabName, RegisteredTab> = {};
        const order: TabName[] = [];
        list.forEach((tab) => {
          tabs[tab.name] = tab;
          order.push(tab.name);
        });
        return { tabs, order };
      }),

    setActive: (name, index) =>
      set((state) =>
        state.activeName === name && state.activeIndex === index
          ? state
          : { activeName: name, activeIndex: index }
      ),

    setBadge: (name, badge) =>
      set((state) => {
        const tab = state.tabs[name];
        if (!tab) return state;
        return {
          tabs: {
            ...state.tabs,
            [name]: { ...tab, options: { ...tab.options, badge } },
          },
        };
      }),
  }));
}
