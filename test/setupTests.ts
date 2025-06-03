import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock global fetch for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      choices: [{ 
        message: { content: 'Mock OpenAI response' } 
      }] 
    }),
  })
) as jest.Mock;

// Increase default timeout for async operations
jest.setTimeout(30000);

// Mock process.env for consistent testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.OPENAI_API_KEY = 'test-key-12345';

// Mock OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ 
              message: { content: 'Mock OpenAI response' } 
            }]
          })
        }
      }
    }))
  };
});

// Mock fs-extra for file operations
jest.mock('fs-extra', () => ({
  ...jest.requireActual('fs-extra'),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  pathExists: jest.fn().mockResolvedValue(true),
  readdir: jest.fn().mockResolvedValue([]),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => false }),
  copy: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined)
}));

// Mock ora spinner
jest.mock('ora', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    text: '',
    color: 'cyan',
    isSpinning: false,
    clear: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis()
  }))
}));

// Global test configuration object
global.TEST_CONFIG = {
  OPENAI_API_KEY: 'test-key-12345',
  ULTRA_THINK_CONFIG: {
    apiKey: 'test-key-12345',
    model: 'gpt-4',
    temperature: 0.1,
    maxTokens: 4000,
    maxRetries: 3
  },
  AI_AGENTS_CONFIG: {
    apiKey: 'test-key-12345',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  }
};

// Add any other global test setup here 