import {
  clamp,
  collapseAnchor,
  collapseProgress,
  collapsibleDistance,
  headerTranslateY,
  indicatorWidth,
  indicatorX,
  interpolatePosition,
  syncedTabOffset,
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

describe('syncedTabOffset', () => {
  it('pins a tab that is behind the collapsed header up to the collapse', () => {
    // Header collapsed at 120; a fresh tab at 0 must sit under the pinned bar.
    expect(syncedTabOffset(0, 120)).toBe(120);
    expect(syncedTabOffset(50, 120)).toBe(120);
  });
  it('keeps a tab already scrolled past the collapse at its own offset', () => {
    // Perfect restoration in the content region (offset ≥ collapse).
    expect(syncedTabOffset(320, 120)).toBe(320);
    expect(syncedTabOffset(1000, 120)).toBe(1000);
  });
  it('is a no-op exactly at the collapse boundary', () => {
    expect(syncedTabOffset(120, 120)).toBe(120);
  });
  it('restores exactly when the header is expanded', () => {
    // headerOffset 0 → every tab keeps its own offset, including 0.
    expect(syncedTabOffset(0, 0)).toBe(0);
    expect(syncedTabOffset(1000, 0)).toBe(1000);
  });
  it('never returns a negative offset', () => {
    expect(syncedTabOffset(-10, 0)).toBe(0);
    expect(syncedTabOffset(-10, 120)).toBe(120);
  });
});

describe('collapseAnchor', () => {
  // One scroll frame as the useScrollSync worklet runs it: drive the header
  // from the anchored delta, then re-derive the anchor.
  function frame(y: number, anchor: number, distance: number) {
    const headerOffset = clamp(y - anchor, 0, distance);
    return { headerOffset, anchor: collapseAnchor(y, headerOffset, distance) };
  }

  it('is continuous at focus time: the anchored delta reproduces the current header offset', () => {
    // Whatever state the coordinator leaves a tab in, the first scroll frame
    // must not move the header (own ≥ header, header < distance).
    for (const [own, header, d] of [
      [600, 0, 150],
      [600, 75, 150],
      [120, 120, 150],
      [0, 0, 150],
    ] as const) {
      const anchor = collapseAnchor(own, header, d);
      expect(clamp(own - anchor, 0, d)).toBe(header);
    }
  });

  it('collapses gradually from a scrolled tab instead of jumping (the reported bug)', () => {
    // Tab at 600 while the header is fully expanded (another tab expanded it).
    let { headerOffset, anchor } = { headerOffset: 0, anchor: collapseAnchor(600, 0, 150) };
    expect(anchor).toBe(600);
    // Scroll up (content down) by 10px per frame → header collapses 10px per frame.
    ({ headerOffset, anchor } = frame(610, anchor, 150));
    expect(headerOffset).toBe(10);
    ({ headerOffset, anchor } = frame(680, anchor, 150));
    expect(headerOffset).toBe(80);
  });

  it('rebases at the expanded bound so scrolling to the top restores the canonical state', () => {
    // Tab at 600, header expanded → scroll down toward the top.
    let anchor = collapseAnchor(600, 0, 150);
    let headerOffset: number;
    ({ headerOffset, anchor } = frame(400, anchor, 150));
    expect(headerOffset).toBe(0); // header stays fully expanded on the way up
    expect(anchor).toBe(400); // …and the anchor follows the offset down
    ({ headerOffset, anchor } = frame(0, anchor, 150));
    expect(headerOffset).toBe(0);
    expect(anchor).toBe(0); // back to canonical absolute mode at the top
    // Scrolling down from the top now collapses 1:1, as for a fresh tab.
    ({ headerOffset, anchor } = frame(80, anchor, 150));
    expect(headerOffset).toBe(80);
  });

  it('locks to canonical mode once fully collapsed', () => {
    // Collapse the header fully from an anchored (previously-scrolled) tab.
    let anchor = collapseAnchor(600, 0, 150);
    let headerOffset: number;
    ({ headerOffset, anchor } = frame(750, anchor, 150));
    expect(headerOffset).toBe(150);
    expect(anchor).toBe(0); // locked
    // Scrolling back down mid-list must NOT re-expand it…
    ({ headerOffset, anchor } = frame(700, anchor, 150));
    expect(headerOffset).toBe(150);
    // …until the content nears the top (offset < collapsible distance).
    ({ headerOffset, anchor } = frame(90, anchor, 150));
    expect(headerOffset).toBe(90);
  });

  it('keeps a tab focused under a fully-collapsed header in canonical mode', () => {
    expect(collapseAnchor(600, 150, 150)).toBe(0);
    expect(collapseAnchor(150, 150, 150)).toBe(0);
  });

  it('is 0 when there is no collapsible distance', () => {
    expect(collapseAnchor(600, 0, 0)).toBe(0);
  });

  it('never exceeds the tab offset, so the header never outruns the content', () => {
    // anchor ≤ own keeps headerOffset = clamp(own − anchor) ≥ 0 and ≤ own.
    expect(collapseAnchor(50, 120, 150)).toBe(0);
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
