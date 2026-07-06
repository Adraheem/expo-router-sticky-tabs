import { createStore, type StoreApi } from 'zustand/vanilla';

import type { HeaderConfig } from '../types';

export interface HeaderStoreState {
  /** Measured full header height in px (JS mirror of the shared value). */
  headerHeight: number;
  /** Measured tab bar height in px. */
  tabBarHeight: number;
  /** Whether a header has been registered at all. */
  hasHeader: boolean;
  /** Behaviour config resolved from `<Tabs.Header />` props. */
  config: HeaderConfig;
  /**
   * Plain-JS mirror of the shared `headerOffset`, updated by the coordinator on
   * the JS thread at discrete moments (tab switch / reveal). Read once at mount
   * so a lazy tab can seed its initial `contentOffset` without touching a shared
   * value during render (Reanimated warns on that). Not for the hot scroll path.
   */
  collapseSnapshot: number;

  setHeaderHeight: (height: number) => void;
  setTabBarHeight: (height: number) => void;
  setConfig: (config: Partial<HeaderConfig>) => void;
  setHasHeader: (hasHeader: boolean) => void;
  setCollapseSnapshot: (offset: number) => void;
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  collapsible: true,
  sticky: true,
  parallax: false,
  blur: false,
  safeArea: true,
  animated: true,
  dynamicHeight: true,
  snap: false,
  floating: false,
};

export type HeaderStore = StoreApi<HeaderStoreState>;

export function createHeaderStore(): HeaderStore {
  return createStore<HeaderStoreState>((set) => ({
    headerHeight: 0,
    tabBarHeight: 0,
    hasHeader: false,
    config: DEFAULT_HEADER_CONFIG,
    collapseSnapshot: 0,

    setHeaderHeight: (headerHeight) =>
      set((s) => (Math.abs(s.headerHeight - headerHeight) < 0.5 ? s : { headerHeight })),
    setTabBarHeight: (tabBarHeight) =>
      set((s) => (Math.abs(s.tabBarHeight - tabBarHeight) < 0.5 ? s : { tabBarHeight })),
    setConfig: (config) => set((s) => ({ config: { ...s.config, ...config } })),
    setHasHeader: (hasHeader) => set((s) => (s.hasHeader === hasHeader ? s : { hasHeader })),
    setCollapseSnapshot: (collapseSnapshot) =>
      set((s) => (s.collapseSnapshot === collapseSnapshot ? s : { collapseSnapshot })),
  }));
}
