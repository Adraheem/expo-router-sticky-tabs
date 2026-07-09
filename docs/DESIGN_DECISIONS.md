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

So we do exactly what `TabSlot` does — but instead of stacking screens with `display: none`, **the auto-rendered pager (`components/Pager`) lays each `descriptors[key].render()` out as a page inside `react-native-pager-view`.** This gives true swipe-between-routes while:

- Expo Router owns the navigation **state**, URLs, deep links and history.
- Tab switching goes through `useTabTrigger().switchTab(name)` (which calls `router.navigate` / dispatches `JUMP_TO`).
- The pager position is a Reanimated shared value; `state.index` drives the pager, and swipe-settle calls `switchTab` back into the router.

The result: **only the pager (`components/Pager`) and the router-sync effect touch Expo Router internals.** Everything else (header, tab bar, indicator, scroll sync, stores, hooks) is independent. If a future Expo Router release changes the headless API, the blast radius is one file.

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
- Shared values — `headerOffset`, `activeIndex`, `pagerPosition`, `headerHeight`, `tabBarHeight`, `minHeaderHeight`, `tabLayouts`, `reducedMotion`.

The context value identity is stable, so scroll/swipe never re-render consumers. The header, indicator and sticky state derive on the UI thread from `headerOffset` — **shared layout state with a single writer** (the focused list's scroll worklet), never a per-tab offset. Per-tab offsets live in `scrollStore`; the scroll coordinator reconciles them to `headerOffset` but never the reverse.

## The header belongs to the layout, not the active tab

The header, tab bar and collapse state are **shared layout**, owned once by the container. Individual
tabs own only their content + scroll position. These two systems talk through a synchronization layer
(`headerOffset` + the coordinator), not by reading each other's state:

- **Only genuine vertical scrolling** of the focused tab moves `headerOffset`. Changing tabs, swiping,
  deep-linking, restoring routes and lazy-mounting cannot — by construction, they never run the writer.
- On any tab change/reveal the coordinator pins the incoming tab to `max(ownOffset, headerOffset)`, so a
  tab that is "behind" the collapse sits directly under the collapsed bar instead of forcing the header
  to expand.

An earlier version derived the header from the active tab's `scrollY` and *rewrote that driver on every
tab switch*. That made switching to a less-scrolled tab expand the header — a jump the user never asked
for. Giving the header its own single-writer shared value removes the whole class of bug (deep links,
restore, lazy mount, programmatic nav), not just the one scenario.

## Scroll restoration

Because the pager keeps every tab mounted (`react-native-screens`), each list retains its native scroll offset for free — so a tab scrolled to 1000 returns to 1000 exactly, with no work from us. On a tab switch we do **not** touch `headerOffset`; the coordinator instead pins the incoming tab up to the current collapse when it is behind it (`syncedTabOffset(own, headerOffset) = max(own, headerOffset)`). This reconciles the two requirements that are only in tension for a tab sitting behind a collapsed header: exact per-tab restoration holds in the content region (offset ≥ collapse), while the collapse region is shared, so a short/fresh tab is pinned under the collapsed bar (matching Instagram / X / Threads) rather than expanding the header. Pulling that tab back down re-expands the header naturally, since its offset re-enters `[0, collapsibleDistance]`.

Lazy tabs that first mount while collapsed seed their initial `contentOffset` from `headerOffset`, so their first paint is already pinned — no expand-then-collapse flash.

## Roadmap

Deferred, in rough priority order:

- **Web** — native pagers don't render on web; a CSS scroll-snap / transform pager behind the same public API.
- More flagship examples — Threads, TikTok, Spotify Artist, LinkedIn, Pinterest.
- Advanced header modes — polished `parallax` / `blur` / `snap` / `floating`.
- Deeper `FlashList` optimization and a full swipe + deep-link integration test suite (→ 95% coverage).
- `semantic-release` + automatic changelog (config staged, not yet enabled).
- Animated GIF docs.
- Codemod-style migration from `react-native-collapsible-tab-view` / `react-native-tab-view`.
