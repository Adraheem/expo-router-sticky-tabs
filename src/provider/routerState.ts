import { createContext, useContext, type ReactElement } from 'react';

import type { TabName } from '../types';

/**
 * A minimal structural view of the Expo Router tab navigator state. We only
 * depend on the fields we actually use so the library is not coupled to Expo
 * Router's internal descriptor shape.
 */
export interface TabRouteDescriptor {
  render: () => ReactElement;
  options: {
    lazy?: boolean;
    freezeOnBlur?: boolean;
    unmountOnBlur?: boolean;
  };
  route: { key: string; name: string };
}

export interface TabNavState {
  index: number;
  routes: { key: string; name: string }[];
}

export interface RouterStateValue {
  state: TabNavState;
  descriptors: Record<string, TabRouteDescriptor>;
  /** Switch to a tab by name via Expo Router. */
  switchTab: (name: TabName) => void;
  /** Resolve a tab's router index + focus, if registered. */
  getTrigger: (name: TabName) => { index: number; isFocused: boolean } | undefined;
}

export const RouterStateContext = createContext<RouterStateValue | null>(null);

export function useRouterState(): RouterStateValue {
  const ctx = useContext(RouterStateContext);
  if (!ctx) {
    throw new Error('expo-router-sticky-tabs: router state is only available inside <Tabs>.');
  }
  return ctx;
}
