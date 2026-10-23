import type { TabNavState } from '../provider/routerState';

/**
 * Expo Router sorts the tab navigator's `state.routes` — the initial route is
 * placed first and the rest run through its own route sort (see
 * `sortRoutesWithInitial` in `expo-router`). That order is NOT the order the
 * `<Tabs.Screen>` declarations appear in.
 *
 * The whole visual layer — `<Tabs.TabBar />`, the indicator and each tab's
 * `index` — is addressed by declaration order, while the pager lays its pages
 * out from `state.routes`. If the two orders diverge, the pages land under the
 * wrong tabs.
 *
 * This remaps the router state into declaration order so both index spaces
 * agree. Expo Router stays the source of truth for *which* route is focused
 * (matched here by name) and for URLs/deep links; we only reconcile ordering.
 * Routes the router knows about but that were not declared as screens are
 * dropped, keeping the pager pages aligned 1:1 with the tabs.
 *
 * From Expo Router 58 a tab's route is only created once it is first focused
 * (or preloaded), so a declared tab can be in `state.routeNames` without a
 * route yet. It gets a placeholder keyed by its name — the same key Expo
 * Router uses for that tab's placeholder descriptor — so the pager still has
 * one page per tab from the very first render.
 */
export function orderStateByScreens(state: TabNavState, order: readonly string[]): TabNavState {
  const routeByName = new Map(state.routes.map((r) => [r.name, r]));
  const knownNames = new Set(state.routeNames);
  const routes = order
    .map((name) => routeByName.get(name) ?? (knownNames.has(name) ? { key: name, name } : null))
    .filter((r): r is TabNavState['routes'][number] => Boolean(r));
  const activeName = state.routes[state.index]?.name;
  const index = Math.max(
    0,
    routes.findIndex((r) => r.name === activeName)
  );
  return { index, routes };
}
