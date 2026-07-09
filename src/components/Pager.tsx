import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from 'react-native-pager-view';
import Animated from 'react-native-reanimated';

import { usePagerScrollHandler } from '../hooks/usePagerScrollHandler';
import { useTabsContext } from '../provider/context';
import { useRouterState } from '../provider/routerState';
import { TabScreenContext } from '../provider/screenContext';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export interface PagerProps {
  style?: StyleProp<ViewStyle>;
  /** Allow swiping between tabs. Default `true`. */
  swipeEnabled?: boolean;
  /** Overscroll bounce at the edges (iOS/Android). Default `false`. */
  overdrag?: boolean;
}

/**
 * The tab pager. Rendered automatically by `<Tabs>` (it is not part of the
 * public API) — instead of Expo Router's single-route `TabSlot`, it lays every
 * mounted tab screen out as a page inside `react-native-pager-view`, giving true
 * swipe-between-routes while Expo Router stays the source of truth for which
 * route is focused.
 */
export function TabsPager(props: PagerProps) {
  const { style, swipeEnabled = true, overdrag = false } = props;
  const { shared, registerPager, notifyPagerIndex, pagerStore, syncTabToHeader } = useTabsContext();
  const { state, descriptors, switchTab } = useRouterState();

  const pagerRef = useRef<ComponentRef<typeof PagerView>>(null);
  const routes = state.routes;
  const activeIndex = state.index;

  // Track which lazy screens have been mounted at least once.
  const [loaded, setLoaded] = useState<Record<string, boolean>>(() => {
    const key = routes[activeIndex]?.key;
    return key ? { [key]: true } : {};
  });

  // Register imperative paging with the provider (used for deep links etc.).
  useEffect(() => {
    registerPager((index: number) => {
      pagerRef.current?.setPage(index);
    });
  }, [registerPager]);

  const markLoaded = useCallback((key: string) => {
    setLoaded((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  // The page the pager has landed on but not yet committed to Expo Router.
  const pendingIndexRef = useRef<number | null>(null);

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const index = e.nativeEvent.position;
      const route = routes[index];
      if (!route) return;
      // Reconcile the revealed tab TO the shared header (pin it under the
      // collapsed bar if it is behind) and refresh the collapse snapshot BEFORE
      // marking it loaded, so a lazy tab mounts with the right initial offset.
      // The header itself is never touched by the swipe.
      syncTabToHeader(route.name);
      markLoaded(route.key);
      // Record the pager's landed index so the provider's sync effect won't
      // re-animate the pager back to it.
      notifyPagerIndex(index);
      pagerStore.getState().setTargetIndex(index);
      // Defer the actual Expo Router navigation until the pager is idle — this
      // event can fire mid-swipe (crossing the page boundary), and running the
      // navigation re-render then stalls the frames driving the gesture.
      pendingIndexRef.current = index;
    },
    [routes, markLoaded, notifyPagerIndex, pagerStore, syncTabToHeader]
  );

  const onPageScrollStateChanged = useCallback(
    (e: PageScrollStateChangedNativeEvent) => {
      const scrollState = e.nativeEvent.pageScrollState;
      pagerStore.getState().setDragging(scrollState === 'dragging');
      pagerStore.getState().setSettling(scrollState === 'settling');
      if (scrollState !== 'idle') return;
      // The settle animation has finished — safe to re-render for navigation.
      const index = pendingIndexRef.current;
      pendingIndexRef.current = null;
      if (index == null) return;
      const route = routes[index];
      if (route && index !== state.index) {
        switchTab(route.name);
      }
    },
    [routes, state.index, switchTab, pagerStore]
  );

  // Drive the continuous pager position on the UI thread.
  const { pagerPosition } = shared;
  const pagerScrollHandler = usePagerScrollHandler(
    {
      onPageScroll: (event) => {
        'worklet';
        pagerPosition.value = event.position + event.offset;
      },
    },
    [pagerPosition]
  );

  return (
    <AnimatedPagerView
      ref={pagerRef}
      style={[styles.pager, style]}
      initialPage={activeIndex}
      scrollEnabled={swipeEnabled}
      overdrag={overdrag}
      offscreenPageLimit={Math.max(1, routes.length)}
      onPageScroll={pagerScrollHandler as never}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}>
      {routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = index === activeIndex;
        const isLazy = descriptor?.options?.lazy ?? true;
        const shouldRender = !isLazy || isFocused || loaded[route.key];
        return (
          <View key={route.key} style={styles.page} collapsable={false}>
            {shouldRender && descriptor ? (
              <TabScreenContext.Provider value={{ name: route.name, index }}>
                {descriptor.render()}
              </TabScreenContext.Provider>
            ) : null}
          </View>
        );
      })}
    </AnimatedPagerView>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page: { flex: 1 },
});
