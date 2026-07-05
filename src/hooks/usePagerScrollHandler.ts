import { useEvent, useHandler } from 'react-native-reanimated';

/** The payload emitted by `react-native-pager-view`'s `onPageScroll`. */
export interface PagerScrollEvent {
  position: number;
  offset: number;
}

interface Handlers {
  onPageScroll: (event: PagerScrollEvent) => void;
}

/**
 * Reanimated event handler for `PagerView.onPageScroll`, so the continuous
 * pager position drives shared values on the UI thread with no bridge hops.
 *
 * Mirrors the pattern documented by `react-native-pager-view` for Reanimated.
 */
export function usePagerScrollHandler(handlers: Handlers, dependencies?: unknown[]) {
  const { doDependenciesDiffer } = useHandler(
    handlers as unknown as Record<string, (e: unknown, c: unknown) => void>,
    dependencies
  );

  return useEvent(
    (event: Record<string, unknown> & { eventName: string }) => {
      'worklet';
      const { onPageScroll } = handlers;
      if (onPageScroll && event.eventName.endsWith('onPageScroll')) {
        onPageScroll(event as unknown as PagerScrollEvent);
      }
    },
    ['onPageScroll'],
    doDependenciesDiffer
  );
}
