import {
  forwardRef,
  useMemo,
  type ComponentType,
  type ForwardedRef,
  type ReactElement,
  type Ref,
} from 'react';
import { FlatList, type FlatListProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScrollSync } from '../hooks/useScrollSync';
import { useIsInsideTabScreen } from '../provider/screenContext';
import { toAnimatedComponent } from '../utils/animatedComponent';
import { mergeRefs } from '../utils/mergeRefs';

export type TabsFlatListProps<ItemT> = FlatListProps<ItemT> & {
  /**
   * Custom scroll component to render in place of the default `FlatList` (e.g.
   * `FlatList` from `react-native-gesture-handler`). Must accept the same
   * `FlatListProps`. It is wired up with the same scroll-sync behavior.
   */
  as?: ComponentType<FlatListProps<ItemT>>;
};

// Reanimated's `Animated.FlatList` types conflict with React Native's own
// `FlatListProps` (e.g. `CellRendererComponent` null vs undefined). Re-type it
// as a component that accepts the public props plus our injected ones.
const AnimatedFlatList = Animated.FlatList as unknown as ComponentType<
  FlatListProps<unknown> & { onScroll?: unknown; ref?: Ref<unknown> }
>;

function TabsFlatListInner<ItemT>(
  { as, ...props }: TabsFlatListProps<ItemT>,
  ref: ForwardedRef<FlatList<ItemT>>
) {
  // Outside <Tabs> there is no scroll sync to bind to — behave exactly like a
  // plain FlatList (or the provided `as`), forwarding only the caller's own
  // props + ref (no injection).
  if (!useIsInsideTabScreen()) {
    const Base = (as ?? FlatList) as ComponentType<FlatListProps<unknown> & { ref?: Ref<unknown> }>;
    return <Base ref={ref as never} {...(props as FlatListProps<unknown>)} />;
  }
  return (
    <SyncedFlatList
      forwardedRef={ref as never}
      as={as as ComponentType<Record<string, unknown>> | undefined}
      {...(props as FlatListProps<unknown>)}
    />
  );
}

/**
 * The scroll-synced variant. Kept as its own component so its hooks always run
 * (the outer wrapper decides which subtree to render, never which hooks to call).
 */
function SyncedFlatList({
  forwardedRef,
  as,
  ...props
}: FlatListProps<unknown> & {
  forwardedRef: Ref<unknown>;
  as?: ComponentType<Record<string, unknown>>;
}) {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  const List = useMemo(
    () => (as ? toAnimatedComponent(as) : AnimatedFlatList),
    [as]
  ) as typeof AnimatedFlatList;
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

/**
 * A scroll-synced `FlatList`. Generic over item type; virtualisation is fully
 * preserved because it is a thin wrapper over `Animated.FlatList`. Used outside
 * `<Tabs>` it degrades to a plain `FlatList`.
 */
export const TabsFlatList = forwardRef(TabsFlatListInner) as <ItemT>(
  props: TabsFlatListProps<ItemT> & { ref?: Ref<FlatList<ItemT>> }
) => ReactElement;
