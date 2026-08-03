module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx|js)$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!sanitize-html(?:/|$)|htmlparser2(?:/|$)|dom-serializer(?:/|$)|domelementtype(?:/|$)|domhandler(?:/|$)|domutils(?:/|$)|entities(?:/|$))',
  ],
  testMatch: ['**/**/*.test.(ts|js)'],
}
