import type { EdgeInsets, Rect } from 'react-native-safe-area-context';

/** Left/right padding that keeps content inside the safe area. */
export interface HorizontalInsets {
  left: number;
  right: number;
}

/**
 * How far a horizontal span (e.g. the tab bar) reaches into the left/right
 * safe-area insets of its provider.
 *
 * `span` and `frame` must share a coordinate space: `span` comes from
 * `measureInWindow`, `frame` from `useSafeAreaFrame()`, which is relative to
 * the provider's view controller — the window, for Expo Router's root
 * provider. A span that never reaches an inset gets `0` on that side, so
 * padding by the result never double-insets content the consumer has already
 * moved inside the safe area.
 */
export function horizontalSafeAreaOverlap(
  span: { x: number; width: number },
  frame: Pick<Rect, 'x' | 'width'>,
  insets: Pick<EdgeInsets, 'left' | 'right'>
): HorizontalInsets {
  const safeStart = frame.x + insets.left;
  const safeEnd = frame.x + frame.width - insets.right;
  const width = Math.max(0, span.width);
  return {
    left: Math.min(width, Math.max(0, safeStart - span.x)),
    right: Math.min(width, Math.max(0, span.x + width - safeEnd)),
  };
}
