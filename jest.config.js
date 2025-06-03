/** @type {import('jest').Config} */
module.exports = {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "extensionsToTreatAsEsm": [".ts"],
  "roots": [
    "<rootDir>/src",
    "<rootDir>/test"
  ],
  "testMatch": [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts"
  ],
  "transform": {
    "^.+\\.ts$": ["ts-jest", {
      "useESM": true,
      "tsconfig": {
        "module": "esnext"
      }
    }]
  },
  "transformIgnorePatterns": [
    "node_modules/(?!(chalk|ora|ansi-styles|strip-ansi|ansi-regex|cli-cursor|restore-cursor|onetime|mimic-fn|is-interactive|is-unicode-supported|emoji-regex|string-width|strip-ansi|wcwidth|log-symbols|cli-spinners)/)"
  ],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/**/*.config.ts",
    "!src/**/*.mock.ts"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html",
    "json"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 60,
      "functions": 60,
      "lines": 60,
      "statements": 60
    }
  },
  "setupFilesAfterEnv": [
    "<rootDir>/test/setupTests.ts"
  ],
  "testTimeout": 30000,
  "maxWorkers": "50%",
  "bail": false,
  "verbose": true,
  "detectOpenHandles": true,
  "forceExit": true,
  "clearMocks": true,
  "resetMocks": true,
  "restoreMocks": true,
  "errorOnDeprecated": false,
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/dist/",
    "/coverage/",
    "/test/temp/"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/test/",
    "/dist/"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^chalk$": "<rootDir>/test/__mocks__/chalk.js",
    "^ora$": "<rootDir>/test/__mocks__/ora.js"
  },
  "globals": {
    "ts-jest": {
      "useESM": true,
      "tsconfig": "tsconfig.json",
      "diagnostics": {
        "warnOnly": true
      }
    }
  }
};