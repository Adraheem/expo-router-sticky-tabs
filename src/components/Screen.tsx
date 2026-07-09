import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

import type { RegisteredTab, TabScreenOptions, TabScreenProps } from '../types';
import { isGroupElement } from './Group';

/**
 * Declarative route registration. Mirrors `Stack.Screen` / `Tabs.Screen` from
 * Expo Router: it renders nothing and only contributes metadata to the parent
 * `<Tabs>`. Expo Router remains the source of truth for the route itself.
 */
export function Screen(_props: TabScreenProps): null {
  return null;
}
Screen.displayName = 'Tabs.Screen';

/** Identifies a `<Tabs.Screen />` element among arbitrary children. */
export function isScreenElement(child: ReactNode): child is ReactElement<TabScreenProps> {
  return isValidElement(child) && child.type === Screen;
}

/**
 * Splits `<Tabs>` children into screen declarations (which become router
 * triggers) and layout children (Header / TabBar / anything else).
 */
export function partitionChildren(children: ReactNode): {
  screens: RegisteredTab[];
  layoutChildren: ReactNode[];
} {
  const screens: RegisteredTab[] = [];
  const layoutChildren: ReactNode[] = [];

  const walk = (nodes: ReactNode, inheritedOptions?: TabScreenOptions) => {
    Children.forEach(nodes, (child) => {
      if (isScreenElement(child)) {
        screens.push(toRegisteredTab(child.props, screens.length, inheritedOptions));
      } else if (isGroupElement(child)) {
        // Groups render nothing; flatten their screens with shared options.
        walk(child.props.children, { ...inheritedOptions, ...child.props.screenOptions });
      } else if (isValidElement(child) && child.type === Fragment) {
        walk((child.props as { children?: ReactNode }).children, inheritedOptions);
      } else if (child != null && child !== false) {
        layoutChildren.push(child);
      }
    });
  };
  walk(children);

  return { screens, layoutChildren };
}

function toRegisteredTab(
  props: TabScreenProps,
  index: number,
  inherited?: TabScreenOptions
): RegisteredTab {
  const title = props.title ?? props.options?.title ?? inherited?.title ?? props.name;
  return {
    name: props.name,
    href: props.href,
    index,
    options: {
      title,
      badge: props.badge ?? props.options?.badge ?? inherited?.badge,
      icon: props.icon ?? props.options?.icon ?? inherited?.icon,
      headerShown:
        props.headerShown ?? props.options?.headerShown ?? inherited?.headerShown ?? true,
    },
    lazy: props.lazy ?? true,
    disabled: props.disabled ?? false,
    keepAlive: props.keepAlive ?? true,
    headerShown: props.headerShown ?? props.options?.headerShown ?? inherited?.headerShown ?? true,
    initialParams: props.initialParams,
    listeners: props.listeners,
  };
}
