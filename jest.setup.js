// Test setup. The MVP unit suite targets pure logic (math, stores, child
// parsing) which needs no native mocks. Reanimated/pager mocks are added here
// as the component/integration suite grows (see roadmap).

// Quiet the act() and animation warnings that are irrelevant to logic tests.
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('useNativeDriver') || msg.includes('act(')) return;
  originalWarn(...args);
};
