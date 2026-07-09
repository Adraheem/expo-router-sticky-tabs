import { createHeaderStore, DEFAULT_HEADER_CONFIG } from '../stores/headerStore';
import { createPagerStore } from '../stores/pagerStore';
import { createScrollStore } from '../stores/scrollStore';
import { createTabStore } from '../stores/tabStore';
import type { RegisteredTab } from '../types';

function tab(name: string, index: number): RegisteredTab {
  return {
    name,
    href: `/${name}`,
    index,
    options: { title: name },
    lazy: true,
    disabled: false,
    keepAlive: true,
    headerShown: true,
  };
}

describe('tabStore', () => {
  it('registers tabs in order and keys them by name', () => {
    const store = createTabStore();
    store.getState().setTabs([tab('posts', 0), tab('reels', 1), tab('tagged', 2)]);
    const state = store.getState();
    expect(state.order).toEqual(['posts', 'reels', 'tagged']);
    expect(state.tabs.reels.index).toBe(1);
  });

  it('tracks the active tab and dedupes identical updates', () => {
    const store = createTabStore();
    store.getState().setTabs([tab('posts', 0), tab('reels', 1)]);
    store.getState().setActive('reels', 1);
    expect(store.getState().activeName).toBe('reels');
    const before = store.getState();
    store.getState().setActive('reels', 1);
    expect(store.getState()).toBe(before); // no new object → no re-render
  });

  it('updates a badge without dropping other options', () => {
    const store = createTabStore();
    store.getState().setTabs([tab('posts', 0)]);
    store.getState().setBadge('posts', 8);
    expect(store.getState().tabs.posts.options.badge).toBe(8);
    expect(store.getState().tabs.posts.options.title).toBe('posts');
  });
});

describe('pagerStore', () => {
  it('stores page metadata and dedupes', () => {
    const store = createPagerStore();
    store.getState().setPageCount(3);
    store.getState().setTargetIndex(2);
    expect(store.getState().pageCount).toBe(3);
    expect(store.getState().targetIndex).toBe(2);
    const before = store.getState();
    store.getState().setPageCount(3);
    expect(store.getState()).toBe(before);
  });
});

describe('headerStore', () => {
  it('starts with sensible defaults', () => {
    const store = createHeaderStore();
    expect(store.getState().config).toEqual(DEFAULT_HEADER_CONFIG);
    expect(store.getState().hasHeader).toBe(false);
  });

  it('ignores sub-pixel height changes to avoid render churn', () => {
    const store = createHeaderStore();
    store.getState().setHeaderHeight(200);
    const before = store.getState();
    store.getState().setHeaderHeight(200.2);
    expect(store.getState()).toBe(before);
    store.getState().setHeaderHeight(210);
    expect(store.getState().headerHeight).toBe(210);
  });

  it('merges config partials', () => {
    const store = createHeaderStore();
    store.getState().setConfig({ collapsible: false });
    expect(store.getState().config.collapsible).toBe(false);
    expect(store.getState().config.sticky).toBe(true);
  });

  it('mirrors the collapse snapshot and dedupes identical writes', () => {
    const store = createHeaderStore();
    expect(store.getState().collapseSnapshot).toBe(0);
    store.getState().setCollapseSnapshot(120);
    expect(store.getState().collapseSnapshot).toBe(120);
    const before = store.getState();
    store.getState().setCollapseSnapshot(120);
    expect(store.getState()).toBe(before); // no new object → no re-render
  });
});

describe('scrollStore', () => {
  it('registers and unregisters tab scroll entries', () => {
    const store = createScrollStore();
    const entry = {
      lastOffset: { value: 0 } as never,
      anchor: { value: 0 } as never,
      scrollToOffset: jest.fn(),
    };
    store.getState().register('posts', entry);
    expect(store.getState().tabs.posts).toBe(entry);
    store.getState().unregister('posts');
    expect(store.getState().tabs.posts).toBeUndefined();
  });
});
