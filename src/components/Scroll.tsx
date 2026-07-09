import type { ReactNode } from 'react';

import { useScrollSync } from '../hooks/useScrollSync';
import { wireNearestScrollable } from '../utils/scrollables';

// Provided by React Native / Metro; declared locally so the check type-checks.
declare const __DEV__: boolean;

export interface ScrollProps {
  children?: ReactNode;
}

/**
 * `<Tabs.Scroll>` — wrap a screen's scrollable and it is auto-synced with the
 * collapsible header. It finds the nearest `FlatList` / `ScrollView` /
 * `SectionList` / `FlashList` in the JSX you give it, converts it to its
 * Reanimated `Animated.*` form and injects the scroll handler, ref and header
 * insets. No extra native view is added — the detected list is returned in place.
 *
 * The list must live in the JSX passed here (it may be nested inside views). For
 * a list hidden behind your own component — which React can't reach into — use
 * `useStickyScroll()` instead.
 *
 * @example
 * export default function Posts() {
 *   return (
 *     <Tabs.Scroll>
 *       <FlatList data={data} renderItem={renderItem} />
 *     </Tabs.Scroll>
 *   );
 * }
 */
export function TabsScroll({ children }: ScrollProps): ReactNode {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  const { node, found } = wireNearestScrollable(children, {
    scrollHandler,
    animatedRef,
    topInset,
    initialOffset,
    scrollEventThrottle,
  });
  if (__DEV__ && !found) {
    console.warn(
      "expo-router-sticky-tabs: <Tabs.Scroll> found no scrollable child, so the header won't collapse. " +
        'Wrap a FlatList / ScrollView / SectionList / FlashList directly, or use useStickyScroll() ' +
        'for a list behind your own component.'
    );
  }
  return node;
}
TabsScroll.displayName = 'Tabs.Scroll';
