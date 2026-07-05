import { useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStore } from 'zustand';

import { useTabsContext } from '../provider/context';
import type { HeaderConfig } from '../types';
import { clamp, collapseProgress, headerTranslateY } from '../utils/math';

export interface CollapsibleHeader {
  /** Transform applied to the sticky header + tab bar overlay. */
  translateStyle: ReturnType<typeof useAnimatedStyle>;
  /** Optional parallax + fade applied to header content. */
  parallaxStyle: ReturnType<typeof useAnimatedStyle>;
  /** `0` expanded → `1` collapsed, on the UI thread. */
  progress: SharedValue<number>;
  /** Resolved header behaviour config. */
  config: HeaderConfig;
}

/**
 * Derives the collapsible header animation from the shared `scrollY` on the UI
 * thread. Consumed by `<Tabs.Header />` and `<Tabs.TabBar />` so they translate
 * together and the tab bar sticks once the header is fully collapsed.
 */
export function useCollapsibleHeader(): CollapsibleHeader {
  const { shared, headerStore } = useTabsContext();
  const { scrollY, headerHeight, minHeaderHeight, reducedMotion } = shared;
  const config = useStore(headerStore, (s) => s.config);

  const progress = useDerivedValue(() =>
    collapseProgress(scrollY.value, headerHeight.value, minHeaderHeight.value)
  );

  const collapsible = config.collapsible;
  const parallax = config.parallax;

  const translateStyle = useAnimatedStyle(() => {
    if (!collapsible) {
      return { transform: [{ translateY: 0 }] };
    }
    return {
      transform: [
        { translateY: headerTranslateY(scrollY.value, headerHeight.value, minHeaderHeight.value) },
      ],
    };
  }, [collapsible]);

  const parallaxStyle = useAnimatedStyle(() => {
    if (reducedMotion.value === 1) {
      return { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] };
    }
    const p = progress.value;
    if (parallax) {
      // Content drifts up at half speed and fades as the header collapses.
      const drift = clamp(scrollY.value, 0, headerHeight.value) * 0.5;
      return { opacity: 1 - p * 0.85, transform: [{ translateY: drift }, { scale: 1 }] };
    }
    return { opacity: 1 - p * 0.6, transform: [{ translateY: 0 }, { scale: 1 }] };
  }, [parallax]);

  return { translateStyle, parallaxStyle, progress, config };
}
