# expo-router-sticky-tabs

**Instagram-quality sticky headers, collapsible layouts and swipeable top tabs for [Expo Router](https://docs.expo.dev/router/introduction/).**

Headless. Reanimated-powered. New Architecture ready. It feels like a first-party Expo Router API — `<Tabs>`, `<Tabs.Screen>`, `<Tabs.Header>`, `<Tabs.TabBar>`, `<Tabs.Slot>` — and **never replaces the router**. Expo Router stays the single source of truth for routes, URLs, deep links and history. This library only adds UI, layout, scroll/header synchronization and animation.

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

      <Tabs.Slot />
    </Tabs>
  );
}
```

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

### `<Tabs>` / `<Tabs.Provider>`

Root. Parses `<Tabs.Screen>` declarations into Expo Router triggers and provides the animated context. Props: `initialRouteName?`, `minHeaderHeight?`, `disableAnimation?`.

### `<Tabs.Screen>`

Declarative route registration (renders `null`). Props: `name`, `href`, `options` (`title`, `badge`, `icon`, `headerShown`), `lazy`, `disabled`, `keepAlive`, `initialParams`, `listeners`, plus `title`/`badge`/`icon` shortcuts.

### `<Tabs.Header>`

Collapsible/sticky overlay. Props: `collapsible`, `sticky`, `parallax`, `blur`, `background`, `safeArea`, `animated`, `dynamicHeight`, `snap`, `floating`. Fully custom children.

### `<Tabs.TabBar>`

Props: `scrollable`, `fixed`, `indicatorStyle`, `tabStyle`, `labelStyle`, `activeColor`, `inactiveColor`, `showIndicator`, `renderTab`, `renderIndicator`.

### `<Tabs.Indicator>`

Reanimated indicator. Props: `interpolateWidth`, `colors`, `spring`, custom `children` render fn. Usable standalone.

### `<Tabs.Slot>`

The pager host. Renders the mounted route screens as swipeable pages. Props: `swipeEnabled`, `overdrag`.

### List wrappers

`<Tabs.ScrollView>`, `<Tabs.FlatList>`, `<Tabs.SectionList>`, `<Tabs.FlashList>` — drop-in, generic, auto-synced (top inset, header sync, offset restore, pull-to-refresh).

### `<Tabs.Lazy>` / `<Tabs.Group>`

`Lazy` defers expensive content until its tab is focused. `Group` flattens grouped `<Tabs.Screen>` declarations with shared `screenOptions`.

### Hooks

`useTabs`, `useCurrentTab`, `usePager`, `useHeader`, `useIndicator`, `useScrollSync`, `useTabMeasurements`, `useCollapsibleHeader`.

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
