import { useCallback, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ColorValue,
} from 'react-native';
import Animated, {
  interpolateColor,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useStore } from 'zustand';

import { Indicator } from './Indicator';
import { useCollapsibleHeader } from '../hooks/useCollapsibleHeader';
import { useHorizontalSafeArea } from '../hooks/useHorizontalSafeArea';
import { useTabsContext } from '../provider/context';
import { useRouterState } from '../provider/routerState';
import type { RegisteredTab, TabBarProps, TabLayout } from '../types';
import { tabBarScrollOffset } from '../utils/math';

const DEFAULT_ACTIVE: ColorValue = '#000';
const DEFAULT_INACTIVE: ColorValue = '#8e8e8e';

/**
 * `<Tabs.TabBar />` — the sticky, swipe-aware tab strip. It measures each tab's
 * geometry into a shared value (so the indicator can interpolate), sticks to
 * the top once the header collapses, and delegates presses to Expo Router.
 *
 * The band spans the full width, into the safe area; only the tabs are inset,
 * by however far the band reaches into the left/right insets. By default the
 * tabs fill the band and scroll once they no longer fit; `scrollable={false}`
 * crams them into the available width instead.
 */
export function TabBar(props: TabBarProps): ReactNode {
  const {
    scrollable = true,
    fixed = false,
    safeArea = true,
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
  const { ref: bandRef, onLayout: onBandLayout, insets } = useHorizontalSafeArea(safeArea);

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

  // Keep the active tab in view: follow the pager on the UI thread and centre
  // the tab within the safe part of the bar. This only runs when the pager or
  // the geometry changes, so it never fights the user dragging the bar itself.
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const viewportWidth = useSharedValue(0);
  const contentWidth = useSharedValue(0);
  const { pagerPosition, activeIndex, tabLayouts, reducedMotion } = shared;
  const insetLeft = insets.left;
  const insetRight = insets.right;
  useAnimatedReaction(
    () => {
      const position = reducedMotion.value === 1 ? activeIndex.value : pagerPosition.value;
      return tabBarScrollOffset(
        position,
        tabLayouts.value,
        viewportWidth.value,
        contentWidth.value,
        insetLeft,
        insetRight
      );
    },
    (offset, previous) => {
      if (!isScrollable || offset === previous) return;
      scrollTo(scrollRef, offset, 0, false);
    }
  );

  const tabs = order.map((name) => tabsMap[name]).filter((t): t is RegisteredTab => Boolean(t));
  const tabSizeStyle = isScrollable ? styles.tabGrow : styles.flex;

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
              style={tabSizeStyle}>
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
            style={[styles.tab, tabSizeStyle, tab.disabled && styles.disabled, tabStyle]}>
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

  const insetStyle = { paddingLeft: insets.left, paddingRight: insets.right };

  return (
    <Animated.View
      onLayout={onBarLayout}
      accessibilityRole="tablist"
      style={[styles.bar, { top: headerHeight }, translateStyle, style]}>
      <View ref={bandRef} onLayout={onBandLayout} collapsable={false}>
        {isScrollable ? (
          // The scroller spans the whole band and only its content is inset, so
          // the first/last tabs rest inside the safe area but can slide under
          // the insets mid-scroll.
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            alwaysBounceHorizontal={false}
            onLayout={(e) => {
              viewportWidth.value = e.nativeEvent.layout.width;
            }}
            onContentSizeChange={(width) => {
              contentWidth.value = width;
            }}
            contentContainerStyle={[styles.scrollContent, insetStyle]}>
            {content}
          </Animated.ScrollView>
        ) : (
          <View style={insetStyle}>{content}</View>
        )}
      </View>
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
  });

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
  rowScroll: { flexGrow: 1 },
  flex: { flex: 1 },
  // Natural width plus an equal share of any leftover space; never shrinks, so
  // tabs that don't fit overflow the row and the bar scrolls.
  tabGrow: { flexGrow: 1, flexShrink: 0 },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `maxWidth` + a shrinking label let crammed tabs ellipsize instead of
  // overflowing into their neighbours.
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  label: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
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
