import { Group } from './components/Group';
import { Header } from './components/Header';
import { Indicator } from './components/Indicator';
import { Lazy } from './components/Lazy';
import { Screen } from './components/Screen';
import { TabsScroll } from './components/Scroll';
import { TabBar } from './components/TabBar';
import { TabsRoot } from './components/TabsRoot';

/**
 * The single entry point. Mirrors Expo Router's `Stack` / `Tabs` compound
 * component pattern, so `<Tabs>`, `<Tabs.Screen>`, `<Tabs.Header>` and friends
 * read exactly like first-party Expo Router APIs.
 *
 * The pager is rendered automatically — screens display without a slot. Inside
 * each screen, wrap the list in `<Tabs.Scroll>` to sync it with the header.
 *
 * @example
 * ```tsx
 * // layout
 * <Tabs>
 *   <Tabs.Header><ProfileHeader /></Tabs.Header>
 *   <Tabs.TabBar />
 *   <Tabs.Screen name="posts" href="/(profile)/posts" />
 *   <Tabs.Screen name="reels" href="/(profile)/reels" />
 * </Tabs>
 *
 * // a screen
 * <Tabs.Scroll>
 *   <FlatList data={data} renderItem={renderItem} />
 * </Tabs.Scroll>
 * ```
 */
export const Tabs = Object.assign(TabsRoot, {
  /** Alias of the root for advanced composition. */
  Provider: TabsRoot,
  Screen,
  Header,
  TabBar,
  Indicator,
  Lazy,
  Group,
  Scroll: TabsScroll,
});
