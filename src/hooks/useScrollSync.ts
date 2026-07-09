import { useCallback, useEffect, useState } from 'react';
import type { Component } from 'react';
import {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  type AnimatedRef,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';
import { useStore } from 'zustand';

import { useTabsContext } from '../provider/context';
import { useTabScreen } from '../provider/screenContext';
import { clamp, collapseAnchor, collapsibleDistance } from '../utils/math';

type AnimatedScrollHandler = ReturnType<typeof useAnimatedScrollHandler>;

export interface ScrollSync {
  /** Reanimated scroll handler — attach to the list's `onScroll`. */
  scrollHandler: AnimatedScrollHandler;
  /** Animated ref — attach to the list so it can be scrolled imperatively. */
  animatedRef: AnimatedRef<Component>;
  /** Top padding the list content needs so it clears the sticky header + bar. */
  topInset: number;
  /**
   * Initial `contentOffset` y the list should mount at, captured once from the
   * shared collapse. A lazy tab that first mounts while the header is collapsed
   * starts already-pinned under the bar — its first paint shows no header gap.
   */
  initialOffset: number;
  /** Recommended `scrollEventThrottle`. */
  scrollEventThrottle: number;
}

/**
 * Core scroll synchronisation. This is the ONLY writer of the shared
 * `headerOffset`: while a tab is focused, its genuine vertical scrolling drives
 * the header collapse. Every tab also records its own offset so the coordinator
 * can reconcile it to the header on switch.
 *
 * The header is driven by the **anchored delta** `clamp(y - anchor, 0, distance)`,
 * not the absolute offset. The anchor (re-derived by the coordinator at every
 * focus/reveal via `collapseAnchor`) is what lets a previously-scrolled tab pick
 * the header up exactly where other tabs left it — scrolling collapses/expands
 * it gradually from there instead of slamming it to the tab's absolute
 * position. Once fully collapsed the anchor locks to 0 (canonical absolute
 * mode), so the header only re-expands when the content nears the top.
 *
 * Because a tab switch never runs this worklet, changing tabs can never move the
 * header — only real vertical scrolling can.
 */
export function useScrollSync(): ScrollSync {
  const { shared, scrollStore, headerStore } = useTabsContext();
  const { index, name } = useTabScreen();
  const { activeIndex, headerOffset, headerHeight, minHeaderHeight } = shared;

  // Seed this tab's own offset from the current shared collapse so a tab that
  // mounts while collapsed is immediately consistent with the header. We read
  // the JS mirror (`collapseSnapshot`) rather than `headerOffset.value` so we
  // never touch a shared value during render (Reanimated warns on that). The
  // coordinator keeps the snapshot fresh at every tab switch/reveal.
  const [initialOffset] = useState(() => headerStore.getState().collapseSnapshot);
  const lastOffset = useSharedValue(initialOffset);
  // Collapse anchor. 0 is exact for a fresh mount (offset === collapse); the
  // coordinator re-derives it at every subsequent focus/reveal.
  const anchor = useSharedValue(0);
  const animatedRef = useAnimatedRef<Component>();

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        'worklet';
        const y = event.contentOffset.y;
        lastOffset.value = y;
        if (activeIndex.value === index) {
          // Genuine vertical scroll of the focused tab — the single source of
          // change for the shared header. Anchored delta, then re-derive the
          // anchor: unchanged mid-range, follows y at the expanded bound,
          // locks to 0 (canonical absolute mode) once fully collapsed.
          const distance = collapsibleDistance(headerHeight.value, minHeaderHeight.value);
          const next = clamp(y - anchor.value, 0, distance);
          headerOffset.value = next;
          anchor.value = collapseAnchor(y, next, distance);
        }
      },
    },
    [index]
  );

  const scrollToOffset = useCallback(
    (offset: number, animated = false) => {
      // `scrollTo` is a worklet — hop to the UI thread when called from JS.
      scheduleOnUI(
        (y: number, a: boolean) => {
          'worklet';
          scrollTo(animatedRef, 0, y, a);
        },
        offset,
        animated
      );
    },
    [animatedRef]
  );

  useEffect(() => {
    scrollStore.getState().register(name, { lastOffset, anchor, scrollToOffset });
    return () => scrollStore.getState().unregister(name);
  }, [name, scrollStore, lastOffset, anchor, scrollToOffset]);

  const headerHeightJs = useStore(headerStore, (s) => s.headerHeight);
  const tabBarHeight = useStore(headerStore, (s) => s.tabBarHeight);

  return {
    scrollHandler,
    animatedRef,
    topInset: headerHeightJs + tabBarHeight,
    initialOffset,
    scrollEventThrottle: 16,
  };
}
