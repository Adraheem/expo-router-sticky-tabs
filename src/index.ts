// ─── Primary API ─────────────────────────────────────────────────────────────
export { Tabs } from './Tabs';

// ─── Individual components (named, for tree-shaking + custom composition) ─────
export { TabsRoot } from './components/TabsRoot';
export { Screen } from './components/Screen';
export { Header } from './components/Header';
export { TabBar } from './components/TabBar';
export { Indicator } from './components/Indicator';
export { Lazy } from './components/Lazy';
export { Group } from './components/Group';
export { TabsScroll } from './components/Scroll';

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useTabs } from './hooks/useTabs';
export { useCurrentTab } from './hooks/useCurrentTab';
export { usePager } from './hooks/usePager';
export { useHeader } from './hooks/useHeader';
export { useIndicator } from './hooks/useIndicator';
export { useScrollSync } from './hooks/useScrollSync';
export { useStickyScroll } from './hooks/useStickyScroll';
export { useTabMeasurements } from './hooks/useTabMeasurements';
export { useCollapsibleHeader } from './hooks/useCollapsibleHeader';
export { useTabsContext } from './provider/context';
export { useTabScreen } from './provider/screenContext';

// ─── Math utilities (worklet-safe, useful for custom animations) ─────────────
export {
  clamp,
  collapsibleDistance,
  collapseProgress,
  headerTranslateY,
  interpolatePosition,
  indicatorX,
  indicatorWidth,
} from './utils/math';

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  TabName,
  TabIcon,
  TabScreenOptions,
  TabScreenListeners,
  TabScreenProps,
  RegisteredTab,
  TabLayout,
  HeaderConfig,
  HeaderProps,
  TabBarProps,
  RenderTabProps,
  IndicatorProps,
  IndicatorRenderProps,
  TabsProviderOptions,
  TabsSharedValues,
} from './types';
export type { TabsRootProps } from './components/TabsRoot';
export type { ScrollProps } from './components/Scroll';
export type { LazyProps } from './components/Lazy';
export type { GroupProps } from './components/Group';
export type { UseTabsResult } from './hooks/useTabs';
export type { UseCurrentTabResult } from './hooks/useCurrentTab';
export type { UsePagerResult } from './hooks/usePager';
export type { UseHeaderResult } from './hooks/useHeader';
export type { UseIndicatorResult } from './hooks/useIndicator';
export type { ScrollSync } from './hooks/useScrollSync';
export type { UseStickyScrollResult } from './hooks/useStickyScroll';
export type { CollapsibleHeader } from './hooks/useCollapsibleHeader';
