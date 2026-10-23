import { createElement } from 'react';

import { partitionChildren, Screen } from '../components/Screen';
import { createTabStore } from '../stores/tabStore';
import { shouldRenderPage } from '../utils/pageMount';

const unvisited = { isFocused: false, loaded: false };

describe('shouldRenderPage', () => {
  it('defers a lazy tab until it is focused or revealed', () => {
    expect(shouldRenderPage({ lazy: true }, unvisited)).toBe(false);
    expect(shouldRenderPage({ lazy: true }, { isFocused: true, loaded: false })).toBe(true);
    expect(shouldRenderPage({ lazy: true }, { isFocused: false, loaded: true })).toBe(true);
  });

  it('mounts a non-lazy tab up front', () => {
    expect(shouldRenderPage({ lazy: false }, unvisited)).toBe(true);
  });

  it('treats a tab that is not registered yet as lazy', () => {
    // The tab store fills after the first render.
    expect(shouldRenderPage(undefined, unvisited)).toBe(false);
    expect(shouldRenderPage(undefined, { isFocused: true, loaded: false })).toBe(true);
  });

  it('reads laziness from the <Tabs.Screen> declarations', () => {
    const { screens } = partitionChildren([
      createElement(Screen, { key: 'a', name: 'posts', href: '/posts' }),
      createElement(Screen, { key: 'b', name: 'reels', href: '/reels', lazy: false }),
    ]);
    const store = createTabStore();
    store.getState().setTabs(screens);
    const { tabs } = store.getState();

    expect(shouldRenderPage(tabs.posts, unvisited)).toBe(false);
    expect(shouldRenderPage(tabs.reels, unvisited)).toBe(true);
  });
});
