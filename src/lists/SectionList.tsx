import {
  forwardRef,
  type ComponentType,
  type ForwardedRef,
  type ReactElement,
  type Ref,
} from 'react';
import { SectionList, type SectionListProps, type DefaultSectionT } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScrollSync } from '../hooks/useScrollSync';
import { useIsInsideTabScreen } from '../provider/screenContext';
import { mergeRefs } from '../utils/mergeRefs';

export type TabsSectionListProps<ItemT, SectionT = DefaultSectionT> = SectionListProps<
  ItemT,
  SectionT
>;

// Reanimated does not ship an `Animated.SectionList`, so create one.
const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList
) as unknown as ComponentType<
  SectionListProps<unknown, DefaultSectionT> & { onScroll?: unknown; ref?: Ref<unknown> }
>;

function TabsSectionListInner<ItemT, SectionT = DefaultSectionT>(
  props: TabsSectionListProps<ItemT, SectionT>,
  ref: ForwardedRef<SectionList<ItemT, SectionT>>
) {
  // Outside <Tabs> there is no scroll sync to bind to — behave exactly like a
  // plain SectionList, forwarding only the caller's own props + ref.
  if (!useIsInsideTabScreen()) {
    return <SectionList ref={ref} {...props} />;
  }
  return (
    <SyncedSectionList
      forwardedRef={ref as never}
      {...(props as unknown as SectionListProps<unknown, DefaultSectionT>)}
    />
  );
}

/**
 * The scroll-synced variant. Kept as its own component so its hooks always run
 * (the outer wrapper decides which subtree to render, never which hooks to call).
 */
function SyncedSectionList({
  forwardedRef,
  ...props
}: SectionListProps<unknown, DefaultSectionT> & { forwardedRef: Ref<unknown> }) {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  return (
    <AnimatedSectionList
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
 * A scroll-synced `SectionList`, generic over item + section type. Used outside
 * `<Tabs>` it degrades to a plain `SectionList`.
 */
export const TabsSectionList = forwardRef(TabsSectionListInner) as <
  ItemT,
  SectionT = DefaultSectionT,
>(
  props: TabsSectionListProps<ItemT, SectionT> & { ref?: Ref<SectionList<ItemT, SectionT>> }
) => ReactElement;
