import {
  forwardRef,
  type ComponentType,
  type ForwardedRef,
  type ReactElement,
  type Ref,
} from 'react';
import { FlatList, type FlatListProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScrollSync } from '../hooks/useScrollSync';
import { useIsInsideTabScreen } from '../provider/screenContext';
import { mergeRefs } from '../utils/mergeRefs';

export type TabsFlatListProps<ItemT> = FlatListProps<ItemT>;

// Reanimated's `Animated.FlatList` types conflict with React Native's own
// `FlatListProps` (e.g. `CellRendererComponent` null vs undefined). Re-type it
// as a component that accepts the public props plus our injected ones.
const AnimatedFlatList = Animated.FlatList as unknown as ComponentType<
  FlatListProps<unknown> & { onScroll?: unknown; ref?: Ref<unknown> }
>;

function TabsFlatListInner<ItemT>(
  props: TabsFlatListProps<ItemT>,
  ref: ForwardedRef<FlatList<ItemT>>
) {
  // Outside <Tabs> there is no scroll sync to bind to — behave exactly like a
  // plain FlatList, forwarding only the caller's own props + ref (no injection).
  if (!useIsInsideTabScreen()) {
    return <FlatList ref={ref} {...props} />;
  }
  return <SyncedFlatList forwardedRef={ref as never} {...(props as FlatListProps<unknown>)} />;
}

/**
 * The scroll-synced variant. Kept as its own component so its hooks always run
 * (the outer wrapper decides which subtree to render, never which hooks to call).
 */
function SyncedFlatList({
  forwardedRef,
  ...props
}: FlatListProps<unknown> & { forwardedRef: Ref<unknown> }) {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  return (
    <AnimatedFlatList
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

/**
 * A scroll-synced `FlatList`. Generic over item type; virtualisation is fully
 * preserved because it is a thin wrapper over `Animated.FlatList`. Used outside
 * `<Tabs>` it degrades to a plain `FlatList`.
 */
export const TabsFlatList = forwardRef(TabsFlatListInner) as <ItemT>(
  props: TabsFlatListProps<ItemT> & { ref?: Ref<FlatList<ItemT>> }
) => ReactElement;
