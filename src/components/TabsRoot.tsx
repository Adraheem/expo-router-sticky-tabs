import { useTabsWithTriggers, useTabTrigger } from 'expo-router/ui';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';

import { TabsProvider } from '../provider/TabsProvider';
import type { RouterStateValue, TabNavState, TabRouteDescriptor } from '../provider/routerState';
import type { RegisteredTab, TabName, TabsProviderOptions } from '../types';
import { Pager } from './Pager';
import { partitionChildren } from './Screen';
import { orderStateByScreens } from '../utils/routeOrder';

export interface TabsRootProps extends TabsProviderOptions {
  children?: ReactNode;
}

/**
 * `<Tabs>` — the root. Parses `<Tabs.Screen>` declarations into Expo Router
 * triggers, builds the headless tab navigator (Router owns routing state,
 * URLs, deep links and history) and hands the mounted screens down to the
 * animated layer via `<TabsProvider>`.
 */
export function TabsRoot(props: TabsRootProps): ReactNode {
  const { children, ...options } = props;
  const { screens, layoutChildren } = partitionChildren(children);

  const triggerSignature = screens.map((s) => `${s.name}@${String(s.href)}`).join('|');
  const triggers = useMemo(
    () => screens.map((s) => ({ type: 'internal' as const, name: s.name, href: s.href })),

    [triggerSignature]
  );

  // Expo Router 58+ takes the initial route from the layout's
  // `unstable_settings.anchor` and ignores this option; older
  // versions still read it.
  const { NavigationContent, state, descriptors, navigation } = useTabsWithTriggers({
    triggers,
    ...(options.initialRouteName ? { initialRouteName: options.initialRouteName } : {}),
  });
  const preload = useCallback(
    (name: string, params?: object) => navigation.preload(name, params),
    [navigation]
  );

  return (
    <NavigationContent>
      <TabsInner
        screens={screens}
        state={state as unknown as TabNavState}
        descriptors={descriptors as unknown as Record<string, TabRouteDescriptor>}
        preload={preload}
        options={options}>
        {layoutChildren}
      </TabsInner>
    </NavigationContent>
  );
}

interface TabsInnerProps {
  screens: RegisteredTab[];
  state: TabNavState;
  descriptors: Record<string, TabRouteDescriptor>;
  /** Adds a tab's route to the router state without focusing it. */
  preload: (name: string, params?: object) => void;
  options: TabsProviderOptions;
  children: ReactNode;
}

/**
 * Rendered inside `NavigationContent` so `useTabTrigger` has the navigator
 * context it needs to switch tabs + read per-tab focus.
 */
function TabsInner({
  screens,
  state,
  descriptors,
  preload,
  options,
  children,
}: TabsInnerProps): ReactNode {
  const activeName = state.routes[state.index]?.name ?? screens[0]?.name ?? '';
  const { switchTab, getTrigger } = useTabTrigger({ name: activeName });

  // Expo Router sorts `state.routes`, so its order diverges from the order the
  // `<Tabs.Screen>` declarations (and therefore the tab bar) use. Remap the
  // router state into declaration order once, here at the boundary, so the
  // whole animated layer downstream — pager pages, indicator, tab focus —
  // shares a single, consistent index space. Router still owns navigation.
  const orderSignature = screens.map((s) => s.name).join('|');
  const screenNames = useMemo(() => screens.map((s) => s.name), [orderSignature]);
  const orderedState = useMemo(() => orderStateByScreens(state, screenNames), [state, screenNames]);

  // Expo Router 58+ only creates a tab's route the first time it is focused,
  // so an unvisited tab renders nothing. The pager reveals neighbouring pages
  // mid-swipe (and mounts non-lazy ones up front), so preload every missing
  // tab into the router state. Preloading never changes focus or the URL. On
  // older versions every tab route already exists and this is a no-op.
  const missingSignature = (state.routeNames ?? [])
    .filter((name) => !state.routes.some((r) => r.name === name))
    .join('|');
  useEffect(() => {
    if (!missingSignature) return;
    for (const name of missingSignature.split('|')) {
      const trigger = getTrigger(name);
      preload(name, trigger?.type === 'internal' ? trigger.action.payload.params : undefined);
    }
  }, [missingSignature, getTrigger, preload]);

  const routerSwitchTab = useCallback((name: TabName) => switchTab(name, {}), [switchTab]);
  const routerGetTrigger = useCallback<RouterStateValue['getTrigger']>(
    (name) => {
      const trigger = getTrigger(name);
      const index = screenNames.indexOf(name);
      return trigger && index !== -1 ? { index, isFocused: trigger.isFocused } : undefined;
    },
    [getTrigger, screenNames]
  );

  return (
    <TabsProvider
      screens={screens}
      state={orderedState}
      descriptors={descriptors}
      routerSwitchTab={routerSwitchTab}
      routerGetTrigger={routerGetTrigger}
      {...options}>
      {children}
      {/* The pager is always rendered — the tab screens display without the
          consumer placing anything. It fills the container while the absolute
          Header/TabBar overlays sit above it. */}
      <Pager
        swipeEnabled={options.swipeEnabled}
        overdrag={options.overdrag}
        style={options.pagerStyle}
      />
    </TabsProvider>
  );
}
