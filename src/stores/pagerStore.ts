import { createStore, type StoreApi } from 'zustand/vanilla';

export interface PagerStoreState {
  /** Number of pages the pager renders. */
  pageCount: number;
  /** The page the user is settling towards (updated on swipe). */
  targetIndex: number;
  /** Whether a swipe gesture is currently dragging the pager. */
  isDragging: boolean;
  /** Whether the pager is animating to a target (settling). */
  isSettling: boolean;

  setPageCount: (count: number) => void;
  setTargetIndex: (index: number) => void;
  setDragging: (dragging: boolean) => void;
  setSettling: (settling: boolean) => void;
}

export type PagerStore = StoreApi<PagerStoreState>;

export function createPagerStore(): PagerStore {
  return createStore<PagerStoreState>((set) => ({
    pageCount: 0,
    targetIndex: 0,
    isDragging: false,
    isSettling: false,

    setPageCount: (pageCount) => set((s) => (s.pageCount === pageCount ? s : { pageCount })),
    setTargetIndex: (targetIndex) =>
      set((s) => (s.targetIndex === targetIndex ? s : { targetIndex })),
    setDragging: (isDragging) => set((s) => (s.isDragging === isDragging ? s : { isDragging })),
    setSettling: (isSettling) => set((s) => (s.isSettling === isSettling ? s : { isSettling })),
  }));
}
