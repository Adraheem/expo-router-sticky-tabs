import { type ComponentType } from 'react';
import Animated from 'react-native-reanimated';

type AnyComponent = ComponentType<Record<string, unknown>>;

// Wrapping happens once per distinct component so a caller-provided `as` base
// is never re-wrapped (which would remount it) across renders.
const cache = new WeakMap<AnyComponent, AnyComponent>();

/**
 * Wrap a component with `Animated.createAnimatedComponent` once, cached by
 * identity. Used to accept a caller-provided scroll component (`as` prop) that
 * must still receive the Reanimated animated `onScroll` handler + `animatedRef`.
 */
export function toAnimatedComponent(component: AnyComponent): AnyComponent {
  const cached = cache.get(component);
  if (cached) return cached;
  const animated = Animated.createAnimatedComponent(component as never) as unknown as AnyComponent;
  cache.set(component, animated);
  return animated;
}
