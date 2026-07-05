import { useState, type ReactNode } from 'react';

import { useRouterState } from '../provider/routerState';
import { useTabScreen } from '../provider/screenContext';

export interface LazyProps {
  children: ReactNode;
  /** Rendered before the tab is first focused. */
  fallback?: ReactNode;
  /** Unmount children when the tab blurs instead of keeping them alive. */
  unmountOnBlur?: boolean;
}

/**
 * `<Tabs.Lazy />` defers mounting expensive content until its tab is first
 * focused. Complements the pager-level lazy mounting for fine-grained control
 * inside a screen.
 */
export function Lazy({ children, fallback = null, unmountOnBlur = false }: LazyProps): ReactNode {
  const { index } = useTabScreen();
  const { state } = useRouterState();
  const isFocused = state.index === index;
  // Latch "has ever been focused" using React's supported adjust-state-during-
  // render pattern — re-renders immediately, no effect, no cascading render.
  const [hasFocused, setHasFocused] = useState(isFocused);
  if (isFocused && !hasFocused) {
    setHasFocused(true);
  }

  const shouldRender = unmountOnBlur ? isFocused : hasFocused || isFocused;
  return shouldRender ? children : fallback;
}
Lazy.displayName = 'Tabs.Lazy';
