import { forwardRef, useMemo, type ComponentType, type ForwardedRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScrollSync } from '../hooks/useScrollSync';
import { useIsInsideTabScreen } from '../provider/screenContext';
import { toAnimatedComponent } from '../utils/animatedComponent';
import { mergeRefs } from '../utils/mergeRefs';

export type TabsScrollViewProps = ScrollViewProps & {
  /**
   * Custom scroll component to render in place of the default `ScrollView` (e.g.
   * `ScrollView` from `react-native-gesture-handler`). Must accept the same
   * `ScrollViewProps`. It is wired up with the same scroll-sync behavior.
   */
  as?: ComponentType<ScrollViewProps>;
};

/**
 * A drop-in `ScrollView` that auto-synchronises its tab's scroll position with
 * the collapsible header. Adds the correct top inset and restores offset for
 * free (the screen stays mounted inside the pager). Used outside `<Tabs>` it
 * degrades to a plain `ScrollView`.
 */
export const TabsScrollView = forwardRef<Animated.ScrollView, TabsScrollViewProps>(
  function TabsScrollView({ as, ...props }, ref) {
    // Outside <Tabs> there is no scroll sync to bind to — behave exactly like a
    // plain ScrollView (or the provided `as`), forwarding only the caller's own
    // props + ref.
    if (!useIsInsideTabScreen()) {
      const Base = (as ?? ScrollView) as ComponentType<
        ScrollViewProps & { ref?: ForwardedRef<unknown> }
      >;
      return <Base ref={ref as never} {...props} />;
    }
    return <SyncedScrollView forwardedRef={ref} as={as} {...props} />;
  }
);

/**
 * The scroll-synced variant. Kept as its own component so its hooks always run
 * (the outer wrapper decides which subtree to render, never which hooks to call).
 */
function SyncedScrollView({
  forwardedRef,
  as,
  ...props
}: TabsScrollViewProps & { forwardedRef: ForwardedRef<Animated.ScrollView> }) {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  const List = useMemo(
    () => (as ? toAnimatedComponent(as) : Animated.ScrollView),
    [as]
  ) as typeof Animated.ScrollView;
  return (
    <List
      ref={mergeRefs(forwardedRef, animatedRef as never)}
      scrollEventThrottle={scrollEventThrottle}
      contentOffset={{ x: 0, y: initialOffset }}
      {...props}
      onScroll={scrollHandler}
      contentContainerStyle={[{ paddingTop: topInset }, props.contentContainerStyle]}
      scrollIndicatorInsets={{ top: topInset, ...props.scrollIndicatorInsets }}
    />
  );
}
