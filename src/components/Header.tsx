import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeader } from '../hooks/useCollapsibleHeader';
import { useTabsContext } from '../provider/context';
import { DEFAULT_HEADER_CONFIG } from '../stores/headerStore';
import type { HeaderProps } from '../types';

/**
 * `<Tabs.Header />` — the collapsible, sticky region above the tab bar. It is an
 * absolutely-positioned overlay driven entirely by the shared `scrollY`; the
 * lists below add matching top padding so nothing is obscured.
 */
export function Header(props: HeaderProps): ReactNode {
  const { children, style, background, ...configProps } = props;
  const { headerStore, shared } = useTabsContext();
  const insets = useSafeAreaInsets();

  // Merge prop flags over defaults and publish to the header store.
  const config = { ...DEFAULT_HEADER_CONFIG, ...configProps };
  const configSignature = JSON.stringify(config);
  useEffect(() => {
    headerStore.getState().setConfig(config);
    headerStore.getState().setHasHeader(true);
    return () => headerStore.getState().setHasHeader(false);
  }, [configSignature, headerStore]);

  const { translateStyle, parallaxStyle } = useCollapsibleHeader();

  const onLayout = (e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    shared.headerHeight.value = height;
    headerStore.getState().setHeaderHeight(height);
  };

  const paddingTop = config.safeArea ? insets.top : 0;

  return (
    <Animated.View
      pointerEvents="box-none"
      onLayout={onLayout}
      style={[styles.header, config.floating && styles.floating, translateStyle]}>
      {background != null ? <View style={StyleSheet.absoluteFill}>{background}</View> : null}
      <Animated.View style={[{ paddingTop }, parallaxStyle, style]}>{children}</Animated.View>
    </Animated.View>
  );
}
Header.displayName = 'Tabs.Header';

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  floating: {
    // A floating header sits above content without pushing it down; consumers
    // typically pair this with a translucent background.
    backgroundColor: 'transparent',
  },
});
