import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTabsContext } from '../provider/context';
import type { IndicatorProps } from '../types';
import { clamp, indicatorWidth, indicatorX } from '../utils/math';

/**
 * `<Tabs.Indicator />` — the moving underline. It interpolates position, width
 * and (optionally) colour from the continuous pager offset entirely on the UI
 * thread, so it tracks the user's finger with zero React re-renders.
 */
export function Indicator(props: IndicatorProps): ReactNode {
  const { style, interpolateWidth = true, colors, spring = false, children } = props;
  const { shared } = useTabsContext();
  const { pagerPosition, activeIndex, tabLayouts, reducedMotion } = shared;

  // When spring/reduced-motion is requested we settle to the active index;
  // otherwise we track the pager 1:1 for finger-following.
  const position = useDerivedValue(() => {
    if (reducedMotion.value === 1) return activeIndex.value;
    return spring
      ? withSpring(activeIndex.value, { damping: 20, stiffness: 200 })
      : pagerPosition.value;
  }, [spring]);

  const animatedStyle = useAnimatedStyle(() => {
    const layouts = tabLayouts.value;
    const count = layouts.length;
    const pos = position.value;
    const idx = count > 0 ? Math.round(clamp(pos, 0, count - 1)) : 0;
    // Stay hidden until the active tab's geometry has actually been measured
    // (tabs report their layout one at a time).
    if (count === 0 || !layouts[idx]) {
      return { opacity: 0, width: 0, transform: [{ translateX: 0 }] };
    }
    const x = indicatorX(pos, layouts);
    const width = interpolateWidth ? indicatorWidth(pos, layouts) : layouts[idx].width;

    const base = { opacity: 1, width, transform: [{ translateX: x }] };
    if (colors && colors.length >= 2) {
      const inputRange = colors.map((_, i) => (i * (layouts.length - 1)) / (colors.length - 1));
      return {
        ...base,
        backgroundColor: interpolateColor(pos, inputRange, colors as string[]),
      };
    }
    return base;
  }, [interpolateWidth, colors]);

  if (children) {
    return children({ animatedStyle: animatedStyle as unknown as StyleProp<ViewStyle> });
  }

  return <Animated.View pointerEvents="none" style={[styles.indicator, style, animatedStyle]} />;
}
Indicator.displayName = 'Tabs.Indicator';

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#000',
  },
});
