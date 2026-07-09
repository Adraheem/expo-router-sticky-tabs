import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { TabsContext, type TabsContextValue } from './context';
import {
  RouterStateContext,
  type RouterStateValue,
  type TabNavState,
  type TabRouteDescriptor,
} from './routerState';
import { TabsPager } from '../components/Pager';
import { useScrollCoordinator } from '../hooks/useScrollCoordinator';
import { createHeaderStore } from '../stores/headerStore';
import { createPagerStore } from '../stores/pagerStore';
import { createScrollStore } from '../stores/scrollStore';
import { createTabStore } from '../stores/tabStore';
import type {
  RegisteredTab,
  TabLayout,
  TabName,
  TabsProviderOptions,
  TabsSharedValues,
} from '../types';
import { useReducedMotion } from '../utils/reducedMotion';

export interface TabsProviderProps extends TabsProviderOptions {
  children: ReactNode;
  /** Registered screens parsed from `<Tabs.Screen>` children. */
  screens: RegisteredTab[];
  /** Live Expo Router tab navigator state. */
  state: TabNavState;
  descriptors: Record<string, TabRouteDescriptor>;
  /** Expo Router's `switchTab`, from `useTabTrigger`. */
  routerSwitchTab: (name: TabName) => void;
  routerGetTrigger: RouterStateValue['getTrigger'];
}

/**
 * Owns every store + shared value for one `<Tabs>` instance and wires Expo
 * Router (the source of truth) to the animated layer. It must be rendered
 * inside Expo Router's `NavigationContent` so `useTabTrigger` has context.
 */
