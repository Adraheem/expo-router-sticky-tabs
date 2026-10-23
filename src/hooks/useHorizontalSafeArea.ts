import { useCallback, useEffect, useRef, useState } from 'react';
import { PixelRatio } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { horizontalSafeAreaOverlap, type HorizontalInsets } from '../utils/safeArea';

const NO_INSETS: HorizontalInsets = { left: 0, right: 0 };

/**
 * The one host method this hook needs. Typed structurally (rather than as a
 * `View` instance) so it holds across React Native versions, whose `View` ref
 * types differ.
 */
interface MeasurableView {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

export interface HorizontalSafeArea {
  /** Callback ref for the plain `View` whose on-screen span is measured. */
  ref: (node: MeasurableView | null) => void;
  /** Attach to the same `View` so it re-measures whenever it lays out. */
  onLayout: () => void;
  /** Padding that keeps content inside the left/right safe area. */
  insets: HorizontalInsets;
}

/**
 * The part of the left/right safe-area insets a view actually overlaps. Unlike
 * the native `SafeAreaView` — which pads by the provider's full insets wherever
 * the view sits — this measures the view in the window, so a view that does not
 * reach the screen edge (split layouts, a container the consumer already inset)
 * gets no padding on that side.
 *
 * Only `x`/`width` matter, so the collapsing header's `translateY` never
 * triggers work; rotation and fold changes re-measure via layout and the
 * safe-area hooks.
 */
export function useHorizontalSafeArea(enabled: boolean): HorizontalSafeArea {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const nodeRef = useRef<MeasurableView | null>(null);
  const ref = useCallback((node: MeasurableView | null) => {
    nodeRef.current = node;
  }, []);
  const [span, setSpan] = useState<{ x: number; width: number } | null>(null);

  const measure = useCallback(() => {
    nodeRef.current?.measureInWindow((x, _y, width) => {
      setSpan((prev) => (prev && prev.x === x && prev.width === width ? prev : { x, width }));
    });
  }, []);

  // A 180° rotation swaps the left/right insets without resizing the view, so
  // no layout event fires — re-measure whenever the safe area itself changes.
  useEffect(() => {
    if (enabled) measure();
  }, [enabled, measure, insets.left, insets.right, frame.x, frame.width]);

  if (!enabled) return { ref, onLayout: measure, insets: NO_INSETS };

  // Until measured, assume the common case — a view spanning the whole frame —
  // so an edge-to-edge bar is inset on its first frame instead of jumping.
  const overlap = horizontalSafeAreaOverlap(
    span ?? { x: frame.x, width: frame.width },
    frame,
    insets
  );
  return {
    ref,
    onLayout: measure,
    insets: {
      left: PixelRatio.roundToNearestPixel(overlap.left),
      right: PixelRatio.roundToNearestPixel(overlap.right),
    },
  };
}
