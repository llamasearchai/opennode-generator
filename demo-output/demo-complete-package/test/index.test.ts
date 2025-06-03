/**
 * Tests for demo-complete-package
 */

import { DemoCompletePackage } from '../src/index';

describe('DemoCompletePackage', () => {
  let instance: DemoCompletePackage;

  beforeEach(() => {
    instance = new DemoCompletePackage();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(instance).toBeInstanceOf(DemoCompletePackage);
    });

    it('should accept options', () => {
      const options = { mode: 'advanced' };
      const instanceWithOptions = new DemoCompletePackage(options);
      expect(instanceWithOptions).toBeInstanceOf(DemoCompletePackage);
    });
  });

  describe('getVersion', () => {
    it('should return the correct version', () => {
      const version = instance.getVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('execute', () => {
    it('should process valid input successfully', async () => {
      const input = { test: 'data' };
      const result = await instance.execute(input);
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle invalid input gracefully', async () => {
      const result = await instance.execute(null);
      
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Input is required');
    });

    it('should process different input types', async () => {
      const inputs = [
        { type: 'string', value: 'test' },
        { type: 'number', value: 123 },
        { type: 'array', value: [1, 2, 3] },
        { type: 'object', value: { nested: true } },
      ];

      for (const input of inputs) {
        const result = await instance.execute(input);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
    });

    it('should handle advanced mode', async () => {
      const advancedInstance = new DemoCompletePackage({ mode: 'advanced' });
      const input = { test: 'advanced' };
      const result = await advancedInstance.execute(input);
      
      expect(result.success).toBe(true);
      expect(result.data.features).toBeDefined();
    });

    it('should handle simple mode', async () => {
      const simpleInstance = new DemoCompletePackage({ mode: 'simple' });
      const input = { test: 'simple' };
      const result = await simpleInstance.execute(input);
      
      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle processing errors', async () => {
      // Test error scenarios specific to your package type
      const result = await instance.execute(undefined);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should process input within reasonable time', async () => {
      const startTime = Date.now();
      const input = { performance: 'test' };
      
      await instance.execute(input);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 1 second for simple operations
      expect(executionTime).toBeLessThan(1000);
    });
  });
});
