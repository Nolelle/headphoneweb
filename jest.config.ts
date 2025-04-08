/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/*.d.ts"
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["json", "text", "lcov", "clover"],
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
  testPathIgnorePatterns: [
    "<rootDir>/__tests__/setup.ts",
    "<rootDir>/__tests__/utils/cn.test.ts",
    "<rootDir>/__tests__/types.d.ts",
    "<rootDir>/__tests__/types/jest.d.ts",
    "<rootDir>/__tests__/polyfills.ts" // Added to exclude polyfills.ts from tests
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$": "<rootDir>/__mocks__/fileMock.js"
  },
  setupFiles: [
    "<rootDir>/__tests__/polyfills.ts",
    "<rootDir>/jest.setup.env.js" // Create this file
  ], // Polyfills before environment
  setupFilesAfterEnv: [
    "<rootDir>/__tests__/setup.ts",
    "<rootDir>/setupTests.ts",
    "<rootDir>/jest.setup.js"
  ], // Mocks and test utils after environment
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }]
  },
  transformIgnorePatterns: [
    "node_modules/(?!lucide-react)",
    "^.+\\.module\\.(css|sass|scss)$"
  ]
};

export default config;
