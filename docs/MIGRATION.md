# Migration guide

## From `react-native-collapsible-tab-view`

Both give you a collapsible header + swipeable tabs. The key difference: **here each tab is a real Expo Router route**, not an inline component.

| collapsible-tab-view | expo-router-sticky-tabs |
|---|---|
| `<Tabs.Container renderHeader>` | `<Tabs><Tabs.Header>…</Tabs.Header>` |
| `<Tabs.Tab name="…">` with inline children | `<Tabs.Screen name href>` + a route file (`name.tsx`) |
| `<Tabs.FlatList>` | `<Tabs.FlatList>` (same idea, auto-synced) |
| `useCurrentTabScrollY` | `useHeader().scrollY` / `useScrollSync` |
| Tab bar via `renderTabBar` | `<Tabs.TabBar renderTab>` |

Steps:

1. Move each inline tab body into its own route file inside the layout folder (`posts.tsx`, `reels.tsx`, …).
2. Replace `<Tabs.Container>` with `<Tabs>` in the folder's `_layout.tsx`, and declare `<Tabs.Screen name href>` for each route.
3. Swap the header render prop for `<Tabs.Header>` children, add `<Tabs.TabBar>` and `<Tabs.Slot>`.
4. Replace the list components with `Tabs.FlatList` / `Tabs.ScrollView` etc.

You gain: real URLs, deep links, browser history and `router.navigate` for free.

## From `react-native-tab-view`

`react-native-tab-view` is routing-agnostic and uses a `navigationState` you manage yourself. Migrating means letting Expo Router own that state:

1. Delete your `navigationState`/`index`/`routes` and `onIndexChange` — Expo Router's tab router replaces them.
2. Turn each `SceneMap` scene into a route file.
3. Replace `<TabView renderTabBar>` with `<Tabs.TabBar>` (or a custom `renderTab`).
4. Use `useTabs()` / `useCurrentTab()` where you previously read `index`.

## From Expo Router's own `Tabs` (bottom tabs)

If you were faking top tabs with bottom `Tabs`:

1. Keep your route files as-is.
2. In the layout, replace `<Tabs>` (from `expo-router`) with `<Tabs>` (from `expo-router-sticky-tabs`), add `<Tabs.Header>`, `<Tabs.TabBar>` and `<Tabs.Slot>`, and declare `<Tabs.Screen name href>`.
3. Remove bottom-tab-specific options; use `<Tabs.Screen options>` (`title`, `badge`, `icon`).
