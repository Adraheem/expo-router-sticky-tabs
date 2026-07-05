const { defineConfig } = require('eslint/config');
const universe = require('eslint-config-universe/flat/native');
const universeWeb = require('eslint-config-universe/flat/web');

module.exports = defineConfig([
  { ignores: ['build'] },
  ...universe,
  ...universeWeb,
  {
    rules: {
      // Reanimated shared values are intentionally mutable (`sv.value = x`);
      // the React Compiler immutability rule is incompatible with that model.
      'react-hooks/immutability': 'off',
    },
  },
]);
