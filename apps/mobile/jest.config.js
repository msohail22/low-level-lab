module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|@react-native|react-native)/)',
  ],
};