export function TabsProvider(props: TabsProviderProps): ReactNode {
  const {
    children,
    screens,
    state,
    descriptors,
    routerSwitchTab,
    routerGetTrigger,
    minHeaderHeight = 0,
    disableAnimation = false,
    pager,
  } = props;

  // ---- Stores: created once (lazy init), stable identity. ------------------
  const [{ tabStore, pagerStore, headerStore, scrollStore }] = useState(() => ({
    tabStore: createTabStore(),
    pagerStore: createPagerStore(),
    headerStore: createHeaderStore(),
    scrollStore: createScrollStore(),
  }));

  // ---- Shared values: the animation source of truth. ----------------------
  // The shared collapse driver. Written ONLY by the focused list's scroll
  // worklet (see useScrollSync); never by a tab switch / setPage / router sync.
  const headerOffset = useSharedValue(0);
  const activeIndex = useSharedValue(state.index);
  const pagerPosition = useSharedValue(state.index);
  const headerHeight = useSharedValue(0);
  const tabBarHeight = useSharedValue(0);
  const minHeader = useSharedValue(minHeaderHeight);
  const tabLayouts = useSharedValue<TabLayout[]>([]);
  const reducedMotionSv = useSharedValue(0);

  const shared = useMemo<TabsSharedValues>(
    () => ({
      headerOffset,
      activeIndex,
      pagerPosition,
      headerHeight,
      tabBarHeight,
      minHeaderHeight: minHeader,
      tabLayouts,
      reducedMotion: reducedMotionSv,
    }),
    // shared values are stable refs; build the container once.
    [
      headerOffset,
      activeIndex,
      pagerPosition,
      headerHeight,
      tabBarHeight,
      minHeader,
      tabLayouts,
      reducedMotionSv,
    ]
  );

  // ---- Reduced motion → shared flag + config. -----------------------------
  const systemReducedMotion = useReducedMotion();
  const animationDisabled = disableAnimation || systemReducedMotion;
  useEffect(() => {
    reducedMotionSv.value = animationDisabled ? 1 : 0;
  }, [animationDisabled, reducedMotionSv]);

  useEffect(() => {
    minHeader.value = minHeaderHeight;
  }, [minHeaderHeight, minHeader]);

  // ---- Register screens into the tab store. -------------------------------
  const screensSignature = screens
    .map((s) => `${s.name}:${s.options.title}:${String(s.options.badge ?? '')}:${s.disabled}`)
    .join('|');
  useEffect(() => {
    // screens are re-derived every render; the signature captures real changes.
    tabStore.getState().setTabs(screens);
    pagerStore.getState().setPageCount(screens.length);
  }, [screensSignature, tabStore, pagerStore]);

  // ---- Imperative pager bridge (registered by the internal pager). --------
  const pagerSetPageRef = useRef<((index: number) => void) | null>(null);
  const lastPagerIndexRef = useRef(state.index);
  const registerPager = useCallback((setPage: (index: number) => void) => {
    pagerSetPageRef.current = setPage;
  }, []);
  const setPage = useCallback((index: number) => {
    lastPagerIndexRef.current = index;
    pagerSetPageRef.current?.(index);
  }, []);
  // The pager already moved itself (swipe): record its index so the sync effect
  // below does not command a redundant re-animation to the same page.
  const notifyPagerIndex = useCallback((index: number) => {
    lastPagerIndexRef.current = index;
  }, []);

  // ---- Stable switchTab that always calls the latest router fn. ------------
  const routerSwitchTabRef = useRef(routerSwitchTab);
  useEffect(() => {
    routerSwitchTabRef.current = routerSwitchTab;
  }, [routerSwitchTab]);
  const switchTab = useCallback((name: TabName) => routerSwitchTabRef.current(name), []);

  // ---- Scroll coordinator: reconciles tabs TO the shared header. ----------
  const { syncTabToHeader } = useScrollCoordinator({
    scrollStore,
    pagerStore,
    tabStore,
    headerStore,
    headerOffset,
    headerHeight,
    minHeaderHeight: minHeader,
  });

  // ---- Router state → animated layer (runs on every navigation change). ----
  const activeName = state.routes[state.index]?.name ?? null;
  useEffect(() => {
    if (activeName == null) return;
    tabStore.getState().setActive(activeName, state.index);
    activeIndex.value = state.index;
    // Reconcile the newly-focused tab TO the shared header collapse — pin it
    // under the collapsed bar if it is behind. We deliberately do NOT write the
    // header from the tab's offset: switching tabs must never move the header.
    syncTabToHeader(activeName);
    // Keep the pager in sync when navigation was driven externally (deep link,
    // tab press, back button) rather than by a swipe we already settled.
    if (lastPagerIndexRef.current !== state.index) {
      setPage(state.index);
    }
  }, [activeName, state.index, tabStore, activeIndex, syncTabToHeader, setPage]);

  // ---- Context values. ----------------------------------------------------
  const tabsContext = useMemo<TabsContextValue>(
    () => ({
      tabStore,
      pagerStore,
      headerStore,
      scrollStore,
      shared,
      switchTab,
      setPage,
      registerPager,
      notifyPagerIndex,
      syncTabToHeader,
    }),
    [
      tabStore,
      pagerStore,
      headerStore,
      scrollStore,
      shared,
      switchTab,
      setPage,
      registerPager,
      notifyPagerIndex,
      syncTabToHeader,
    ]
  );

  const routerState = useMemo<RouterStateValue>(
    () => ({ state, descriptors, switchTab, getTrigger: routerGetTrigger }),
    [state, descriptors, switchTab, routerGetTrigger]
  );

  return (
    <TabsContext.Provider value={tabsContext}>
      <RouterStateContext.Provider value={routerState}>
        {/* A single flex container gives the pager room to fill and a stable
            positioning context for the absolute Header/TabBar overlays. The
            pager is rendered automatically after the layout children (Header /
            TabBar are absolute overlays), so screens display without an
            explicit slot. */}
        <View style={styles.container}>
          {children}
          <TabsPager swipeEnabled={pager?.swipeEnabled} overdrag={pager?.overdrag} />
        </View>
      </RouterStateContext.Provider>
    </TabsContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
