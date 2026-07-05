import { useCallback, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ColorValue,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useStore } from 'zustand';

import { useCollapsibleHeader } from '../hooks/useCollapsibleHeader';
import { useTabsContext } from '../provider/context';
import { useRouterState } from '../provider/routerState';
import type { RegisteredTab, TabBarProps, TabLayout } from '../types';
import { Indicator } from './Indicator';

const DEFAULT_ACTIVE: ColorValue = '#000';
const DEFAULT_INACTIVE: ColorValue = '#8e8e8e';

/**
 * `<Tabs.TabBar />` — the sticky, swipe-aware tab strip. It measures each tab's
 * geometry into a shared value (so the indicator can interpolate), sticks to
 * the top once the header collapses, and delegates presses to Expo Router.
 */
export function TabBar(props: TabBarProps): ReactNode {
  const {
    scrollable = false,
    fixed = false,
    style,
    contentContainerStyle,
    tabStyle,
    labelStyle,
    activeColor = DEFAULT_ACTIVE,
    inactiveColor = DEFAULT_INACTIVE,
    indicatorStyle,
    showIndicator = true,
    renderTab,
    renderIndicator,
  } = props;

  const { tabStore, headerStore, shared, switchTab } = useTabsContext();
  const { state } = useRouterState();
  const order = useStore(tabStore, (s) => s.order);
  const tabsMap = useStore(tabStore, (s) => s.tabs);
  const { translateStyle } = useCollapsibleHeader();

  const headerHeight = useStore(headerStore, (s) => s.headerHeight);

  // Accumulate measurements in a stable plain-JS array. Reading back through the
  // shared value on every onLayout is unreliable — the getter does not always
  // reflect the immediately-prior write, so tabs would clobber each other and
  // only the last-measured tab would survive. A JS accumulator is deterministic;
  // we push a dense snapshot to the shared value for the indicator to read.
  const [measurements] = useState<{ layouts: TabLayout[] }>(() => ({ layouts: [] }));
  const setTabLayout = useCallback(
    (index: number, layout: TabLayout) => {
      measurements.layouts[index] = { x: layout.x, width: layout.width };
      shared.tabLayouts.value = measurements.layouts.slice();
    },
    [shared, measurements]
  );

  const onBarLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height;
      shared.tabBarHeight.value = height;
      headerStore.getState().setTabBarHeight(height);
    },
    [shared, headerStore]
  );

  const isScrollable = scrollable && !fixed;

  const tabs = order.map((name) => tabsMap[name]).filter((t): t is RegisteredTab => Boolean(t));

  const content = (
    <View
      style={[
        styles.row,
        isScrollable ? styles.rowScroll : styles.rowFixed,
        contentContainerStyle,
      ]}>
      {tabs.map((tab) => {
        const isFocused = tab.index === state.index;
        const onPress = () => {
          if (!tab.disabled) switchTab(tab.name);
        };
        const onLongPress = () => tab.listeners?.tabLongPress?.({ preventDefault: () => {} });
        const accessibilityState = { selected: isFocused, disabled: tab.disabled };

        if (renderTab) {
          return (
            <View
              key={tab.name}
              onLayout={(e) => setTabLayout(tab.index, e.nativeEvent.layout)}
              style={!isScrollable && styles.flex}>
              {renderTab({
                tab,
                isFocused,
                onPress,
                onLongPress,
                onLayout: (layout) => setTabLayout(tab.index, layout),
                accessibilityState,
              })}
            </View>
          );
        }

        return (
          <Pressable
            key={tab.name}
            onPress={onPress}
            onLongPress={onLongPress}
            disabled={tab.disabled}
            onLayout={(e) => setTabLayout(tab.index, e.nativeEvent.layout)}
            accessibilityRole="tab"
            accessibilityState={accessibilityState}
            accessibilityLabel={tab.options.title}
            style={[
              styles.tab,
              !isScrollable && styles.flex,
              tab.disabled && styles.disabled,
              tabStyle,
            ]}>
            <TabContent
              tab={tab}
              isFocused={isFocused}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              labelStyle={labelStyle}
            />
          </Pressable>
        );
      })}
      {showIndicator ? (
        <Indicator style={indicatorStyle}>
          {renderIndicator ? renderIndicator : undefined}
        </Indicator>
      ) : null}
    </View>
  );

  return (
    <Animated.View
      onLayout={onBarLayout}
      accessibilityRole="tablist"
      style={[styles.bar, { top: headerHeight }, translateStyle, style]}>
      {isScrollable ? (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {content}
        </Animated.ScrollView>
      ) : (
        content
      )}
    </Animated.View>
  );
}
TabBar.displayName = 'Tabs.TabBar';

function TabContent({
  tab,
  isFocused,
  activeColor,
  inactiveColor,
  labelStyle,
}: {
  tab: RegisteredTab;
  isFocused: boolean;
  activeColor: ColorValue;
  inactiveColor: ColorValue;
  labelStyle: TabBarProps['labelStyle'];
}) {
  const { shared } = useTabsContext();
  const { pagerPosition } = shared;
  const Icon = tab.options.icon;
  const badge = tab.options.badge;

  // Interpolate the label colour from the continuous pager position on the UI
  // thread, so the active tab transitions smoothly as you swipe — no discrete
  // flip, no React re-render.
  const labelColorStyle = useAnimatedStyle(() => {
    const i = tab.index;
    return {
      color: interpolateColor(
        pagerPosition.value,
        [i - 1, i, i + 1],
        [String(inactiveColor), String(activeColor), String(inactiveColor)]
      ),
    };
  }, [tab.index, activeColor, inactiveColor]);

  // Icons are arbitrary components that take a plain colour, so they still use
  // the discrete focused state.
  const iconColor = isFocused ? activeColor : inactiveColor;

  return (
    <View style={styles.tabContent}>
      {Icon ? <Icon focused={isFocused} color={iconColor} size={22} /> : null}
      <Animated.Text style={[styles.label, labelStyle, labelColorStyle]} numberOfLines={1}>
        {tab.options.title}
      </Animated.Text>
      {badge != null && badge !== 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
    backgroundColor: '#fff',
  },
  scrollContent: { flexGrow: 1 },
  row: { flexDirection: 'row', position: 'relative' },
  rowFixed: { flex: 1 },
  rowScroll: {},
  flex: { flex: 1 },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
