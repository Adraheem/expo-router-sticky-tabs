import type { Href } from 'expo-router';
import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle, TextStyle, ColorValue, AccessibilityState } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/**
 * The unique name of a tab. Must match the Expo Router route name that the tab
 * renders (e.g. a file `posts.tsx` inside the layout has the name `"posts"`).
 */
export type TabName = string;

/**
 * Icon renderer used by the tab bar. Receives whether the tab is focused plus a
 * resolved color/size so it can render an active/inactive state.
 */
export type TabIcon = ComponentType<{
  focused: boolean;
  color: ColorValue;
  size: number;
}>;

/**
 * Declarative, per-screen options. These are cheap, serialisable values used by
 * the tab bar and accessibility layer — never put animated values here.
 */
export interface TabScreenOptions {
  /** Human readable label shown in the tab bar. Defaults to `name`. */
  title?: string;
  /** Badge value shown on the tab. `0`/`undefined` hides it. */
  badge?: number | string;
  /** Icon component rendered above/inside the label. */
  icon?: TabIcon;
  /** When `false` the collapsible header is not rendered for this tab. */
  headerShown?: boolean;
}

/**
 * Navigation lifecycle listeners, mirroring Expo Router / React Navigation.
 * Keys are event names such as `tabPress` and `focus`.
 */
export type TabScreenListeners = Record<string, (event: { preventDefault: () => void }) => void>;

/**
 * Public props for `<Tabs.Screen />`. This component renders `null`; it only
 * declares a route + its metadata into the tab store.
 */
export interface TabScreenProps {
  /** Route name — must match the Expo Router child route. */
  name: TabName;
  /** Destination href for the route, used for deep links + tab presses. */
  href: Href;
  /** Declarative options for the tab bar and header. */
  options?: TabScreenOptions;
  /** Defer mounting the screen until it is first focused. Default `true`. */
  lazy?: boolean;
  /** Disable interaction + dim the tab. */
  disabled?: boolean;
  /** Badge shortcut (equivalent to `options.badge`). */
  badge?: number | string;
  /** Icon shortcut (equivalent to `options.icon`). */
  icon?: TabIcon;
  /** Title shortcut (equivalent to `options.title`). */
  title?: string;
  /** Keep the screen mounted after blur instead of freezing it. Default `true`. */
  keepAlive?: boolean;
  /** Whether the collapsible header is shown for this screen. Default `true`. */
  headerShown?: boolean;
  /** Initial params merged into the route when first navigated to. */
  initialParams?: Record<string, unknown>;
  /** Navigation listeners. */
  listeners?: TabScreenListeners;
}

/**
 * A fully-resolved tab entry stored in the tab store. Derived from
 * `TabScreenProps` with defaults applied and a stable index assigned.
 */
export interface RegisteredTab {
  name: TabName;
  href: Href;
  index: number;
  options: Required<Pick<TabScreenOptions, 'title'>> & TabScreenOptions;
  lazy: boolean;
  disabled: boolean;
  keepAlive: boolean;
  headerShown: boolean;
  initialParams?: Record<string, unknown>;
  listeners?: TabScreenListeners;
}

/** Measured on-screen geometry of a single tab button. */
export interface TabLayout {
  x: number;
  width: number;
}

/** Header behaviour flags — see `<Tabs.Header />`. */
export interface HeaderConfig {
  collapsible: boolean;
  sticky: boolean;
  parallax: boolean;
  blur: boolean;
  safeArea: boolean;
  animated: boolean;
  dynamicHeight: boolean;
  snap: boolean;
  floating: boolean;
}

export interface HeaderProps extends Partial<HeaderConfig> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  background?: ReactNode;
}

export interface TabBarProps {
  /** When `true` the bar scrolls horizontally; when `false` tabs share width. */
  scrollable?: boolean;
  /** Force equal-width, non-scrolling tabs. Overrides `scrollable`. */
  fixed?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activeColor?: ColorValue;
  inactiveColor?: ColorValue;
  indicatorStyle?: StyleProp<ViewStyle>;
  /** Hide the built-in `<Tabs.Indicator />`. */
  showIndicator?: boolean;
  /** Fully custom tab renderer. */
  renderTab?: (props: RenderTabProps) => ReactNode;
  /** Fully custom indicator renderer, forwarded to `<Tabs.Indicator />`. */
  renderIndicator?: (props: IndicatorRenderProps) => ReactNode;
}

export interface RenderTabProps {
  tab: RegisteredTab;
  isFocused: boolean;
  /** Continuous focus amount for this tab (1 at rest on this tab). */
  onPress: () => void;
  onLongPress: () => void;
  onLayout: (layout: TabLayout) => void;
  accessibilityState: AccessibilityState;
}

export interface IndicatorRenderProps {
  /** Animated interpolated position/width of the indicator. */
  animatedStyle: StyleProp<ViewStyle>;
}

export interface IndicatorProps {
  style?: StyleProp<ViewStyle>;
  /** Interpolate the indicator width between tab widths. Default `true`. */
  interpolateWidth?: boolean;
  /** Optional per-position colors to interpolate the indicator background. */
  colors?: ColorValue[];
  /** Use a spring instead of tracking the pager 1:1. Default `false`. */
  spring?: boolean;
  /** Custom renderer receiving the animated style. */
  children?: (props: IndicatorRenderProps) => ReactNode;
}

/** Options accepted by `<Tabs />` / `<Tabs.Provider />`. */
export interface TabsProviderOptions {
  /** Route name that should be focused first. */
  initialRouteName?: TabName;
  /** Minimum collapsed header height in px (header never collapses past this). */
  minHeaderHeight?: number;
  /** Disable all animation (also auto-enabled under Reduce Motion). */
  disableAnimation?: boolean;
}

/**
 * Shared values that drive every animation on the UI thread. Held on a stable
 * context so consumers never re-render when they change.
 */
export interface TabsSharedValues {
  /**
   * The shared collapse amount ∈ `[0, collapsibleDistance]` and the single
   * source of truth for the header/tab-bar transform. Written **only** by the
   * focused list's scroll worklet — never by a tab switch, `setPage`, deep link
   * or route restore. This is what makes changing tabs leave the header alone.
   */
  headerOffset: SharedValue<number>;
  /** Settled active tab index (integer). */
  activeIndex: SharedValue<number>;
  /** Continuous pager position (`index + fraction`) during a swipe. */
  pagerPosition: SharedValue<number>;
  /** Measured full header height. */
  headerHeight: SharedValue<number>;
  /** Measured tab bar height. */
  tabBarHeight: SharedValue<number>;
  /** Minimum (collapsed) header height. */
  minHeaderHeight: SharedValue<number>;
  /** Measured geometry of each tab button, indexed by tab order. */
  tabLayouts: SharedValue<TabLayout[]>;
  /** `1` when animation is disabled (reduced motion / opt-out). */
  reducedMotion: SharedValue<number>;
}
