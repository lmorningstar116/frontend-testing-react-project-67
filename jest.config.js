const config = {
  verbose: true,
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__fixtures__/"
  ],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
};

module.exports = config;
