import { hello } from '../src/commands/hello';

// Mock console.log to capture output
const mockLog = jest.spyOn(console, 'log').mockImplementation();

describe('hello command', () => {
  afterEach(() => {
    mockLog.mockClear();
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  it('should greet the world by default', () => {
    hello();
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Hello, world!'));
  });

  it('should greet a specific person', () => {
    hello('Alice');
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Hello, Alice!'));
  });

  it('should add enthusiasm when option is set', () => {
    hello('Bob', { enthusiastic: true });
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Hello, Bob!!!!'));
  });
});
