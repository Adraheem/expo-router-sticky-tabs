import type { SharedValue } from 'react-native-reanimated';
import { useStore } from 'zustand';

import { useTabsContext } from '../provider/context';
import type { HeaderConfig } from '../types';

export interface UseHeaderResult {
  /** Measured full header height (JS, reactive). */
  height: number;
  /** Measured tab bar height (JS, reactive). */
  tabBarHeight: number;
  /** Resolved header behaviour config. */
  config: HeaderConfig;
  /**
   * The shared collapse amount ∈ `[0, collapsibleDistance]` driving the header.
   * UI-thread shared value; unaffected by tab switches (only vertical scrolling
   * moves it). Replaces the old per-tab `scrollY`.
   */
  headerOffset: SharedValue<number>;
  /** Header height as a shared value. */
  headerHeight: SharedValue<number>;
  /** Collapsed (minimum) header height as a shared value. */
  minHeaderHeight: SharedValue<number>;
}

/** Access to header measurements + the shared values that drive collapse. */
export function useHeader(): UseHeaderResult {
  const { headerStore, shared } = useTabsContext();
  const height = useStore(headerStore, (s) => s.headerHeight);
  const tabBarHeight = useStore(headerStore, (s) => s.tabBarHeight);
  const config = useStore(headerStore, (s) => s.config);
  return {
    height,
    tabBarHeight,
    config,
    headerOffset: shared.headerOffset,
    headerHeight: shared.headerHeight,
    minHeaderHeight: shared.minHeaderHeight,
  };
}
