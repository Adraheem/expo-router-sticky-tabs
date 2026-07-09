import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { FlatList, ScrollView, SectionList } from 'react-native';
import Animated from 'react-native-reanimated';

import { mergeRefs } from './mergeRefs';

type AnyComponent = ComponentType<Record<string, unknown>>;

/**
 * The scroll-sync wiring produced by `useScrollSync`, ready to inject into a
 * detected scrollable. Kept structural (not importing the hook) so this module
 * stays a pure, testable utility.
 */
export interface ScrollSyncProps {
  scrollHandler: unknown;
  animatedRef: unknown;
  topInset: number;
  initialOffset: number;
  scrollEventThrottle: number;
}

// Reanimated ships pre-made, correctly-wired versions of these two; prefer them
// over `createAnimatedComponent` so the inner scroll view is driven correctly.
const AnimatedScrollView = Animated.ScrollView as unknown as AnyComponent;
const AnimatedFlatList = Animated.FlatList as unknown as AnyComponent;

// `@shopify/flash-list` is an optional peer. Resolve its component lazily so the
// module only loads when a consumer actually renders a FlashList.
let flashListType: AnyComponent | null | undefined;
function getFlashListType(): AnyComponent | null {
  if (flashListType !== undefined) return flashListType;
  try {
    // Lazy require so the optional peer only loads when actually referenced.

    const mod = require('@shopify/flash-list');
    flashListType = (mod?.FlashList ?? null) as AnyComponent | null;
  } catch {
    flashListType = null;
  }
  return flashListType;
}

// Animated wrappers we create are cached by source type so a list never remounts
// from a fresh component identity on re-render.
const animatedCache = new Map<AnyComponent, AnyComponent>();
const producedAnimated = new Set<unknown>([AnimatedScrollView, AnimatedFlatList]);

function componentName(type: unknown): string {
  if (typeof type === 'string') return type;
  const t = type as { displayName?: string; name?: string } | null;
  return t?.displayName ?? t?.name ?? '';
}

/** Is this element type `@shopify/flash-list`'s `FlashList`? */
export function isFlashListType(type: unknown): boolean {
  const flash = getFlashListType();
  return !!flash && type === flash;
}

/**
 * Identity-first check for a supported scrollable component type. The reference
 * checks cover every documented list; the strict name fallback catches
 * pre-wrapped variants (e.g. a hand-rolled `createAnimatedComponent(SectionList)`)
 * without false-positiving on user components like `MyScrollViewHeader`.
 */
export function isScrollableType(type: unknown): boolean {
  if (type == null || typeof type === 'string') return false;
  if (
    type === ScrollView ||
    type === FlatList ||
    type === SectionList ||
    type === AnimatedScrollView ||
    type === AnimatedFlatList
  ) {
    return true;
  }
  if (isFlashListType(type)) return true;
  if (producedAnimated.has(type)) return true;
  return /^(?:Animated(?:Component)?\()?(?:ScrollView|FlatList|SectionList|FlashList)\)?$/.test(
    componentName(type)
  );
}

/** Resolve the Reanimated `Animated.*` version of a scrollable (memoised). */
export function resolveAnimated(type: unknown): AnyComponent {
  if (type === ScrollView) return AnimatedScrollView;
  if (type === FlatList) return AnimatedFlatList;
  if (producedAnimated.has(type)) return type as AnyComponent;
  const key = type as AnyComponent;
  const cached = animatedCache.get(key);
  if (cached) return cached;
  const created = Animated.createAnimatedComponent(
    key as ComponentType<Record<string, never>>
  ) as unknown as AnyComponent;
  animatedCache.set(key, created);
  producedAnimated.add(created);
  return created;
}

function injectInto(element: ReactElement, sync: ScrollSyncProps): ReactElement {
  const AnimatedType = resolveAnimated(element.type);
  const flash = isFlashListType(element.type);
  const props = element.props as Record<string, unknown>;
  // React 19 exposes `ref` as a prop; React <=18 keeps it on `element.ref`.
  const originalRef =
    (props.ref as Ref<unknown> | undefined) ?? (element as { ref?: Ref<unknown> }).ref;
  const cc = props.contentContainerStyle;

  const injected: Record<string, unknown> = {
    // Before the spread → the caller may override these.
    scrollEventThrottle: sync.scrollEventThrottle,
    contentOffset: { x: 0, y: sync.initialOffset },
    ...props,
    // After the spread → the sync wiring always wins.
    onScroll: sync.scrollHandler,
    ref: mergeRefs(originalRef, sync.animatedRef as Ref<unknown>),
    contentContainerStyle: flash
      ? { paddingTop: sync.topInset, ...(cc as object) }
      : [{ paddingTop: sync.topInset }, cc],
  };
  // FlashList takes a restricted `contentContainerStyle` object and no
  // `scrollIndicatorInsets`; every other list gets the indicator inset too.
  if (!flash) {
    injected.scrollIndicatorInsets = {
      top: sync.topInset,
      ...(props.scrollIndicatorInsets as object),
    };
  }
  return createElement(AnimatedType, { ...injected, key: element.key });
}

/**
 * Walk `children`, find the nearest supported scrollable (depth-first, in reading
 * order), replace it with its `Animated.*` form carrying the scroll-sync props,
 * and rebuild the surrounding tree immutably. Only the first match is wired —
 * one collapse driver per tab. Returns the transformed tree plus whether a
 * scrollable was found.
 */
export function wireNearestScrollable(
  children: ReactNode,
  sync: ScrollSyncProps
): { node: ReactNode; found: boolean } {
  let found = false;

  const transform = (node: ReactNode): ReactNode => {
    if (found || !isValidElement(node)) return node;
    const element = node as ReactElement;
    if (isScrollableType(element.type)) {
      found = true;
      return injectInto(element, sync);
    }
    const childrenProp = (element.props as { children?: ReactNode }).children;
    if (childrenProp == null) return element;
    return cloneElement(element, undefined, Children.map(childrenProp, transform));
  };

  const node = Children.map(children, transform);
  return { node: node ?? children, found };
}
