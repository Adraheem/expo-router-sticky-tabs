import { useCallback, useEffect } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { HeaderStore } from '../stores/headerStore';
import type { PagerStore } from '../stores/pagerStore';
import type { ScrollStore } from '../stores/scrollStore';
import type { TabStore } from '../stores/tabStore';
import type { TabName } from '../types';
import { syncedTabOffset } from '../utils/math';

export interface ScrollCoordinator {
  /**
   * Reconcile a single tab's scroll position TO the current shared header
   * collapse: pin it up to `headerOffset` if it is "behind" the collapse, else
   * leave its own offset untouched. Never writes `headerOffset`.
   */
  syncTabToHeader: (name: TabName) => void;
}

export interface ScrollCoordinatorParams {
  scrollStore: ScrollStore;
  pagerStore: PagerStore;
  tabStore: TabStore;
  headerStore: HeaderStore;
  /** The shared collapse driver. Read-only here — the coordinator never writes it. */
  headerOffset: SharedValue<number>;
}

/**
 * The central scroll coordinator. It keeps the shared layout (header + tab bar)
 * and the individual tab scroll views in sync without either owning the other:
 *
 * - Genuine **vertical scrolling** moves the shared `headerOffset` (done in the
 *   focused list's worklet — not here). The coordinator never touches it.
 * - **Everything else** (tab switch, swipe reveal, deep link, lazy mount) can
 *   only move *tabs*. The coordinator reconciles a tab TO the header by pinning
 *   it under the collapsed bar when it would otherwise sit behind the collapse.
 *
 * This inversion is what guarantees that changing tabs never expands, collapses
 * or repositions the header — the defect the old "restore the header driver on
 * tab change" model produced.
 */
export function useScrollCoordinator(params: ScrollCoordinatorParams): ScrollCoordinator {
  const { scrollStore, pagerStore, tabStore, headerStore, headerOffset } = params;

  const syncTabToHeader = useCallback(
    (name: TabName) => {
      // Reading `.value` in a JS callback (not during render) is safe. Mirror it
      // to the header store so a tab mounting right after this reads the current
      // collapse for its initial content offset — no shared-value read in render.
      const header = headerOffset.value;
      headerStore.getState().setCollapseSnapshot(header);
      const entry = scrollStore.getState().tabs[name];
      // Not registered yet (e.g. a lazy tab that has not mounted). It will pin
      // itself on mount via its initial content offset (seeded from the snapshot
      // just written above) + a follow-up sync from the Slot callback.
      if (!entry) return;
      const own = entry.lastOffset.value;
      const target = syncedTabOffset(own, header);
      if (target === own) return;
      // Seamless (non-animated) so the adjustment lands before the page is seen.
      entry.scrollToOffset(target, false);
      // Optimistic mirror so a follow-up sync in the same tick reads the new
      // value; the list's own onScroll confirms it on the next frame.
      entry.lastOffset.value = target;
    },
    [scrollStore, headerStore, headerOffset]
  );

  // On the rising edge of a swipe, pre-align the neighbours the gesture might
  // reveal so no header gap flashes while the page slides in. Only mounted tabs
  // can be scrolled; freshly-revealed lazy tabs pin themselves on mount instead.
  useEffect(() => {
    return pagerStore.subscribe((state, prev) => {
      if (!state.isDragging || prev.isDragging) return;
      const { order, activeIndex } = tabStore.getState();
      const prevTab = order[activeIndex - 1];
      const nextTab = order[activeIndex + 1];
      if (prevTab) syncTabToHeader(prevTab);
      if (nextTab) syncTabToHeader(nextTab);
    });
  }, [pagerStore, tabStore, syncTabToHeader]);

  return { syncTabToHeader };
}
