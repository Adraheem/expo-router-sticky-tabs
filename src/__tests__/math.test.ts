import {
  clamp,
  collapseProgress,
  collapsibleDistance,
  headerTranslateY,
  indicatorWidth,
  indicatorX,
  interpolatePosition,
} from '../utils/math';

describe('clamp', () => {
  it('bounds a value to the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('collapsibleDistance', () => {
  it('is the header height minus the collapsed height, never negative', () => {
    expect(collapsibleDistance(200, 50)).toBe(150);
    expect(collapsibleDistance(40, 60)).toBe(0);
  });
});

describe('headerTranslateY', () => {
  it('does not move before scrolling', () => {
    expect(headerTranslateY(0, 200, 0)).toBeCloseTo(0);
  });
  it('moves up 1:1 with scroll until fully collapsed', () => {
    expect(headerTranslateY(80, 200, 0)).toBe(-80);
    expect(headerTranslateY(200, 200, 0)).toBe(-200);
  });
  it('never collapses past the minimum header height', () => {
    expect(headerTranslateY(1000, 200, 50)).toBe(-150);
  });
});

describe('collapseProgress', () => {
  it('goes from 0 (expanded) to 1 (collapsed)', () => {
    expect(collapseProgress(0, 200, 0)).toBe(0);
    expect(collapseProgress(100, 200, 0)).toBe(0.5);
    expect(collapseProgress(200, 200, 0)).toBe(1);
    expect(collapseProgress(500, 200, 0)).toBe(1);
  });
  it('treats any scroll as collapsed when there is no collapsible distance', () => {
    expect(collapseProgress(0, 0, 0)).toBe(0);
    expect(collapseProgress(10, 0, 0)).toBe(1);
  });
});

describe('interpolatePosition', () => {
  const stops = [0, 100, 300];
  it('returns exact stops at integer positions', () => {
    expect(interpolatePosition(0, stops, 0)).toBe(0);
    expect(interpolatePosition(1, stops, 0)).toBe(100);
    expect(interpolatePosition(2, stops, 0)).toBe(300);
  });
  it('linearly interpolates between stops', () => {
    expect(interpolatePosition(0.5, stops, 0)).toBe(50);
    expect(interpolatePosition(1.5, stops, 0)).toBe(200);
  });
  it('clamps out-of-range positions', () => {
    expect(interpolatePosition(-1, stops, 0)).toBe(0);
    expect(interpolatePosition(5, stops, 0)).toBe(300);
  });
  it('uses the fallback for an empty set', () => {
    expect(interpolatePosition(0, [], 42)).toBe(42);
  });
});

describe('indicator interpolation', () => {
  const layouts = [
    { x: 0, width: 100 },
    { x: 100, width: 120 },
    { x: 220, width: 80 },
  ];
  it('tracks x across tabs', () => {
    expect(indicatorX(0, layouts)).toBe(0);
    expect(indicatorX(1, layouts)).toBe(100);
    expect(indicatorX(0.5, layouts)).toBe(50);
  });
  it('interpolates width between tabs', () => {
    expect(indicatorWidth(0, layouts)).toBe(100);
    expect(indicatorWidth(1, layouts)).toBe(120);
    expect(indicatorWidth(0.5, layouts)).toBe(110);
  });
  it('is safe with no measurements', () => {
    expect(indicatorX(0.5, [])).toBe(0);
    expect(indicatorWidth(0.5, [])).toBe(0);
  });

  it('does not crash on a partially-measured (sparse) layout array', () => {
    // Tabs measure one at a time, so entries can be undefined mid-measure.
    const partial = [undefined, undefined, { x: 220, width: 80 }] as unknown as typeof layouts;
    expect(() => indicatorX(1, partial)).not.toThrow();
    expect(() => indicatorWidth(1, partial)).not.toThrow();
    expect(indicatorX(2, partial)).toBe(220);
    expect(indicatorWidth(2, partial)).toBe(80);
  });
});
