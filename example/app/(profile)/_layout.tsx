import { Tabs } from 'expo-router-sticky-tabs';

import { GridIcon, ReelsIcon, TaggedIcon } from '../../components/icons';
import { ProfileHeader } from '../../components/ProfileHeader';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Expo Router 58+ reads the tabs' initial route from here; `<Tabs initialRouteName>`
// only applies on older versions.
export const unstable_settings = { anchor: 'posts' };

// The tab bar scrolls once its tabs no longer fit the safe width. Flip this to
// `false` to cram every tab into the available width instead.
const SCROLLABLE = true;

/**
 * The profile is a normal Expo Router layout route. `<Tabs>` adds the sticky
 * collapsible header, swipeable pager and synced scrolling on top — Expo Router
 * still owns the routes (`/posts`, `/reels`, `/tagged`, …), URLs and deep links.
 *
 * The tab bar keeps its own tabs inside the left/right safe area; the header and
 * the screens' content handle their own insets.
 */
export default function ProfileLayout() {
  const { top, left, right } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View
        style={{
          paddingTop: top,
          paddingBottom: 8,
          paddingLeft: 16 + left,
          paddingRight: 16 + right,
          backgroundColor: 'white',
          zIndex: 10,
        }}>
        <Text>Fixed Header</Text>
      </View>
      <Tabs initialRouteName="posts">
        <Tabs.Header collapsible sticky safeArea={false} parallax={false}>
          <View style={{ paddingLeft: left, paddingRight: right, backgroundColor: 'white' }}>
            <ProfileHeader />
          </View>
        </Tabs.Header>

        <Tabs.TabBar scrollable={SCROLLABLE} />

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
        <Tabs.Screen name="saved" href="/saved" options={{ title: 'Saved' }} />
        <Tabs.Screen name="highlights" href="/highlights" options={{ title: 'Highlights' }} />
        <Tabs.Screen name="mentions" href="/mentions" options={{ title: 'Mentions' }} />
      </Tabs>
    </View>
  );
}
