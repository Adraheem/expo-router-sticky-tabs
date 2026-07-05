import { useCallback, useEffect } from 'react';
import type { Component } from 'react';
import {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  type AnimatedRef,
} from 'react-native-reanimated';
import { useStore } from 'zustand';

import { useTabsContext } from '../provider/context';
import { useTabScreen } from '../provider/screenContext';

type AnimatedScrollHandler = ReturnType<typeof useAnimatedScrollHandler>;

export interface ScrollSync {
  /** Reanimated scroll handler — attach to the list's `onScroll`. */
  scrollHandler: AnimatedScrollHandler;
  /** Animated ref — attach to the list so it can be scrolled imperatively. */
  animatedRef: AnimatedRef<Component>;
  /** Top padding the list content needs so it clears the sticky header + bar. */
  topInset: number;
  /** Recommended `scrollEventThrottle`. */
  scrollEventThrottle: number;
}

/**
 * Core scroll synchronisation. Binds a scrollable inside a tab screen to the
 * shared header driver: the focused tab writes its live offset to the shared
 * `scrollY` (so the header collapses), and every tab records its own offset so
 * its collapse state is restored on return — exactly like Instagram.
 */
export function useScrollSync(): ScrollSync {
  const { shared, scrollStore, headerStore } = useTabsContext();
  const { index, name } = useTabScreen();
  const { activeIndex, scrollY } = shared;

  const lastOffset = useSharedValue(0);
  const animatedRef = useAnimatedRef<Component>();

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        'worklet';
        const y = event.contentOffset.y;
        lastOffset.value = y;
        if (activeIndex.value === index) {
          scrollY.value = y;
        }
      },
    },
    [index]
  );

  const scrollToOffset = useCallback(
    (offset: number, animated = false) => {
      // `scrollTo` is a worklet — hop to the UI thread when called from JS.
      runOnUI((y: number, a: boolean) => {
        'worklet';
        scrollTo(animatedRef, 0, y, a);
      })(offset, animated);
    },
    [animatedRef]
  );

  useEffect(() => {
    scrollStore.getState().register(name, { lastOffset, scrollToOffset });
    return () => scrollStore.getState().unregister(name);
  }, [name, scrollStore, lastOffset, scrollToOffset]);

  const headerHeight = useStore(headerStore, (s) => s.headerHeight);
  const tabBarHeight = useStore(headerStore, (s) => s.tabBarHeight);

  return {
    scrollHandler,
    animatedRef,
    topInset: headerHeight + tabBarHeight,
    scrollEventThrottle: 16,
  };
}
