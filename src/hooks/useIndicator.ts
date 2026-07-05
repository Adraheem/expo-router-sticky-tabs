import type { SharedValue } from 'react-native-reanimated';

import { useTabsContext } from '../provider/context';
import type { TabLayout } from '../types';

export interface UseIndicatorResult {
  /** Continuous pager position, for interpolating a custom indicator. */
  pagerPosition: SharedValue<number>;
  /** Settled active index. */
  activeIndex: SharedValue<number>;
  /** Measured geometry of each tab button. */
  tabLayouts: SharedValue<TabLayout[]>;
}

/** Building blocks for a fully custom `<Tabs.Indicator />`. */
export function useIndicator(): UseIndicatorResult {
  const { shared } = useTabsContext();
  return {
    pagerPosition: shared.pagerPosition,
    activeIndex: shared.activeIndex,
    tabLayouts: shared.tabLayouts,
  };
}
