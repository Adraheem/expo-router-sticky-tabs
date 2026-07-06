import type { TabLayout } from '../types';

/**
 * Pure, worklet-safe math used by the header, indicator and scroll sync.
 *
 * Every function carries the `'worklet'` directive so it can run on the UI
 * thread, but it is also plain JavaScript so it can be unit tested directly on
 * the JS thread without a Reanimated runtime.
 */

export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/**
 * Distance the header can travel before it is fully collapsed. Never negative.
 */
export function collapsibleDistance(headerHeight: number, minHeaderHeight: number): number {
  'worklet';
  return Math.max(0, headerHeight - minHeaderHeight);
}

/**
 * Vertical translation of the sticky header/tab-bar overlay for a given scroll
 * offset. Moves up (negative) as you scroll down, clamped so the header never
 * collapses past its minimum height.
 */
export function headerTranslateY(
  offset: number,
  headerHeight: number,
  minHeaderHeight: number
): number {
  'worklet';
  return -clamp(offset, 0, collapsibleDistance(headerHeight, minHeaderHeight));
}

/**
 * The offset an inactive/incoming tab must sit at to stay consistent with the
 * shared header collapse. A tab may never sit "behind" the collapse (that would
 * reveal a gap / force the header to expand), so it is pinned up to
 * `headerOffset`; a tab already scrolled past the collapse keeps its own offset.
 *
 * This is the coordinator's core reconcile decision, isolated as pure math so it
 * can be unit tested without a Reanimated runtime. It is the reason switching
 * tabs never moves the shared header: the tab moves to the header, not vice
 * versa.
 */
export function syncedTabOffset(ownOffset: number, headerOffset: number): number {
  'worklet';
  return Math.max(ownOffset, headerOffset);
}

/** `0` fully expanded → `1` fully collapsed. */
export function collapseProgress(
  offset: number,
  headerHeight: number,
  minHeaderHeight: number
): number {
  'worklet';
  const distance = collapsibleDistance(headerHeight, minHeaderHeight);
  if (distance <= 0) return offset > 0 ? 1 : 0;
  return clamp(offset, 0, distance) / distance;
}

/**
 * Linear interpolation of a scalar across an ordered list of stops keyed by the
 * continuous pager position. Used for both indicator x and width.
 */
export function interpolatePosition(position: number, values: number[], fallback: number): number {
  'worklet';
  if (values.length === 0) return fallback;
  if (values.length === 1) return values[0];
  const clamped = clamp(position, 0, values.length - 1);
  const lower = Math.floor(clamped);
  const upper = Math.min(lower + 1, values.length - 1);
  const t = clamped - lower;
  return values[lower] + (values[upper] - values[lower]) * t;
}

/** Interpolated left edge of the indicator for a continuous pager position. */
export function indicatorX(position: number, layouts: TabLayout[]): number {
  'worklet';
  // Tabs measure one at a time, so `layouts` may briefly contain holes; guard
  // each access so the worklet never dereferences an undefined entry.
  const xs: number[] = [];
  for (let i = 0; i < layouts.length; i++) {
    xs.push(layouts[i] ? layouts[i].x : 0);
  }
  return interpolatePosition(position, xs, 0);
}

/** Interpolated width of the indicator for a continuous pager position. */
export function indicatorWidth(position: number, layouts: TabLayout[]): number {
  'worklet';
  const widths: number[] = [];
  for (let i = 0; i < layouts.length; i++) {
    widths.push(layouts[i] ? layouts[i].width : 0);
  }
  return interpolatePosition(position, widths, 0);
}
