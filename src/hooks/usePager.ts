import type { SharedValue } from 'react-native-reanimated';
import { useStore } from 'zustand';

import { useTabsContext } from '../provider/context';

export interface UsePagerResult {
  /** Continuous pager position (`index + fraction`). UI-thread shared value. */
  position: SharedValue<number>;
  /** Settled active index. UI-thread shared value. */
  activeIndex: SharedValue<number>;
  pageCount: number;
  isDragging: boolean;
  isSettling: boolean;
  setPage: (index: number) => void;
}

/** Access to the underlying pager position + controls. */
export function usePager(): UsePagerResult {
  const { pagerStore, shared, setPage } = useTabsContext();
  const pageCount = useStore(pagerStore, (s) => s.pageCount);
  const isDragging = useStore(pagerStore, (s) => s.isDragging);
  const isSettling = useStore(pagerStore, (s) => s.isSettling);
  return {
    position: shared.pagerPosition,
    activeIndex: shared.activeIndex,
    pageCount,
    isDragging,
    isSettling,
    setPage,
  };
}
