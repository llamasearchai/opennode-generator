/**
 * TypeScript type definitions for demo-complete-package
 */

export interface Configuration {
  mode?: 'default' | 'advanced' | 'simple';
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export interface ProcessResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface ProcessInput {
  [key: string]: any;
}

export interface ProcessOutput {
  processed: boolean;
  input: ProcessInput;
  output: string;
  features?: string[];
}

export type ProcessMode = 'default' | 'advanced' | 'simple';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Main class interface
export interface IDemoCompletePackage {
  execute(input: ProcessInput): Promise<ProcessResult>;
  getVersion(): string;
}
