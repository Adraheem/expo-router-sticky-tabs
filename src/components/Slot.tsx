import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import Animated from 'react-native-reanimated';

import { usePagerScrollHandler } from '../hooks/usePagerScrollHandler';
import { useTabsContext } from '../provider/context';
import { useRouterState } from '../provider/routerState';
import { TabScreenContext } from '../provider/screenContext';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export interface SlotProps {
  style?: StyleProp<ViewStyle>;
  /** Allow swiping between tabs. Default `true`. */
  swipeEnabled?: boolean;
  /** Overscroll bounce at the edges (iOS/Android). Default `false`. */
  overdrag?: boolean;
}

/**
 * `<Tabs.Slot />` renders the active Expo Router route — but instead of the
 * single-route `TabSlot`, it lays every mounted tab screen out as a page inside
 * `react-native-pager-view`, giving true swipe-between-routes while Expo Router
 * stays the source of truth for which route is focused.
 */
export function Slot(props: SlotProps) {
  const { style, swipeEnabled = true, overdrag = false } = props;
  const { shared, registerPager, pagerStore } = useTabsContext();
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

  const onSwipeSettled = useCallback(
    (index: number) => {
      const route = routes[index];
      if (!route) return;
      markLoaded(route.key);
      // Only tell the router if the swipe actually changed the focused tab.
      if (index !== state.index) {
        switchTab(route.name);
      }
      pagerStore.getState().setTargetIndex(index);
      pagerStore.getState().setSettling(false);
    },
    [routes, state.index, switchTab, markLoaded, pagerStore]
  );

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      onSwipeSettled(e.nativeEvent.position);
    },
    [onSwipeSettled]
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
      onPageSelected={onPageSelected}>
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
