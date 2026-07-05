# Architecture

```
Expo Router (routes, URLs, deep links, history)   ← source of truth
        │  expo-router/ui headless tab navigator
        ▼
  <Tabs> ── parses <Tabs.Screen> → triggers → useTabsWithTriggers()
        │
        ▼  NavigationContent
  <TabsProvider>  (zustand stores + Reanimated shared values + router sync)
        ├── <Tabs.Header>    collapsible/sticky overlay  ┐ share one
        ├── <Tabs.TabBar>    sticky tab strip + Indicator ┘ collapse transform
        └── <Tabs.Slot>      PagerView → descriptors[key].render() per page
                 └── screen → <Tabs.FlatList/ScrollView/SectionList/FlashList>
```

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
| `hooks/useScrollSync` | Binds a list's scroll to the shared `scrollY` (when focused) and records each tab's offset. |
| `hooks/useCollapsibleHeader` | Derives the header/tab-bar transform + collapse progress from `scrollY`. |
| `stores/*` | Four isolated zustand stores (tab / pager / header / scroll). |
| `utils/math` | Pure, worklet-safe collapse + interpolation math (unit tested). |

## Data flow

**Vertical scroll** → focused list's `useAnimatedScrollHandler` writes `scrollY` (UI thread) → `useCollapsibleHeader` translates the header + tab bar → tab bar sticks at the top once the header is fully collapsed. No React state, no re-render.

**Horizontal swipe** → `PagerView.onPageScroll` (worklet) writes `pagerPosition` → `Indicator` interpolates x/width → on settle, `onPageSelected` calls `switchTab(name)` → Expo Router updates the URL/state → `TabsProvider`'s effect syncs `activeIndex` + restores the focused tab's collapse state.

**Tab press / deep link** → Expo Router changes `state.index` → `TabsProvider` effect calls `setPage(index)` on the pager and restores scroll/header state.

## Single responsibility

Every file has one job and a typed interface. The only module that touches Expo Router internals is `Slot` (+ the sync effect); everything else depends only on our own stores/shared values, so the components are independently testable and the Expo Router coupling is contained.
