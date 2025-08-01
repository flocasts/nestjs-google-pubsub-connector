/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
  preset: 'ts-jest',
  clearMocks: true,
  collectCoverageFrom: ['./lib/**/*.ts'],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "index.ts",
    "interfaces.ts",
    "constants.ts",
    "enums.ts"
  ],
  coverageProvider: "v8",
  moduleFileExtensions: [
    "js",
    "ts",
    "node"
  ],
  roots: [
    "<rootDir>/lib",
    "<rootDir>/test"
  ],
  testEnvironment: "node",
  transform: {
      "^.+\\.(t|j)s$": "ts-jest"
  }
};
