import { Children, createElement, isValidElement, type ReactNode } from 'react';

import {
  isScrollableType,
  resolveAnimated,
  wireNearestScrollable,
  type ScrollSyncProps,
} from '../utils/scrollables';

// The unit suite runs in a plain node env with only `zustand` transformed, so
// stub the native modules `scrollables` touches. These doubles let us assert the
// detection + injection logic without a renderer.
jest.mock('react-native', () => ({
  ScrollView: function ScrollView() {
    return null;
  },
  FlatList: function FlatList() {
    return null;
  },
  SectionList: function SectionList() {
    return null;
  },
}));

jest.mock('react-native-reanimated', () => {
  const createAnimatedComponent = (C: { displayName?: string; name?: string }) => {
    const Wrapped = function AnimatedWrapper() {
      return null;
    };
    Wrapped.displayName = `AnimatedComponent(${C?.displayName || C?.name || 'Component'})`;
    return Wrapped;
  };
  return {
    __esModule: true,
    default: {
      ScrollView: function AnimatedScrollView() {
        return null;
      },
      FlatList: function AnimatedFlatList() {
        return null;
      },
      createAnimatedComponent,
    },
  };
});

jest.mock('@shopify/flash-list', () => ({
  FlashList: function FlashList() {
    return null;
  },
}));

const { FlashList } = require('@shopify/flash-list');
const { ScrollView, FlatList, SectionList } = require('react-native');

const sync: ScrollSyncProps = {
  scrollHandler: () => {},
  animatedRef: () => {},
  topInset: 100,
  initialOffset: 40,
  scrollEventThrottle: 16,
};

/** Depth-first search for the first element of `type` in a node tree. */
function findByType(node: ReactNode, type: unknown): Record<string, unknown> | null {
  let result: Record<string, unknown> | null = null;
  Children.forEach(node, (child) => {
    if (result || !isValidElement(child)) return;
    if (child.type === type) {
      result = child.props as Record<string, unknown>;
      return;
    }
    const kids = (child.props as { children?: ReactNode }).children;
    if (kids != null) result = findByType(kids, type);
  });
  return result;
}

describe('isScrollableType', () => {
  it('detects react-native lists by identity', () => {
    expect(isScrollableType(FlatList)).toBe(true);
    expect(isScrollableType(ScrollView)).toBe(true);
    expect(isScrollableType(SectionList)).toBe(true);
    expect(isScrollableType(FlashList)).toBe(true);
  });

  it('ignores host strings and unrelated components', () => {
    expect(isScrollableType('View')).toBe(false);
    expect(isScrollableType(function MyScrollViewHeader() {})).toBe(false);
    expect(isScrollableType(null)).toBe(false);
  });

  it('matches a pre-wrapped list by strict name fallback', () => {
    expect(isScrollableType(resolveAnimated(SectionList))).toBe(true);
    expect(isScrollableType(function FlatList() {})).toBe(true);
  });
});

describe('wireNearestScrollable', () => {
  it('converts a top-level FlatList to its Animated form and injects sync props', () => {
    const AnimatedFlatList = resolveAnimated(FlatList);
    const { node, found } = wireNearestScrollable(
      createElement(FlatList, { data: [1, 2, 3] }),
      sync
    );

    expect(found).toBe(true);
    const props = findByType(node, AnimatedFlatList);
    expect(props).not.toBeNull();
    expect(props!.onScroll).toBe(sync.scrollHandler);
    expect(typeof props!.ref).toBe('function');
    expect(props!.contentOffset).toEqual({ x: 0, y: 40 });
    expect(props!.scrollEventThrottle).toBe(16);
    expect(props!.contentContainerStyle).toEqual([{ paddingTop: 100 }, undefined]);
    expect(props!.scrollIndicatorInsets).toEqual({ top: 100 });
    // Original props survive.
    expect(props!.data).toEqual([1, 2, 3]);
  });

  it('finds a list nested inside other elements', () => {
    const Wrapper = ({ children }: { children?: ReactNode }) => children as ReactNode;
    const AnimatedFlatList = resolveAnimated(FlatList);
    const { node, found } = wireNearestScrollable(
      createElement(Wrapper, null, createElement(Wrapper, null, createElement(FlatList, {}))),
      sync
    );
    expect(found).toBe(true);
    expect(findByType(node, AnimatedFlatList)).not.toBeNull();
  });

  it('keeps caller contentContainerStyle and lets the header inset win', () => {
    const AnimatedFlatList = resolveAnimated(FlatList);
    const { node } = wireNearestScrollable(
      createElement(FlatList, { contentContainerStyle: { paddingBottom: 24 } }),
      sync
    );
    const props = findByType(node, AnimatedFlatList);
    expect(props!.contentContainerStyle).toEqual([{ paddingTop: 100 }, { paddingBottom: 24 }]);
  });

  it('uses an object contentContainerStyle and no indicator insets for FlashList', () => {
    const AnimatedFlashList = resolveAnimated(FlashList);
    const { node, found } = wireNearestScrollable(
      createElement(FlashList, { contentContainerStyle: { padding: 5 } }),
      sync
    );
    expect(found).toBe(true);
    const props = findByType(node, AnimatedFlashList);
    expect(props!.contentContainerStyle).toEqual({ paddingTop: 100, padding: 5 });
    expect(props!.scrollIndicatorInsets).toBeUndefined();
  });

  it('returns found=false and leaves the tree untouched when there is no scrollable', () => {
    const Static = () => null;
    const { found } = wireNearestScrollable(createElement(Static, null, 'hello'), sync);
    expect(found).toBe(false);
  });

  it('only wires the first scrollable (one collapse driver per tab)', () => {
    const AnimatedFlatList = resolveAnimated(FlatList);
    const { node } = wireNearestScrollable(
      [createElement(FlatList, { key: 'a' }), createElement(FlatList, { key: 'b' })],
      sync
    );
    let wired = 0;
    Children.forEach(node, (child) => {
      if (isValidElement(child) && child.type === AnimatedFlatList) wired += 1;
    });
    expect(wired).toBe(1);
  });
});
