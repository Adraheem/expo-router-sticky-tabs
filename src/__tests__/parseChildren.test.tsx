import { createElement, Fragment } from 'react';

import { Group } from '../components/Group';
import { partitionChildren, Screen } from '../components/Screen';

const Layout = () => null;

describe('partitionChildren', () => {
  it('parses <Tabs.Screen> declarations into ordered tabs with defaults', () => {
    const { screens } = partitionChildren([
      createElement(Screen, { key: 'a', name: 'posts', href: '/posts' }),
      createElement(Screen, { key: 'b', name: 'reels', href: '/reels' }),
    ]);
    expect(screens.map((s) => s.name)).toEqual(['posts', 'reels']);
    expect(screens[0].index).toBe(0);
    expect(screens[1].index).toBe(1);
    expect(screens[0].options.title).toBe('posts'); // defaults to name
    expect(screens[0].lazy).toBe(true);
    expect(screens[0].keepAlive).toBe(true);
  });

  it('separates layout children from screen declarations', () => {
    const { screens, layoutChildren } = partitionChildren([
      createElement(Layout, { key: 'l' }),
      createElement(Screen, { key: 'a', name: 'posts', href: '/posts' }),
    ]);
    expect(screens).toHaveLength(1);
    expect(layoutChildren).toHaveLength(1);
  });

  it('applies prop shortcuts and options', () => {
    const { screens } = partitionChildren([
      createElement(Screen, {
        key: 'a',
        name: 'posts',
        href: '/posts',
        title: 'Posts',
        badge: 8,
        disabled: true,
      }),
    ]);
    expect(screens[0].options.title).toBe('Posts');
    expect(screens[0].options.badge).toBe(8);
    expect(screens[0].disabled).toBe(true);
  });

  it('flattens <Tabs.Group> children and applies shared screenOptions', () => {
    const { screens } = partitionChildren([
      createElement(Screen, { key: 'a', name: 'posts', href: '/posts' }),
      createElement(
        Group,
        { key: 'g', screenOptions: { headerShown: false } },
        createElement(Screen, { key: 'b', name: 'reels', href: '/reels' }),
        createElement(Screen, { key: 'c', name: 'tagged', href: '/tagged' })
      ),
    ]);
    expect(screens.map((s) => s.name)).toEqual(['posts', 'reels', 'tagged']);
    expect(screens[0].headerShown).toBe(true);
    expect(screens[1].headerShown).toBe(false);
    expect(screens[2].headerShown).toBe(false);
    // indexes stay contiguous across the flatten
    expect(screens.map((s) => s.index)).toEqual([0, 1, 2]);
  });

  it('flattens fragments transparently', () => {
    const { screens } = partitionChildren(
      createElement(
        Fragment,
        null,
        createElement(Screen, { key: 'a', name: 'posts', href: '/posts' }),
        createElement(Screen, { key: 'b', name: 'reels', href: '/reels' })
      )
    );
    expect(screens).toHaveLength(2);
  });
});
