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
import { useIsInsideTabScreen } from '../provider/screenContext';
import { mergeRefs } from '../utils/mergeRefs';

export type TabsFlashListProps<ItemT> = FlashListProps<ItemT>;

let RawFlashList: ComponentType<Record<string, unknown>> | null = null;
let AnimatedFlashList: ComponentType<Record<string, unknown>> | null = null;
let resolveError: Error | null = null;

/** Lazily require the optional peer dep and cache the raw component. */
function requireFlashList(): ComponentType<Record<string, unknown>> {
  if (RawFlashList) return RawFlashList;
  if (resolveError) throw resolveError;
  try {
    // Lazy require so the module only loads when actually used.

    const mod = require('@shopify/flash-list');
    RawFlashList = mod.FlashList as ComponentType<Record<string, unknown>>;
    return RawFlashList;
  } catch {
    resolveError = new Error(
      'expo-router-sticky-tabs: <Tabs.FlashList /> requires the optional peer dependency "@shopify/flash-list". Install it with `npx expo install @shopify/flash-list`.'
    );
    throw resolveError;
  }
}

/** The Reanimated-wrapped FlashList, derived once from the raw component. */
function resolveAnimatedFlashList(): ComponentType<Record<string, unknown>> {
  if (AnimatedFlashList) return AnimatedFlashList;
  AnimatedFlashList = Animated.createAnimatedComponent(
    requireFlashList() as never
  ) as unknown as ComponentType<Record<string, unknown>>;
  return AnimatedFlashList;
}

function TabsFlashListInner<ItemT>(
  props: TabsFlashListProps<ItemT>,
  ref: ForwardedRef<FlashListRef<ItemT>>
) {
  // Outside <Tabs> there is no scroll sync to bind to — behave exactly like a
  // plain FlashList, forwarding only the caller's own props + ref.
  if (!useIsInsideTabScreen()) {
    const List = requireFlashList();
    return <List ref={ref as never} {...props} />;
  }
  return <SyncedFlashList forwardedRef={ref as never} {...(props as FlashListProps<unknown>)} />;
}

/**
 * The scroll-synced variant. Kept as its own component so its hooks always run
 * (the outer wrapper decides which subtree to render, never which hooks to call).
 */
function SyncedFlashList({
  forwardedRef,
  ...props
}: FlashListProps<unknown> & { forwardedRef: Ref<unknown> }) {
  const { scrollHandler, animatedRef, topInset, initialOffset, scrollEventThrottle } =
    useScrollSync();
  const List = useMemo(() => resolveAnimatedFlashList(), []);
  return (
    <List
      ref={mergeRefs(forwardedRef, animatedRef as never)}
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
 * component lazily resolves it and throws a helpful error if it is missing. Used
 * outside `<Tabs>` it degrades to a plain `FlashList`.
 */
export const TabsFlashList = forwardRef(TabsFlashListInner) as <ItemT>(
  props: TabsFlashListProps<ItemT> & { ref?: Ref<FlashListRef<ItemT>> }
) => ReactElement;
