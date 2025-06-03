/**
 * OpenNode - AI-Driven npm Package Generator
 * Complete Master Program Entry Point
 *
 * This is the main entry point for the OpenNode system that provides:
 * - AI-powered package generation
 * - Complete automated testing
 * - Docker integration
 * - FastAPI endpoints integration
 * - OpenAI agents SDK integration
 */

// Core functionality exports
export { OpenNode } from './core/index';
export type { GenerationConfig, GenerationResult } from './types';

// CLI functionality
export * from './cli';

// AI and agents functionality
export { OpenAIAgentsManager } from './ai';
export type { Agent } from './ai';
export { AdvancedReasoningEngine } from './ai';

// Analysis and monitoring
export { CodeAnalyzer } from './analysis';

// Security features
export { AdvancedSecurityScanner } from './security';

// Utilities
export * from './types';

// Templates and scaffolding
export { TemplateManager } from './templates';

// Ultra-think AI reasoning
export * from './ultrathink';

// Default export for convenience
import { OpenNode } from './core/index';
export default OpenNode;
