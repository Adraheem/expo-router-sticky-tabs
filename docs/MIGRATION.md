# Migration guide

## Upgrading within `expo-router-sticky-tabs`

### `scrollY` → `headerOffset` (breaking)

The shared value that drives the header was renamed and re-scoped. Previously `scrollY` was the
focused tab's raw offset and *also* the header driver, which meant switching to a less-scrolled tab
expanded the header. It is replaced by **`headerOffset`**: the shared collapse amount ∈
`[0, collapsibleDistance]`, owned by the layout and moved only by genuine vertical scrolling.

```diff
- const { scrollY } = useHeader();
- // scrollY: raw offset of whichever tab is focused; changed on every tab switch
+ const { headerOffset } = useHeader();
+ // headerOffset: shared collapse ∈ [0, collapsibleDistance]; unaffected by tab switches
```

The same field renamed on the `TabsSharedValues` type (`shared.scrollY` → `shared.headerOffset`). If
you need a specific tab's raw scroll offset, read it from `useScrollSync` inside that tab instead.

### List wrappers + `<Tabs.Slot>` → `<Tabs.Scroll>` (breaking)

The four `Tabs.FlatList` / `Tabs.ScrollView` / `Tabs.SectionList` / `Tabs.FlashList` wrappers and the
explicit `<Tabs.Slot />` were removed. The pager now renders automatically, and one auto-detecting
`<Tabs.Scroll>` replaces the four wrappers — write a plain React Native list and it is synced for you.

**In each tab screen** — wrap the plain list:

```diff
  import { Tabs } from 'expo-router-sticky-tabs';
+ import { FlatList } from 'react-native';

  export default function Posts() {
-   return <Tabs.FlatList data={data} renderItem={renderItem} />;
+   return (
+     <Tabs.Scroll>
+       <FlatList data={data} renderItem={renderItem} />
+     </Tabs.Scroll>
+   );
  }
```

**In the layout** — delete `<Tabs.Slot />`; the pager renders itself:

```diff
    <Tabs.Screen name="tagged" href="/tagged" />
-   <Tabs.Slot />
  </Tabs>
```

Configure the pager (swipe / overscroll) via the `pager` prop on `<Tabs>` —
`<Tabs pager={{ swipeEnabled: false }}>`. For a list `<Tabs.Scroll>` can't reach (hidden behind your
own component), spread `useStickyScroll()` onto a Reanimated `Animated.*` list instead.

## From `react-native-collapsible-tab-view`

Both give you a collapsible header + swipeable tabs. The key difference: **here each tab is a real Expo Router route**, not an inline component.

| collapsible-tab-view | expo-router-sticky-tabs |
|---|---|
| `<Tabs.Container renderHeader>` | `<Tabs><Tabs.Header>…</Tabs.Header>` |
| `<Tabs.Tab name="…">` with inline children | `<Tabs.Screen name href>` + a route file (`name.tsx`) |
| `<Tabs.FlatList>` | `<Tabs.Scroll><FlatList/></Tabs.Scroll>` (auto-detected) |
| `useCurrentTabScrollY` | `useHeader().headerOffset` / `useScrollSync` |
| Tab bar via `renderTabBar` | `<Tabs.TabBar renderTab>` |

Steps:

1. Move each inline tab body into its own route file inside the layout folder (`posts.tsx`, `reels.tsx`, …).
2. Replace `<Tabs.Container>` with `<Tabs>` in the folder's `_layout.tsx`, and declare `<Tabs.Screen name href>` for each route.
3. Swap the header render prop for `<Tabs.Header>` children and add `<Tabs.TabBar>` (the pager renders automatically).
4. Wrap each list in `<Tabs.Scroll>` (a plain React Native `FlatList` / `ScrollView` / …).

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
2. In the layout, replace `<Tabs>` (from `expo-router`) with `<Tabs>` (from `expo-router-sticky-tabs`), add `<Tabs.Header>` and `<Tabs.TabBar>`, and declare `<Tabs.Screen name href>` (the pager renders automatically).
3. Remove bottom-tab-specific options; use `<Tabs.Screen options>` (`title`, `badge`, `icon`).
