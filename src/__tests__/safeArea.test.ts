import { horizontalSafeAreaOverlap } from '../utils/safeArea';

const frame = { x: 0, width: 951 };

describe('horizontalSafeAreaOverlap', () => {
  it('returns the full insets for a span flush with both edges', () => {
    expect(horizontalSafeAreaOverlap({ x: 0, width: 951 }, frame, { left: 62, right: 62 })).toEqual(
      { left: 62, right: 62 }
    );
  });

  it('handles asymmetric insets (one cutout side)', () => {
    expect(horizontalSafeAreaOverlap({ x: 0, width: 951 }, frame, { left: 0, right: 59 })).toEqual({
      left: 0,
      right: 59,
    });
  });

  it('is 0 for a span already inside the safe area', () => {
    expect(
      horizontalSafeAreaOverlap({ x: 80, width: 791 }, frame, { left: 62, right: 62 })
    ).toEqual({ left: 0, right: 0 });
  });

  it('returns only the part of an inset the span reaches into', () => {
    // Starts 40pt in (22pt still under the left inset); ends 30pt short of the
    // right edge (32pt still under the right inset).
    expect(
      horizontalSafeAreaOverlap({ x: 40, width: 881 }, frame, { left: 62, right: 62 })
    ).toEqual({ left: 22, right: 32 });
  });

  it('measures against an offset provider frame', () => {
    const offsetFrame = { x: 100, width: 500 };
    expect(
      horizontalSafeAreaOverlap({ x: 100, width: 500 }, offsetFrame, { left: 20, right: 10 })
    ).toEqual({ left: 20, right: 10 });
    expect(
      horizontalSafeAreaOverlap({ x: 150, width: 300 }, offsetFrame, { left: 20, right: 10 })
    ).toEqual({ left: 0, right: 0 });
  });

  it('is 0 with no insets', () => {
    expect(horizontalSafeAreaOverlap({ x: 0, width: 951 }, frame, { left: 0, right: 0 })).toEqual({
      left: 0,
      right: 0,
    });
  });

  it('never exceeds the span width', () => {
    expect(horizontalSafeAreaOverlap({ x: 0, width: 30 }, frame, { left: 62, right: 0 })).toEqual({
      left: 30,
      right: 0,
    });
  });
});
