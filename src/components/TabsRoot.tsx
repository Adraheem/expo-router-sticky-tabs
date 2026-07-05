import { useTabsWithTriggers, useTabTrigger } from 'expo-router/ui';
import { useCallback, useMemo, type ReactNode } from 'react';

import { TabsProvider } from '../provider/TabsProvider';
import type { RouterStateValue, TabNavState, TabRouteDescriptor } from '../provider/routerState';
import type { RegisteredTab, TabName, TabsProviderOptions } from '../types';
import { partitionChildren } from './Screen';

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

  const { NavigationContent, state, descriptors } = useTabsWithTriggers({
    triggers,
    ...(options.initialRouteName ? { initialRouteName: options.initialRouteName } : {}),
  });

  return (
    <NavigationContent>
      <TabsInner
        screens={screens}
        state={state as unknown as TabNavState}
        descriptors={descriptors as unknown as Record<string, TabRouteDescriptor>}
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
  options: TabsProviderOptions;
  children: ReactNode;
}

/**
 * Rendered inside `NavigationContent` so `useTabTrigger` has the navigator
 * context it needs to switch tabs + read per-tab focus.
 */
function TabsInner({ screens, state, descriptors, options, children }: TabsInnerProps): ReactNode {
  const activeName = state.routes[state.index]?.name ?? screens[0]?.name ?? '';
  const { switchTab, getTrigger } = useTabTrigger({ name: activeName });

  const routerSwitchTab = useCallback((name: TabName) => switchTab(name, {}), [switchTab]);
  const routerGetTrigger = useCallback<RouterStateValue['getTrigger']>(
    (name) => {
      const trigger = getTrigger(name);
      return trigger ? { index: trigger.index, isFocused: trigger.isFocused } : undefined;
    },
    [getTrigger]
  );

  return (
    <TabsProvider
      screens={screens}
      state={state}
      descriptors={descriptors}
      routerSwitchTab={routerSwitchTab}
      routerGetTrigger={routerGetTrigger}
      {...options}>
      {children}
    </TabsProvider>
  );
}
