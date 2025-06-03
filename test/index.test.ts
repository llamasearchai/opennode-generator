/**
 * Tests for main OpenNode exports
 */

import { OpenNode, Logger, ConfigManager, TemplateManager, CodeAnalyzer } from '../src/index';

describe('OpenNode Main Exports', () => {
  it('should export OpenNode class', () => {
    expect(OpenNode).toBeDefined();
    expect(typeof OpenNode).toBe('function');
  });

  it('should export Logger class', () => {
    expect(Logger).toBeDefined();
    expect(typeof Logger).toBe('function');
  });

  it('should export ConfigManager class', () => {
    expect(ConfigManager).toBeDefined();
    expect(typeof ConfigManager).toBe('function');
  });

  it('should export TemplateManager class', () => {
    expect(TemplateManager).toBeDefined();
    expect(typeof TemplateManager).toBe('function');
  });

  it('should export CodeAnalyzer class', () => {
    expect(CodeAnalyzer).toBeDefined();
    expect(typeof CodeAnalyzer).toBe('function');
  });

  it('should create OpenNode instance', () => {
    const instance = new OpenNode();
    expect(instance).toBeInstanceOf(OpenNode);
    expect(instance.getVersion()).toBe('1.0.0');
  });
}); 