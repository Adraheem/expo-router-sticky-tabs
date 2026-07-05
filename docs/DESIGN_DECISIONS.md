# Design decisions

This document records the architectural decisions behind `expo-router-sticky-tabs`, why each dependency was reused instead of rebuilt, and the outcome of the key technical spike.

## Guiding principle

**Expo Router is the source of truth for routing. This library only provides UI, layout, synchronization and animation.** We never duplicate router state, never re-implement navigation, and never fork the URL/deep-link/history model. When in doubt, defer to the router.

## The core problem (and the spike)

A swipeable pager must keep **every** tab page mounted so the user can swipe between them. Expo Router's `Slot` renders **one** active route at a time. Reconciling "each tab is a real route (URL, deep link, history)" with "swipe between them" is the hardest part of this library.

### Spike outcome — **wrap the headless navigator's mounted screens**

We investigated Expo Router's headless tab primitives in `expo-router/ui` (SDK 57). The relevant finding:

- `useTabsWithTriggers({ triggers })` builds a React Navigation custom navigator (`ExpoTabRouter`) and returns `{ state, descriptors, navigation, NavigationContent }`.
- `descriptors[routeKey].render()` renders a tab route's screen. Expo Router's own `TabSlot` maps `state.routes → descriptors[key].render()` and keeps them all mounted via `react-native-screens`.

So we do exactly what `TabSlot` does — but instead of stacking screens with `display: none`, **`<Tabs.Slot>` lays each `descriptors[key].render()` out as a page inside `react-native-pager-view`.** This gives true swipe-between-routes while:

- Expo Router owns the navigation **state**, URLs, deep links and history.
- Tab switching goes through `useTabTrigger().switchTab(name)` (which calls `router.navigate` / dispatches `JUMP_TO`).
- The pager position is a Reanimated shared value; `state.index` drives the pager, and swipe-settle calls `switchTab` back into the router.

The result: **only `<Tabs.Slot>` and the router-sync effect touch Expo Router internals.** Everything else (header, tab bar, indicator, lists, stores, hooks) is independent. If a future Expo Router release changes the headless API, the blast radius is one file.

## Reuse vs. build

| Concern | Decision | Why |
|---|---|---|
| Routing, URLs, deep links, history | **Reuse** `expo-router` + `expo-router/ui` | It's the whole point — Router stays authoritative. Building navigation would violate the guiding principle. |
| Swipe gestures, snapping, velocity, RTL, page virtualization, a11y | **Reuse** `react-native-pager-view` | Mature, native, battle-tested. The spec explicitly says *do not build paging from scratch*. Chosen over the experimental `@expo/ui` pager for stability and Expo Go support. |
| UI-thread animation | **Reuse** `react-native-reanimated` | Shared values / derived values / worklets keep header, indicator and scroll sync off the JS thread — no re-renders in the hot path. |
| Gestures | **Reuse** `react-native-gesture-handler` | Peer of pager-view/reanimated; never implement gestures by hand. |
| Safe areas | **Reuse** `react-native-safe-area-context` | Standard, correct notch/inset handling. |
| Mounted-screen management | **Reuse** `react-native-screens` (via Expo Router) | Already used by the headless navigator. |
| State without context re-renders | **Reuse** `zustand` (vanilla stores) | Selective subscriptions + `getState()` reads avoid provider re-renders. Four separate stores keep responsibilities isolated. |
| High-perf lists | **Reuse (optional)** `@shopify/flash-list` | Optional peer; lazily required so consumers who don't use it never pay for it. |
| **The sticky-tab synchronization layer** | **Build** | No existing library synchronizes per-tab scroll offset ↔ a collapsible header ↔ a swipe indicator *for Expo Router routes*. This is the only genuinely custom subsystem. |

## Why a pure-JS library (no native module)

The project was scaffolded with `create-expo-module` (a native-module template). We stripped it: this library composes existing native libraries from JavaScript and needs **zero** custom native code. Being pure-JS guarantees **Expo Go** support and removes an entire maintenance surface.

## Build tooling: `expo-module-scripts` over `react-native-builder-bob`

The spec suggested `react-native-builder-bob`. We kept `expo-module-scripts` (already wired, and the idiomatic choice for Expo-first libraries): it produces tree-shakeable ESM with source maps + declaration maps via `tsc`, and requires no extra config. `builder-bob` remains a drop-in alternative if multi-target CJS output is ever needed.

## State architecture

Four single-responsibility zustand stores plus a set of Reanimated shared values on a **stable** context:

- `tabStore` — registered screens, order, active tab.
- `pagerStore` — page count, target index, drag/settle flags.
- `headerStore` — measured heights + resolved header config.
- `scrollStore` — per-tab live offset (shared value) + imperative `scrollToOffset`.
- Shared values — `scrollY`, `activeIndex`, `pagerPosition`, `headerHeight`, `tabBarHeight`, `minHeaderHeight`, `tabLayouts`, `reducedMotion`.

The context value identity is stable, so scroll/swipe never re-render consumers. Header position, indicator and sticky state derive from just two inputs on the UI thread: `activeIndex` and the focused tab's `scrollY`.

## Scroll restoration

Because the pager keeps every tab mounted (`react-native-screens`), each list retains its native scroll offset for free. We only restore the **header driver** shared value on tab change (reading the newly focused tab's last offset), so the header snaps to the correct collapse state — matching Instagram exactly, with a single shared-value write per switch.

## Roadmap

Deferred, in rough priority order:

- **Web** — native pagers don't render on web; a CSS scroll-snap / transform pager behind the same public API.
- More flagship examples — Threads, TikTok, Spotify Artist, LinkedIn, Pinterest.
- Advanced header modes — polished `parallax` / `blur` / `snap` / `floating`.
- Deeper `Tabs.FlashList` optimization and a full swipe + deep-link integration test suite (→ 95% coverage).
- `semantic-release` + automatic changelog (config staged, not yet enabled).
- Animated GIF docs.
- Codemod-style migration from `react-native-collapsible-tab-view` / `react-native-tab-view`.
