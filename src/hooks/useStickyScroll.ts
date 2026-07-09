import type { Ref } from 'react';

import { useScrollSync } from './useScrollSync';
import { mergeRefs } from '../utils/mergeRefs';

/**
 * Escape hatch for lists the `<Tabs.Scroll>` auto-detector can't reach — e.g. a
 * scrollable hidden behind your own component. Spread the result onto a
 * **Reanimated `Animated.*` scrollable** (or a component that forwards `onScroll`,
 * `ref` and the insets to one); the collapse runs on the UI thread, so a plain
 * `react-native` list will not drive the header. FlashList users should drop
 * `scrollIndicatorInsets`.
 *
 * @example
 * const scroll = useStickyScroll();
 * return <Animated.FlatList {...scroll} data={data} renderItem={renderItem} />;
 */
export function useStickyScroll<T = unknown>(ref?: Ref<T>) {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  return {
    ref: mergeRefs(ref, animatedRef as unknown as Ref<T>),
    onScroll: scrollHandler,
    scrollEventThrottle,
    contentOffset: { x: 0, y: initialOffset },
    contentContainerStyle: { paddingTop: topInset },
    scrollIndicatorInsets: { top: topInset },
  } as const;
}

export type UseStickyScrollResult = ReturnType<typeof useStickyScroll>;
