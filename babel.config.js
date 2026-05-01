module.exports = function (api) {
  const isTest = api.env('test');
  api.cache.using(() => process.env.NODE_ENV);

  return {
    presets: [
      isTest
        ? ['babel-preset-expo', { worklets: false }]
        : ['babel-preset-expo', { jsxImportSource: 'nativewind', worklets: false }],
      ...(isTest ? [] : ['nativewind/babel']),
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
