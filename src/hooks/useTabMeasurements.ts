import type { SharedValue } from 'react-native-reanimated';

import { useTabsContext } from '../provider/context';
import type { TabLayout } from '../types';

/**
 * The measured geometry (x + width) of every tab button, as a shared value.
 * Updated as tabs lay out; consumed by the indicator and custom tab bars.
 */
export function useTabMeasurements(): SharedValue<TabLayout[]> {
  const { shared } = useTabsContext();
  return shared.tabLayouts;
}
