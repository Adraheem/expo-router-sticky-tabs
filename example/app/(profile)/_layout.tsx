import { Tabs } from 'expo-router-sticky-tabs';

import { GridIcon, ReelsIcon, TaggedIcon } from '../../components/icons';
import { ProfileHeader } from '../../components/ProfileHeader';

/**
 * The profile is a normal Expo Router layout route. `<Tabs>` adds the sticky
 * collapsible header, swipeable pager and synced scrolling on top — Expo Router
 * still owns the routes (`/posts`, `/reels`, `/tagged`), URLs and deep links.
 */
export default function ProfileLayout() {
  return (
    <Tabs initialRouteName="posts">
      <Tabs.Header collapsible sticky safeArea>
        <ProfileHeader />
      </Tabs.Header>

      <Tabs.TabBar />

      <Tabs.Screen name="posts" href="/posts" options={{ title: 'Posts', icon: GridIcon }} />
      <Tabs.Screen
        name="reels"
        href="/reels"
        options={{ title: 'Reels', icon: ReelsIcon, badge: 3 }}
      />
      <Tabs.Screen name="tagged" href="/tagged" options={{ title: 'Tagged', icon: TaggedIcon }} />

      <Tabs.Slot />
    </Tabs>
  );
}
