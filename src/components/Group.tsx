import { type ReactElement, type ReactNode } from 'react';

import type { TabScreenOptions } from '../types';

export interface GroupProps {
  children?: ReactNode;
  /** Options merged into every `<Tabs.Screen>` inside this group. */
  screenOptions?: TabScreenOptions;
}

/**
 * `<Tabs.Group />` groups related `<Tabs.Screen>` declarations and can apply
 * shared `screenOptions`. It renders nothing itself; `<Tabs>` flattens its
 * children during parsing (mirroring Expo Router route groups).
 */
export function Group(_props: GroupProps): null {
  return null;
}
Group.displayName = 'Tabs.Group';

export function isGroupElement(child: ReactNode): child is ReactElement<GroupProps> {
  return (
    !!child &&
    typeof child === 'object' &&
    'type' in child &&
    (child as ReactElement).type === Group
  );
}
