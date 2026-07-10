/* eslint-disable react-hooks/static-components -- the animated FlashList is
   resolved + cached once at module scope, so it is a stable reference. */
// `@shopify/flash-list` is imported for types only (erased at build time) so it
// stays an optional peer dependency consumers do not have to install.
import type { FlashListProps, FlashListRef } from '@shopify/flash-list';
import {
  forwardRef,
  useMemo,
  type ComponentType,
  type ForwardedRef,
  type ReactElement,
  type Ref,
} from 'react';
import Animated from 'react-native-reanimated';

import { useScrollSync } from '../hooks/useScrollSync';
import { mergeRefs } from '../utils/mergeRefs';

export type TabsFlashListProps<ItemT> = FlashListProps<ItemT>;

let AnimatedFlashList: ComponentType<Record<string, unknown>> | null = null;
let resolveError: Error | null = null;

function resolveAnimatedFlashList(): ComponentType<Record<string, unknown>> {
  if (AnimatedFlashList) return AnimatedFlashList;
  if (resolveError) throw resolveError;
  try {
    // Lazy require so the module only loads when actually used.

    const mod = require('@shopify/flash-list');
    AnimatedFlashList = Animated.createAnimatedComponent(mod.FlashList) as unknown as ComponentType<
      Record<string, unknown>
    >;
    return AnimatedFlashList;
  } catch {
    resolveError = new Error(
      'expo-router-sticky-tabs: <Tabs.FlashList /> requires the optional peer dependency "@shopify/flash-list". Install it with `npx expo install @shopify/flash-list`.'
    );
    throw resolveError;
  }
}

function TabsFlashListInner<ItemT>(
  props: TabsFlashListProps<ItemT>,
  ref: ForwardedRef<FlashListRef<ItemT>>
) {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  const List = useMemo(() => resolveAnimatedFlashList(), []);
  return (
    <List
      ref={mergeRefs(ref as never, animatedRef as never)}
      scrollEventThrottle={scrollEventThrottle}
      contentOffset={{ x: 0, y: initialOffset }}
      {...props}
      onScroll={scrollHandler}
      contentContainerStyle={{ paddingTop: topInset, ...props.contentContainerStyle }}
    />
  );
}

/**
 * A scroll-synced `@shopify/flash-list`. FlashList is an optional peer — this
 * component lazily resolves it and throws a helpful error if it is missing.
 */
export const TabsFlashList = forwardRef(TabsFlashListInner) as <ItemT>(
  props: TabsFlashListProps<ItemT> & { ref?: Ref<FlashListRef<ItemT>> }
) => ReactElement;
