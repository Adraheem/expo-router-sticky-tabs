# expo-router-sticky-tabs

**Instagram-quality sticky headers, collapsible layouts and swipeable top tabs for [Expo Router](https://docs.expo.dev/router/introduction/).**

Headless. Reanimated-powered. New Architecture ready. It feels like a first-party Expo Router API — `<Tabs>`, `<Tabs.Screen>`, `<Tabs.Header>`, `<Tabs.TabBar>` — and **never replaces the router**. Expo Router stays the single source of truth for routes, URLs, deep links and history. This library only adds UI, layout, scroll/header synchronization and animation.

```tsx
// app/(profile)/_layout.tsx
import { Tabs } from 'expo-router-sticky-tabs';

export default function ProfileLayout() {
  return (
    <Tabs>
      <Tabs.Header collapsible sticky>
        <ProfileHeader />
      </Tabs.Header>

      <Tabs.TabBar />

      <Tabs.Screen name="posts" href="/posts" options={{ title: 'Posts' }} />
      <Tabs.Screen name="reels" href="/reels" options={{ title: 'Reels', badge: 3 }} />
      <Tabs.Screen name="tagged" href="/tagged" options={{ title: 'Tagged' }} />
    </Tabs>
  );
}
```

> The pager that lays out the tab screens is rendered automatically — there is no slot or container to add.

---

## Why

Building an Instagram/Threads/TikTok-style profile on Expo Router means reconciling two things that fight each other:

- A **swipeable pager** needs every tab mounted at once so you can swipe between them.
- Expo Router's `Slot` renders **one** active route at a time.

`expo-router-sticky-tabs` resolves this by building on Expo Router's **headless tab primitives** (`expo-router/ui`). Expo Router owns the routing state; a pager renders the mounted route screens; swipes and taps are synced back to the router. You get real routes (deep links, browser history, `router.navigate`) **and** buttery swipe + collapse. See [`docs/DESIGN_DECISIONS.md`](./docs/DESIGN_DECISIONS.md).

## Features

- 🧭 **Real Expo Router routes** — each tab is a file. Deep links, history and params just work.
- 👆 **Native swipe** via `react-native-pager-view` (gestures, velocity, RTL, a11y, virtualization).
- 📌 **Collapsible + sticky header** driven entirely by Reanimated shared values on the UI thread.
- 🔄 **Per-tab scroll sync** — each tab keeps its own scroll position, header state and indicator, restored on return (just like Instagram).
- 📜 **Drop-in list wrappers** — `Tabs.ScrollView`, `Tabs.FlatList`, `Tabs.SectionList`, `Tabs.FlashList`.
- 🎯 **Animated indicator** — pager-offset interpolation, width + colour interpolation, spring, custom renderers.
- ⚡ **Zero unnecessary re-renders** — separate zustand stores + shared values; the hot path never touches React state.
- ♿ **Accessible** — tab/tablist roles, selected state, Reduce Motion support.
- 🧩 **Strict TypeScript**, strong generics, no `any`, full IntelliSense.
- 📱 iOS · Android · Expo Go · New Architecture · Fabric · Hermes · React 19.

## Installation

```bash
npx expo install expo-router-sticky-tabs \
  expo-router react-native-reanimated react-native-gesture-handler \
  react-native-pager-view react-native-safe-area-context react-native-screens zustand
```

`@shopify/flash-list` is optional — install it only if you use `<Tabs.FlashList>`.

### 1. Babel (Reanimated)

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4: the worklets plugin must be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
```

> Using Reanimated 3? Use `'react-native-reanimated/plugin'` instead.

### 2. Root layout providers

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

## Quick start (Expo Router file layout)

```
app/
  _layout.tsx              # GestureHandlerRootView + SafeAreaProvider + Stack
  (profile)/
    _layout.tsx            # export default → <Tabs> … </Tabs>
    posts.tsx              # a tab screen (uses <Tabs.FlatList>)
    reels.tsx
    tagged.tsx
```

Each tab screen renders one of the synced list wrappers:

```tsx
// app/(profile)/posts.tsx
import { Tabs } from 'expo-router-sticky-tabs';

export default function Posts() {
  return (
    <Tabs.FlatList
      data={data}
      numColumns={3}
      keyExtractor={(i) => String(i)}
      renderItem={({ item }) => <Cell item={item} />}
    />
  );
}
```

That's it — scroll one tab, switch away and back: the offset, header collapse and indicator are all restored.

## API

### `<Tabs>` / `<Tabs.Provider>` / `TabsRoot`

| Prop | Default | Description |
| --- | --- | --- |
| `children` | — | Layout children plus `<Tabs.Screen>` declarations. |
| `initialRouteName` | First registered tab | The tab to focus initially. |
| `minHeaderHeight` | `0` | Minimum collapsed header height in px. |
| `disableAnimation` | `false` | Disables animated transitions and also applies under Reduce Motion. |
| `swipeEnabled` | `true` | Allow swiping between tabs (the pager is rendered automatically). |
| `overdrag` | `false` | Allow overscroll bounce at the pager edges. |
| `pagerStyle` | — | Style applied to the internal pager container. |

### `<Tabs.Screen>`

| Prop | Default | Description |
| --- | --- | --- |
| `name` | — | Route name; must match the Expo Router child route. |
| `href` | — | Destination href used for deep links and tab presses. |
| `options` | — | Tab-bar/header metadata such as `title`, `badge`, `icon` and `headerShown`. |
| `lazy` | `true` | Defers mounting until the tab is first focused. |
| `disabled` | `false` | Disables interaction and dims the tab. |
| `keepAlive` | `true` | Keeps the screen mounted after blur instead of freezing it. |
| `headerShown` | `true` | Shows the collapsible header for this screen. |
| `initialParams` | — | Params merged into the route when first navigated to. |
| `listeners` | — | Navigation listeners for route events. |
| `title` | `options.title` or `name` | Shortcut for the tab label. |
| `badge` | `options.badge` | Shortcut for the tab badge. |
| `icon` | `options.icon` | Shortcut for the tab icon. |

### `<Tabs.Header>`

| Prop | Default | Description |
| --- | --- | --- |
| `collapsible` | `true` | Allows the header to collapse while scrolling. |
| `sticky` | `true` | Keeps the header pinned while the content scrolls. |
| `parallax` | `false` | Applies subtle parallax/fade while collapsing. |
| `blur` | `false` | Reserved for blur-based header treatments. |
| `safeArea` | `true` | Adds the safe-area top inset. |
| `animated` | `true` | Enables the animated collapse/expand behavior. |
| `dynamicHeight` | `true` | Updates the animated height as the header measures. |
| `snap` | `false` | Enables snap-style collapse behavior. |
| `floating` | `false` | Renders the header as a floating overlay. |
| `children` | — | Custom header content. |
| `style` | — | Style applied to the header content container. |
| `background` | — | Full-bleed background layer rendered behind the content. |

### `<Tabs.TabBar>`

| Prop | Default | Description |
| --- | --- | --- |
| `scrollable` | `false` | Allows horizontal scrolling when there are many tabs. |
| `fixed` | `false` | Forces even-width, non-scrolling tabs. |
| `style` | — | Bar container style. |
| `contentContainerStyle` | — | Inner row/scroll container style. |
| `tabStyle` | — | Style applied to each tab button. |
| `labelStyle` | — | Style applied to the tab label text. |
| `activeColor` | `'#000'` | Active tab label/icon color. |
| `inactiveColor` | `'#8e8e8e'` | Inactive tab label/icon color. |
| `indicatorStyle` | — | Style applied to the built-in indicator. |
| `showIndicator` | `true` | Shows the built-in indicator. |
| `renderTab` | — | Fully custom tab renderer. |
| `renderIndicator` | — | Fully custom indicator renderer. |

### `<Tabs.Indicator>`

| Prop | Default | Description |
| --- | --- | --- |
| `style` | — | Style for the indicator view. |
| `interpolateWidth` | `true` | Interpolates the width from tab measurements. |
| `colors` | — | Optional color interpolation stops for the indicator. |
| `spring` | `false` | Uses Reanimated spring behavior instead of tracking the pager 1:1. |
| `children` | — | Custom renderer for the indicator. |

### List wrappers

| Component | Props | Default / behavior |
| --- | --- | --- |
| `<Tabs.ScrollView>` | Same props as React Native `ScrollView` | Auto-synced to the header and scroll restoration. |
| `<Tabs.FlatList>` | Same props as React Native `FlatList` | Auto-synced to the header and scroll restoration. |
| `<Tabs.SectionList>` | Same props as React Native `SectionList` | Auto-synced to the header and scroll restoration. |
| `<Tabs.FlashList>` | Same props as Shopify `FlashList` | Auto-synced to the header and scroll restoration. |

> Rendered **outside** `<Tabs>` (e.g. a list component reused on a non-tab screen), each wrapper transparently falls back to its plain primitive — same props and ref, no scroll-sync injection — so it never throws.

### `<Tabs.Lazy>`

| Prop | Default | Description |
| --- | --- | --- |
| `children` | — | Content to render once the tab has been focused. |
| `fallback` | `null` | Content shown before first focus. |
| `unmountOnBlur` | `false` | Unmounts children when the tab blurs instead of keeping them alive. |

### `<Tabs.Group>`

| Prop | Default | Description |
| --- | --- | --- |
| `children` | — | Nested screens and layout children. |
| `screenOptions` | `undefined` | Options merged into each nested `<Tabs.Screen>`. |

### Hooks

#### `useTabs()`

| Return value | Default | Description |
| --- | --- | --- |
| `tabs` | — | All registered tabs in order. |
| `activeName` | `null` | The focused tab name. |
| `activeIndex` | — | The focused tab index. |
| `switchTab(name)` | — | Switches to a tab by name. |
| `setPage(index)` | — | Moves the pager imperatively. |

#### `useCurrentTab()`

| Return value | Default | Description |
| --- | --- | --- |
| `tab` | `undefined` | The currently focused tab metadata. |
| `name` | `null` | The currently focused tab name. |
| `index` | — | The currently focused tab index. |

#### `usePager()`

| Return value | Default | Description |
| --- | --- | --- |
| `position` | — | Continuous pager position as a shared value. |
| `activeIndex` | — | Settled active index as a shared value. |
| `pageCount` | — | Number of registered pages. |
| `isDragging` | `false` | Whether the pager is currently being dragged. |
| `isSettling` | `false` | Whether the pager is settling after a gesture. |
| `setPage(index)` | — | Moves the pager to a page index. |

#### `useHeader()`

| Return value | Default | Description |
| --- | --- | --- |
| `height` | `0` | Measured full header height. |
| `tabBarHeight` | `0` | Measured tab bar height. |
| `config` | Header defaults | Resolved header behavior configuration. |
| `headerOffset` | — | Shared collapse offset. |
| `headerHeight` | — | Shared header height value. |
| `minHeaderHeight` | — | Shared minimum collapsed header height. |

#### `useIndicator()`

| Return value | Default | Description |
| --- | --- | --- |
| `pagerPosition` | — | Continuous pager position for custom indicators. |
| `activeIndex` | — | Settled active index. |
| `tabLayouts` | — | Measured tab geometry as a shared value. |

#### `useScrollSync()`

| Return value | Default | Description |
| --- | --- | --- |
| `scrollHandler` | — | Reanimated scroll handler for the list. |
| `animatedRef` | — | Animated ref for imperative scrolling. |
| `topInset` | — | Top padding required above the list content. |
| `initialOffset` | `0` | Initial scroll offset restored from the shared collapse state. |
| `scrollEventThrottle` | `16` | Recommended scroll event throttle. |

#### `useTabMeasurements()`

| Return value | Default | Description |
| --- | --- | --- |
| `SharedValue<TabLayout[]>` | — | Measured tab geometry for indicator rendering. |

#### `useCollapsibleHeader()`

| Return value | Default | Description |
| --- | --- | --- |
| `translateStyle` | — | Animated transform style for the header/tab bar. |
| `parallaxStyle` | — | Optional parallax/fade style. |
| `progress` | — | Collapse progress from `0` to `1`. |
| `config` | Header defaults | Resolved header behavior configuration. |

#### `useTabsContext()` / `useTabScreen()`

| Return value | Default | Description |
| --- | --- | --- |
| Internal context values | — | Advanced composition hooks for custom integrations inside a `<Tabs>` tree. |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Design decisions](./docs/DESIGN_DECISIONS.md)
- [Performance guide](./docs/PERFORMANCE.md)
- [Accessibility](./docs/ACCESSIBILITY.md)
- [Migration guide](./docs/MIGRATION.md)

## Example app

A full Instagram-style profile lives in [`example/`](./example):

```bash
cd example
npx expo start
```

## Compatibility

| | Version |
|---|---|
| Expo SDK | 54+ (built and tested on 57) |
| React | 19 |
| React Native | 0.79+ (New Architecture / Fabric / Hermes) |
| expo-router | 3.5+ |
| Platforms | iOS · Android · Expo Go |

> Web is on the [roadmap](./docs/DESIGN_DECISIONS.md#roadmap) (native pagers don't render on web; a scroll-snap implementation is planned).

## License

MIT © Raheem Adebayo
