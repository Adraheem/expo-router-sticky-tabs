import { orderStateByScreens } from '../utils/routeOrder';

const routes = (...names: string[]) => names.map((name) => ({ key: `${name}-key`, name }));

describe('orderStateByScreens', () => {
  it('reorders router routes into declaration order', () => {
    // Expo Router sorted the routes (initial "posts" first, then its own sort)
    // into an order that differs from how the screens were declared.
    const routerState = { index: 0, routes: routes('posts', 'reels', 'tagged') };
    const declarationOrder = ['tagged', 'posts', 'reels'];

    const ordered = orderStateByScreens(routerState, declarationOrder);

    expect(ordered.routes.map((r) => r.name)).toEqual(['tagged', 'posts', 'reels']);
    // keys travel with the route so descriptors still resolve.
    expect(ordered.routes.map((r) => r.key)).toEqual(['tagged-key', 'posts-key', 'reels-key']);
  });

  it('remaps the active index by route name, not router position', () => {
    // Router says index 0 = "posts". In declaration order "posts" sits at 1.
    const routerState = { index: 0, routes: routes('posts', 'reels', 'tagged') };
    const declarationOrder = ['tagged', 'posts', 'reels'];

    const ordered = orderStateByScreens(routerState, declarationOrder);

    expect(ordered.index).toBe(1);
    expect(ordered.routes[ordered.index].name).toBe('posts');
  });

  it('is identity when declaration order already matches router order', () => {
    const routerState = { index: 2, routes: routes('posts', 'reels', 'tagged') };
    const ordered = orderStateByScreens(routerState, ['posts', 'reels', 'tagged']);

    expect(ordered.routes.map((r) => r.name)).toEqual(['posts', 'reels', 'tagged']);
    expect(ordered.index).toBe(2);
  });

  it('drops routes not declared as screens and never returns a negative index', () => {
    const routerState = { index: 0, routes: routes('posts', 'reels') };
    // "posts" is not declared; the active route falls away, index clamps to 0.
    const ordered = orderStateByScreens(routerState, ['reels']);

    expect(ordered.routes.map((r) => r.name)).toEqual(['reels']);
    expect(ordered.index).toBe(0);
  });

  it('adds name-keyed placeholders for declared tabs the router has not created yet', () => {
    // Expo Router 58+ only creates the focused tab's route up front; the rest
    // are listed in `routeNames` until they are focused or preloaded.
    const routerState = {
      index: 0,
      routes: routes('reels'),
      routeNames: ['posts', 'reels', 'tagged'],
    };

    const ordered = orderStateByScreens(routerState, ['posts', 'reels', 'tagged']);

    expect(ordered.routes).toEqual([
      { key: 'posts', name: 'posts' },
      { key: 'reels-key', name: 'reels' },
      { key: 'tagged', name: 'tagged' },
    ]);
    expect(ordered.index).toBe(1);
  });

  it('does not add placeholders for declared tabs the router does not know', () => {
    const routerState = { index: 0, routes: routes('posts'), routeNames: ['posts'] };

    const ordered = orderStateByScreens(routerState, ['posts', 'missing']);

    expect(ordered.routes.map((r) => r.name)).toEqual(['posts']);
  });

  it('falls back safely when the declaration order is empty (first render)', () => {
    const routerState = { index: 1, routes: routes('posts', 'reels') };
    const ordered = orderStateByScreens(routerState, []);

    expect(ordered.routes).toEqual([]);
    expect(ordered.index).toBe(0);
  });
});
