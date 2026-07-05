import { forwardRef } from 'react';
import type { ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScrollSync } from '../hooks/useScrollSync';
import { mergeRefs } from '../utils/mergeRefs';

export type TabsScrollViewProps = ScrollViewProps;

/**
 * A drop-in `ScrollView` that auto-synchronises its tab's scroll position with
 * the collapsible header. Adds the correct top inset and restores offset for
 * free (the screen stays mounted inside the pager).
 */
export const TabsScrollView = forwardRef<Animated.ScrollView, TabsScrollViewProps>(
  function TabsScrollView(props, ref) {
    const { scrollHandler, animatedRef, topInset, scrollEventThrottle } = useScrollSync();
    return (
      <Animated.ScrollView
        ref={mergeRefs(ref, animatedRef as never)}
        scrollEventThrottle={scrollEventThrottle}
        {...props}
        onScroll={scrollHandler}
        contentContainerStyle={[{ paddingTop: topInset }, props.contentContainerStyle]}
        scrollIndicatorInsets={{ top: topInset, ...props.scrollIndicatorInsets }}
      />
    );
  }
);
