# Performance guide

The library is designed so the interactive hot path (scrolling, swiping) **never touches React state**. Benchmark target: Instagram / Threads / Twitter-class smoothness on mid-range devices.

## What runs where

| Work | Thread | Mechanism |
|---|---|---|
| Header collapse | UI | `scrollY` shared value → `useAnimatedStyle` |
| Indicator position/width/colour | UI | `pagerPosition` + `tabLayouts` → `useAnimatedStyle` |
| Pager position tracking | UI | `onPageScroll` worklet → `pagerPosition` |
| Tab switch (infrequent) | JS | Expo Router navigation + one shared-value write |

No scroll or swipe frame crosses the bridge or triggers a render.

## Why re-renders stay near zero

- **Stable context.** `TabsContext` holds only stable references (store APIs, shared values, memoized callbacks). Its identity never changes, so consumers don't re-render when animations run.
- **Selective store subscriptions.** Components read exactly the slice they need via `useStore(store, selector)`; hot writes go to shared values or `store.getState()` (non-reactive).
- **Shared values over state.** Heights, offsets and positions live in Reanimated shared values, mutated on the UI thread.
- **Deduped store writes.** Every store setter returns the previous state object when nothing changed, so subscribers don't re-render on no-op updates (and sub-pixel height changes are ignored).

## Mounting & memory

- **Lazy tabs.** `<Tabs.Screen lazy>` (default) and `<Tabs.Lazy>` defer mounting a tab until first focus.
- **Screens stay mounted** after first visit (via `react-native-screens`), so scroll offset is preserved for free — no save/restore round-trips.
- **Virtualization preserved.** `<Tabs.Scroll>` re-creates the detected list in place (no wrapper view), so `FlatList`/`SectionList` keep windowing and `FlashList` keeps its recycling.

## Tips

- Prefer a `FlashList` (wrapped in `<Tabs.Scroll>`) for long, uniform lists.
- Memoize `renderItem` and use stable `keyExtractor`.
- Give a `FlatList` a `getItemLayout` when cell size is fixed.
- Set `minHeaderHeight` on `<Tabs>` if you want the header to stay partly visible when collapsed (avoids re-measuring).
- Keep `<Tabs.Header>` content cheap; heavy header content can use `dynamicHeight` measurement but should avoid layout thrash.
