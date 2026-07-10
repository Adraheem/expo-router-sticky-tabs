# Architecture

```
Expo Router (routes, URLs, deep links, history)   ← source of truth
        │  expo-router/ui headless tab navigator
        ▼
  <Tabs> ── parses <Tabs.Screen> → triggers → useTabsWithTriggers()
        │
        ▼  NavigationContent
  <TabsProvider>  (zustand stores + Reanimated shared values + router sync + scroll coordinator)
        ├── <Tabs.Header>    collapsible/sticky overlay  ┐ share one collapse transform,
        ├── <Tabs.TabBar>    sticky tab strip + Indicator ┘ driven by `headerOffset`
        └── <Tabs.Slot>      PagerView → descriptors[key].render() per page
                 └── screen → <Tabs.FlatList/ScrollView/SectionList/FlashList>
```

## The header is shared layout, not per-tab state

`headerOffset` (a Reanimated shared value ∈ `[0, collapsibleDistance]`) is the **single source of
truth** for the header + tab-bar transform. It has exactly one writer: the focused list's scroll
worklet. Nothing else — not a tab switch, `setPage`, deep link, route restore or lazy mount — is
allowed to write it. Every other event can only move *tabs*, and the **scroll coordinator**
reconciles a tab TO the header (pinning it under the collapsed bar when it would otherwise sit
behind the collapse). This is why switching tabs never expands, collapses or repositions the header.

## Modules & responsibilities

| Module | Responsibility |
|---|---|
| `components/TabsRoot` | Parse `<Tabs.Screen>` into triggers, build the headless navigator, mount `NavigationContent`. |
| `provider/TabsProvider` | Create stores + shared values (stable identity), sync router state → animated layer, expose context. |
| `provider/context` | The stable `TabsContext` (stores, shared values, `switchTab`, `setPage`). |
| `provider/routerState` | Lightweight view of `{ state, descriptors, switchTab }` consumed by `Slot`/`TabBar`. |
| `provider/screenContext` | Per-page `{ name, index }` so list wrappers know their tab. |
| `components/Slot` | The pager host: maps `state.routes → descriptors[key].render()`, drives `pagerPosition`, syncs swipe → router. |
| `components/Header` | Measures itself, applies the collapse transform + parallax/safe-area. |
| `components/TabBar` | Renders triggers, measures tab layouts into `tabLayouts`, sticks via the shared transform, hosts the `Indicator`. |
| `components/Indicator` | Interpolates x/width/colour from `pagerPosition` + `tabLayouts` on the UI thread. |
| `lists/*` | Drop-in list wrappers over the reanimated animated components + `useScrollSync`. |
| `hooks/useScrollSync` | The **only** writer of `headerOffset`: the focused tab's genuine vertical scroll drives the collapse; every tab records its own offset + seeds its initial `contentOffset` from the current collapse. |
| `hooks/useScrollCoordinator` | The central coordinator: reconciles tabs TO `headerOffset` (pin-if-behind) on tab switch, swipe reveal and lazy mount. Never writes `headerOffset`. |
| `hooks/useCollapsibleHeader` | Derives the header/tab-bar transform + collapse progress from `headerOffset` (shared layout state), never from a per-tab offset. |
| `stores/*` | Four isolated zustand stores (tab / pager / header / scroll). |
| `utils/math` | Pure, worklet-safe collapse + interpolation math (unit tested). |

## Data flow

**Vertical scroll (the ONLY thing that moves the header)** → focused list's `useAnimatedScrollHandler` writes `headerOffset = clamp(y, 0, collapsibleDistance)` (UI thread) → `useCollapsibleHeader` translates the header + tab bar → tab bar sticks at the top once the header is fully collapsed. Each tab also records its own `lastOffset`. No React state, no re-render.

**Horizontal swipe** → on drag start the coordinator pins the neighbours to `headerOffset` (no gap on reveal) → `PagerView.onPageScroll` (worklet) writes `pagerPosition` → `Indicator` interpolates x/width → `onPageSelected` reconciles the revealed tab via `syncTabToHeader` → on settle, `switchTab(name)` updates Expo Router. **`headerOffset` is never touched** — the swipe only moves tabs.

**Tab press / deep link / restore** → Expo Router changes `state.index` → `TabsProvider` effect syncs `activeIndex`, calls `syncTabToHeader(activeName)` (pin the incoming tab to the current collapse) and `setPage(index)`. The header stays exactly where the last vertical scroll left it. A lazy tab that mounts now starts already-pinned via its initial `contentOffset`.

## Single responsibility

Every file has one job and a typed interface. The only module that touches Expo Router internals is `Slot` (+ the sync effect); everything else depends only on our own stores/shared values, so the components are independently testable and the Expo Router coupling is contained.
