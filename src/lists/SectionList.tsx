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
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  return (
    <AnimatedSectionList
      ref={mergeRefs(ref, animatedRef as never)}
      scrollEventThrottle={scrollEventThrottle}
      contentOffset={{ x: 0, y: initialOffset }}
      {...(props as unknown as SectionListProps<unknown, DefaultSectionT>)}
      onScroll={scrollHandler}
      contentContainerStyle={[{ paddingTop: topInset }, props.contentContainerStyle]}
      scrollIndicatorInsets={{ top: topInset, ...props.scrollIndicatorInsets }}
    />
  );
}

/** A scroll-synced `SectionList`, generic over item + section type. */
export const TabsSectionList = forwardRef(TabsSectionListInner) as <
  ItemT,
  SectionT = DefaultSectionT,
>(
  props: TabsSectionListProps<ItemT, SectionT> & { ref?: Ref<SectionList<ItemT, SectionT>> }
) => ReactElement;
