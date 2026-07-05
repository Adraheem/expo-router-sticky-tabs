import {
  forwardRef,
  type ComponentType,
  type ForwardedRef,
  type ReactElement,
  type Ref,
} from 'react';
import type { FlatList, FlatListProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScrollSync } from '../hooks/useScrollSync';
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
  const { scrollHandler, animatedRef, topInset, scrollEventThrottle } = useScrollSync();
  return (
    <AnimatedFlatList
      ref={mergeRefs(ref, animatedRef as never)}
      scrollEventThrottle={scrollEventThrottle}
      {...(props as FlatListProps<unknown>)}
      onScroll={scrollHandler}
      contentContainerStyle={[{ paddingTop: topInset }, props.contentContainerStyle]}
      scrollIndicatorInsets={{ top: topInset, ...props.scrollIndicatorInsets }}
    />
  );
}

/**
 * A scroll-synced `FlatList`. Generic over item type; virtualisation is fully
 * preserved because it is a thin wrapper over `Animated.FlatList`.
 */
export const TabsFlatList = forwardRef(TabsFlatListInner) as <ItemT>(
  props: TabsFlatListProps<ItemT> & { ref?: Ref<FlatList<ItemT>> }
) => ReactElement;
