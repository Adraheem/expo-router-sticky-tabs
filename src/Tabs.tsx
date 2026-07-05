import { Group } from './components/Group';
import { Header } from './components/Header';
import { Indicator } from './components/Indicator';
import { Lazy } from './components/Lazy';
import { Screen } from './components/Screen';
import { Slot } from './components/Slot';
import { TabBar } from './components/TabBar';
import { TabsRoot } from './components/TabsRoot';
import { TabsFlashList } from './lists/FlashList';
import { TabsFlatList } from './lists/FlatList';
import { TabsScrollView } from './lists/ScrollView';
import { TabsSectionList } from './lists/SectionList';

/**
 * The single entry point. Mirrors Expo Router's `Stack` / `Tabs` compound
 * component pattern, so `<Tabs>`, `<Tabs.Screen>`, `<Tabs.Header>` and friends
 * read exactly like first-party Expo Router APIs.
 *
 * @example
 * ```tsx
 * <Tabs>
 *   <Tabs.Header><ProfileHeader /></Tabs.Header>
 *   <Tabs.TabBar />
 *   <Tabs.Screen name="posts" href="/(profile)/posts" />
 *   <Tabs.Screen name="reels" href="/(profile)/reels" />
 *   <Tabs.Slot />
 * </Tabs>
 * ```
 */
export const Tabs = Object.assign(TabsRoot, {
  /** Alias of the root for advanced composition. */
  Provider: TabsRoot,
  Screen,
  Header,
  TabBar,
  Indicator,
  Slot,
  Lazy,
  Group,
  ScrollView: TabsScrollView,
  FlatList: TabsFlatList,
  FlashList: TabsFlashList,
  SectionList: TabsSectionList,
});
