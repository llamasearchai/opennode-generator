/**
 * TypeScript type definitions for OpenNode
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

// AI Provider types
export type AIProvider = 'openai' | 'azure' | 'anthropic' | 'google' | 'custom';

// Template types
export interface PackageTemplate {
  name: string;
  description: string;
  type: string;
  features: string[];
  files: TemplateFile[];
  scripts?: Record<string, string>;
  dependencies?: string[];
  devDependencies?: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'file' | 'directory';
}

// Template interface for template manager
export interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  version: string;
  author: string;
  category: string;
  features: string[];
  files: TemplateFile[];
  scripts?: Record<string, string>;
  dependencies?: string[];
  devDependencies?: string[];
}

// Main class interface
export interface I {
  execute(input: ProcessInput): Promise<ProcessResult>;
  getVersion(): string;
}

// OpenNode specific types
export interface GenerationConfig {
  packageName?: string;
  description?: string;
  version?: string;
  license?: string;
  packageType?:
    | 'library'
    | 'cli-tool'
    | 'react-component'
    | 'express-api'
    | 'utility'
    | 'monorepo'
    | 'plugin';
  qualityLevel?: 'good' | 'better' | 'best' | 'enterprise';
  outputDir?: string;
  enableTesting?: boolean;
  enableDocumentation?: boolean;
  enableLinting?: boolean;
  enableTypeScript?: boolean;
  enableGitInit?: boolean;
  enableCodexIntegration?: boolean;
  enableOpenAIAgents?: boolean;
  enableCICD?: boolean;
  enableDocker?: boolean;
  enableSecurity?: boolean;
  enablePerformanceMonitoring?: boolean;
  features?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  author?: string;
  email?: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  homepage?: string;
  private?: boolean;
  publishConfig?: {
    access: 'public' | 'restricted';
    registry?: string;
  };
  codexConfig?: {
    model?: string;
    approvalMode?: 'suggest' | 'auto-edit' | 'full-auto';
    provider?: string;
    notify?: boolean;
    temperature?: number;
    maxTokens?: number;
  };
  agentsConfig?: {
    globalInstructions?: string;
    projectInstructions?: string;
    customPrompts?: string[];
    workflowAutomation?: boolean;
  };
  templateId?: string;
  customizations?: Record<string, any>;
  keywords?: string[];
}

// Updated GenerationResult to match core implementation expectations
export interface GenerationResult {
  success: boolean;
  packageName: string;
  outputPath: string;
  analysis?: any;
  template?: string;
  executionTime: number;
  metrics?: Record<string, number>;
  artifacts?: Record<string, any>;
  error?: string;
  // Legacy support
  packagePath?: string;
  files?: string[];
  errors?: string[];
  warnings?: string[];
  generationId?: string;
  metadata?: {
    generationTime: number;
    filesCreated: number;
    linesOfCode: number;
    qualityScore: number;
    testCoverage?: number;
    securityScore: number;
    performanceScore: number;
    packageSizeKB: number;
    dependencyCount: number;
    devDependencyCount: number;
    codexIntegrated: boolean;
    agentsConfigured: boolean;
    cicdConfigured: boolean;
    dockerized: boolean;
    securityConfigured: boolean;
    templateUsed?: string;
    aiEnhanced: boolean;
  };
}

// AI Agent types
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface OpenAIAgentsConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AdvancedReasoningConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UltraThinkConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Code Generation types
export interface CodeGenerationRequest {
  purpose: string;
  context: any;
  language: string;
  features: string[];
  dependencies: string[];
}

// Security types
export interface SecurityVulnerability {
  id?: string;
  type?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title?: string;
  description: string;
  file: string;
  line?: number;
  code?: string;
  recommendation: string;
  cwe?: string;
  owasp?: string;
  cve?: string;
  category?: 'injection' | 'crypto' | 'auth' | 'xss' | 'misc';
}

export interface SecurityScanResult {
  vulnerabilities: SecurityVulnerability[];
  metrics?: {
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
    securityScore: number;
    complianceScore: number;
    hardeningScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    categories: Record<string, number>;
  };
  complianceResults?: Array<{
    standard: string;
    compliant: boolean;
    score: number;
    requirements: Array<{
      id: string;
      description: string;
      met: boolean;
      severity: string;
      recommendation?: string;
    }>;
  }>;
  hardeningResults?: {
    score: number;
    checks: {
      httpsEnforced: boolean;
      securityHeaders: boolean;
      inputValidation: boolean;
      errorHandling: boolean;
      logging: boolean;
    };
    recommendations: string[];
  };
  recommendations?: string[];
  score: number;
  timestamp: string;
  scanTimestamp?: string;
  scannedFiles?: number;
  scanDuration?: number;
}

// Analysis types
export interface CodeAnalysisResult {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  dependencies: string[];
  suggestions: Array<{
    type: 'refactor' | 'optimize' | 'secure' | 'document';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    effort: 'easy' | 'medium' | 'hard';
  }>;
  qualityScore: number;
  securityScore: number;
  performanceScore: number;
  detailedMetrics?: any;
  fileAnalyses?: Array<{
    filePath: string;
    metrics: any;
    issues: Array<{
      type: 'error' | 'warning' | 'info' | 'suggestion';
      severity: 'critical' | 'major' | 'minor' | 'info';
      message: string;
      line?: number;
      column?: number;
      rule?: string;
      fixable?: boolean;
      effort?: 'easy' | 'medium' | 'hard';
    }>;
    suggestions: Array<{
      type: 'refactor' | 'optimize' | 'secure' | 'document';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: string;
      effort: 'easy' | 'medium' | 'hard';
    }>;
  }>;
  securityIssues?: SecurityVulnerability[];
  codePatterns?: {
    patterns: string[];
    antiPatterns: string[];
    securityIssues: string[];
  };
  technicalDebt?: number;
  recommendations?: Array<{
    type: 'refactor' | 'optimize' | 'secure' | 'document';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    effort: 'easy' | 'medium' | 'hard';
  }>;
  projectHealth?: string;
}

export interface TemplateManagerConfig {
  templatesDir?: string;
  customTemplates?: PackageTemplate[];
}
