import { Tabs } from 'expo-router-sticky-tabs';

import { GridIcon, ReelsIcon, TaggedIcon } from '../../components/icons';
import { ProfileHeader } from '../../components/ProfileHeader';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The profile is a normal Expo Router layout route. `<Tabs>` adds the sticky
 * collapsible header, swipeable pager and synced scrolling on top — Expo Router
 * still owns the routes (`/posts`, `/reels`, `/tagged`), URLs and deep links.
 */
export default function ProfileLayout() {
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View
        style={{
          paddingTop: top,
          paddingBottom: 8,
          paddingHorizontal: 16,
          backgroundColor: 'white',
          zIndex: 10,
        }}>
        <Text>Fixed Header</Text>
      </View>
      <Tabs initialRouteName="posts">
        <Tabs.Header collapsible sticky safeArea={false} parallax={false}>
          <ProfileHeader />
        </Tabs.Header>

        <Tabs.TabBar />

        <Tabs.Screen
          name="posts"
          href="/posts"
          options={{ title: 'Posts', icon: GridIcon }}
          lazy={false}
        />
        <Tabs.Screen
          name="reels"
          href="/reels"
          options={{ title: 'Reels', icon: ReelsIcon, badge: 3 }}
          lazy={false}
        />
        <Tabs.Screen
          name="tagged"
          href="/tagged"
          options={{ title: 'Tagged', icon: TaggedIcon }}
          lazy={false}
        />

        <Tabs.Slot />
      </Tabs>
    </View>
  );
}
