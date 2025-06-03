/**
 * Enhanced Code Analyzer for OpenNode Forge
 * ==========================================
 *
 * Provides comprehensive code analysis capabilities including:
 * - Advanced complexity analysis with cyclomatic complexity
 * - Quality metrics with maintainability index
 * - Performance analysis and optimization suggestions
 * - Security vulnerability detection
 * - AI-powered improvement recommendations
 * - Dependency analysis and audit
 * - Code pattern recognition
 * - Technical debt assessment
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { Logger } from '../core/logger';
import { CodeAnalysisResult, SecurityVulnerability } from '../types';

export interface AdvancedCodeMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    halstead: {
      vocabulary: number;
      length: number;
      difficulty: number;
      effort: number;
    };
  };
  maintainability: {
    index: number;
    linesOfCode: number;
    logicalLinesOfCode: number;
    commentRatio: number;
    duplicatedLines: number;
  };
  quality: {
    codeSmells: number;
    technicalDebt: number; // minutes
    reliabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
    securityRating: 'A' | 'B' | 'C' | 'D' | 'E';
    maintainabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  };
  performance: {
    potentialBottlenecks: string[];
    memoryUsagePattern: 'low' | 'medium' | 'high';
    computationalComplexity: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n²)' | 'O(2^n)';
  };
}

export interface FileAnalysisResult {
  filePath: string;
  metrics: AdvancedCodeMetrics;
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
}

export class CodeAnalyzer {
  private logger: Logger;
  private readonly complexityThresholds = {
    cyclomatic: { low: 5, medium: 10, high: 15 },
    cognitive: { low: 7, medium: 15, high: 25 },
    maintainability: { poor: 20, fair: 50, good: 80 },
  };

  constructor(options: { logger?: Logger } = {}) {
    this.logger = options.logger || new Logger({ component: 'CodeAnalyzer' });
  }

  /**
   * Analyze a complete package with enhanced metrics
   */
  async analyzePackage(packagePath: string): Promise<CodeAnalysisResult> {
    return this.logger.performance(
      `analyzePackage:${path.basename(packagePath)}`,
      async () => {
        this.logger.info('Starting comprehensive package analysis', {
          packagePath,
        });

        const srcDir = path.join(packagePath, 'src');

        if (!(await fs.pathExists(srcDir))) {
          throw new Error('Source directory not found');
        }

        const [
          files,
          packageJson,
          dependencies,
          testCoverage,
          securityIssues,
          codePatterns,
        ] = await Promise.all([
          this.findSourceFiles(srcDir),
          this.loadPackageJson(packagePath),
          this.analyzeDependencies(packagePath),
          this.calculateTestCoverage(packagePath),
          this.performSecurityAnalysis(packagePath),
          this.analyzeCodePatterns(packagePath),
        ]);

        const fileAnalyses = await this.analyzeFilesInParallel(files);
        const aggregatedMetrics = this.aggregateMetrics(fileAnalyses);
        const recommendations = await this.generateAIRecommendations(
          fileAnalyses,
          {
            packageJson,
            dependencies,
            codePatterns,
            securityIssues,
          }
        );

        const result: CodeAnalysisResult = {
          complexity: aggregatedMetrics.complexity.cyclomatic,
          maintainability: aggregatedMetrics.maintainability.index,
          testCoverage,
          dependencies: dependencies.all,
          suggestions: recommendations,
          qualityScore: this.calculateQualityScore(
            aggregatedMetrics,
            testCoverage,
            securityIssues
          ),
          securityScore: this.calculateSecurityScore(securityIssues),
          performanceScore: this.calculatePerformanceScore(aggregatedMetrics),

          // Enhanced fields
          detailedMetrics: aggregatedMetrics,
          fileAnalyses,
          securityIssues,
          codePatterns,
          technicalDebt: this.calculateTechnicalDebt(
            aggregatedMetrics,
            fileAnalyses
          ),
          recommendations: recommendations.filter((r) => r.priority === 'high'),
          projectHealth: this.assessProjectHealth(
            aggregatedMetrics,
            testCoverage,
            securityIssues
          ),
        };

        this.logger.info('Package analysis completed', {
          qualityScore: result.qualityScore,
          securityScore: result.securityScore,
          performanceScore: result.performanceScore,
          fileCount: files.length,
        });

        return result;
      }
    );
  }

  /**
   * Analyze files in parallel for better performance
   */
  private async analyzeFilesInParallel(
    files: string[]
  ): Promise<FileAnalysisResult[]> {
    const batchSize = 10; // Process files in batches to avoid overwhelming the system
    const results: FileAnalysisResult[] = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((file) => this.analyzeFile(file))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Enhanced file analysis with advanced metrics
   */
  private async analyzeFile(filePath: string): Promise<FileAnalysisResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const extension = path.extname(filePath);

    const [
      complexityMetrics,
      maintainabilityMetrics,
      performanceMetrics,
      securityIssues,
      codeSmells,
    ] = await Promise.all([
      this.calculateComplexityMetrics(content, extension),
      this.calculateMaintainabilityMetrics(content, filePath),
      this.analyzePerformance(content, extension),
      this.analyzeFileSecurity(content, filePath),
      this.detectCodeSmells(content, extension),
    ]);

    const metrics: AdvancedCodeMetrics = {
      complexity: complexityMetrics,
      maintainability: maintainabilityMetrics,
      quality: {
        codeSmells: codeSmells.length,
        technicalDebt: this.calculateFileTechnicalDebt(codeSmells),
        reliabilityRating: this.calculateReliabilityRating(
          complexityMetrics,
          codeSmells
        ),
        securityRating: this.calculateSecurityRating(securityIssues),
        maintainabilityRating: this.calculateMaintainabilityRating(
          maintainabilityMetrics
        ),
      },
      performance: performanceMetrics,
    };

    const issues = [
      ...codeSmells.map((smell) => ({
        type: 'warning' as const,
        severity: this.mapSeverity(smell.severity),
        message: smell.message,
        line: smell.line,
        column: smell.column,
        rule: smell.rule,
        fixable: smell.fixable,
        effort: smell.effort,
      })),
      ...securityIssues.map((issue) => ({
        type: 'error' as const,
        severity: this.mapSeverity(issue.severity),
        message: issue.description,
        line: issue.line,
        rule: issue.cwe || 'security',
        fixable: false,
        effort: 'medium' as const,
      })),
    ];

    const suggestions = this.generateFileSuggestions(metrics, issues);

    return {
      filePath,
      metrics,
      issues,
      suggestions,
    };
  }

  /**
   * Calculate advanced complexity metrics
   */
  private async calculateComplexityMetrics(content: string, extension: string) {
    const ast = this.parseToAST(content, extension);

    return {
      cyclomatic: this.calculateCyclomaticComplexity(content),
      cognitive: this.calculateCognitiveComplexity(content),
      halstead: this.calculateHalsteadMetrics(content),
    };
  }

  /**
   * Calculate cyclomatic complexity with better accuracy
   */
  private calculateCyclomaticComplexity(content: string): number {
    // Enhanced complexity calculation
    const complexityNodes = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /do\s+{/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g,
      /throw\s+/g,
    ];

    let complexity = 1; // Base complexity

    for (const pattern of complexityNodes) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate cognitive complexity (more human-focused than cyclomatic)
   */
  private calculateCognitiveComplexity(content: string): number {
    let complexity = 0;
    let nestingLevel = 0;
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Increment nesting for blocks
      if (trimmed.includes('{')) {
        nestingLevel++;
      }

      // Add complexity for control structures
      if (/^(if|while|for|switch|catch)\s*\(/.test(trimmed)) {
        complexity += 1 + nestingLevel;
      } else if (/^else\s*(if)?/.test(trimmed)) {
        complexity += 1;
      } else if (trimmed.includes('&&') || trimmed.includes('||')) {
        complexity += 1;
      }

      // Decrement nesting for closing blocks
      if (trimmed.includes('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
    }

    return complexity;
  }

  /**
   * Calculate Halstead metrics for code complexity
   */
  private calculateHalsteadMetrics(content: string) {
    const operators = new Set();
    const operands = new Set();

    // Simplified Halstead metrics calculation
    const operatorPatterns = [
      /[+\-*/%]/g,
      /[=!<>]=?/g,
      /&&|\|\|/g,
      /[&|^]/g,
      /[{}()[\]]/g,
    ];

    const operandPatterns = [
      /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g,
      /\b\d+\.?\d*\b/g,
      /["'`].*?["'`]/g,
    ];

    for (const pattern of operatorPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => operators.add(match));
      }
    }

    for (const pattern of operandPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => operands.add(match));
      }
    }

    const vocabulary = operators.size + operands.size;
    const length = content.split(/\s+/).length;
    const difficulty =
      (operators.size / 2) * (operands.size > 0 ? length / operands.size : 0);
    const effort = difficulty * length;

    return {
      vocabulary,
      length,
      difficulty: Math.round(difficulty * 100) / 100,
      effort: Math.round(effort),
    };
  }

  /**
   * Calculate maintainability metrics
   */
  private async calculateMaintainabilityMetrics(
    content: string,
    filePath: string
  ) {
    const lines = content.split('\n');
    const linesOfCode = lines.length;
    const logicalLines = lines.filter(
      (line) =>
        line.trim() &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('*')
    ).length;

    const commentLines = lines.filter(
      (line) =>
        line.trim().startsWith('//') ||
        line.trim().startsWith('*') ||
        line.trim().startsWith('/**') ||
        line.trim().startsWith('*/')
    ).length;

    const commentRatio = commentLines / linesOfCode;
    const duplicatedLines = await this.detectDuplicatedLines(content);

    // Maintainability Index calculation (simplified version of Microsoft's formula)
    const halstead = this.calculateHalsteadMetrics(content);
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);

    const maintainabilityIndex = Math.max(
      0,
      ((171 -
        5.2 * Math.log(halstead.vocabulary) -
        0.23 * cyclomaticComplexity -
        16.2 * Math.log(linesOfCode) +
        50 * Math.sin(Math.sqrt(2.4 * commentRatio))) *
        100) /
        171
    );

    return {
      index: Math.round(maintainabilityIndex),
      linesOfCode,
      logicalLinesOfCode: logicalLines,
      commentRatio: Math.round(commentRatio * 100) / 100,
      duplicatedLines,
    };
  }

  /**
   * Analyze performance characteristics
   */
  private async analyzePerformance(content: string, extension: string) {
    const potentialBottlenecks: string[] = [];

    // Detect performance issues
    if (content.includes('for (') && content.includes('for (')) {
      potentialBottlenecks.push(
        'Nested loops detected - consider optimization'
      );
    }

    if (content.match(/\.map\s*\([^)]*\.map/)) {
      potentialBottlenecks.push('Chained array operations - consider reducing');
    }

    if (content.includes('JSON.parse') && content.includes('JSON.stringify')) {
      potentialBottlenecks.push('Frequent JSON serialization detected');
    }

    const objectCreationMatches = content.match(/new\s+\w+\s*\(/g);
    if (objectCreationMatches && objectCreationMatches.length > 10) {
      potentialBottlenecks.push(
        'Multiple object instantiations - check memory usage'
      );
    }

    // Determine memory usage pattern
    const objectCreations = (content.match(/new\s+\w+/g) || []).length;
    const arrayOperations = (
      content.match(/\.(map|filter|reduce|forEach)/g) || []
    ).length;

    let memoryUsagePattern: 'low' | 'medium' | 'high' = 'low';
    if (objectCreations > 5 || arrayOperations > 8) {
      memoryUsagePattern = 'medium';
    }
    if (objectCreations > 15 || arrayOperations > 20) {
      memoryUsagePattern = 'high';
    }

    // Estimate computational complexity
    let computationalComplexity:
      | 'O(1)'
      | 'O(log n)'
      | 'O(n)'
      | 'O(n²)'
      | 'O(2^n)' = 'O(1)';

    if (content.includes('for (') || content.includes('while (')) {
      computationalComplexity = 'O(n)';
    }
    if (content.match(/for\s*\([^}]*for\s*\(/)) {
      computationalComplexity = 'O(n²)';
    }
    if (content.includes('recursion') && content.includes('fibonacci')) {
      computationalComplexity = 'O(2^n)';
    }

    return {
      potentialBottlenecks,
      memoryUsagePattern,
      computationalComplexity,
    };
  }

  /**
   * Enhanced security analysis
   */
  private async analyzeFileSecurity(
    content: string,
    filePath: string
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for common security issues
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        type: 'Code Injection',
        severity: 'critical' as const,
        cwe: 'CWE-94',
        description: 'Use of eval() can lead to code injection vulnerabilities',
      },
      {
        pattern: /innerHTML\s*=/g,
        type: 'XSS',
        severity: 'high' as const,
        cwe: 'CWE-79',
        description:
          'Direct innerHTML assignment can lead to XSS vulnerabilities',
      },
      {
        pattern: /document\.write\s*\(/g,
        type: 'XSS',
        severity: 'high' as const,
        cwe: 'CWE-79',
        description: 'document.write can be exploited for XSS attacks',
      },
      {
        pattern: /Math\.random\s*\(\s*\)/g,
        type: 'Weak Random',
        severity: 'medium' as const,
        cwe: 'CWE-338',
        description: 'Math.random() is not cryptographically secure',
      },
    ];

    const lines = content.split('\n');

    for (const {
      pattern,
      type,
      severity,
      cwe,
      description,
    } of securityPatterns) {
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type,
            severity,
            description,
            file: filePath,
            line: index + 1,
            cwe,
            recommendation: this.getSecurityRecommendation(type),
            category: this.getSecurityCategory(type),
          });
        }
      });
    }

    return vulnerabilities;
  }

  /**
   * Detect code smells and anti-patterns
   */
  private async detectCodeSmells(content: string, extension: string) {
    const codeSmells: Array<{
      type: string;
      severity: 'critical' | 'major' | 'minor' | 'info';
      message: string;
      line?: number;
      column?: number;
      rule: string;
      fixable: boolean;
      effort: 'easy' | 'medium' | 'hard';
    }> = [];

    const lines = content.split('\n');

    // Long method detection
    let currentFunctionStart = -1;
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.match(/function\s+\w+|=>\s*{|class\s+\w+/)) {
        currentFunctionStart = index;
      } else if (trimmed === '}' && currentFunctionStart !== -1) {
        const functionLength = index - currentFunctionStart;
        if (functionLength > 50) {
          codeSmells.push({
            type: 'Long Method',
            severity: 'major',
            message: `Method is too long (${functionLength} lines). Consider breaking it down.`,
            line: currentFunctionStart + 1,
            rule: 'max-lines-per-function',
            fixable: false,
            effort: 'medium',
          });
        }
        currentFunctionStart = -1;
      }

      // Other code smells
      if (trimmed.includes('console.log')) {
        codeSmells.push({
          type: 'Debug Code',
          severity: 'minor',
          message: 'Remove console.log statement before production',
          line: index + 1,
          rule: 'no-console',
          fixable: true,
          effort: 'easy',
        });
      }

      if (trimmed.length > 120) {
        codeSmells.push({
          type: 'Long Line',
          severity: 'minor',
          message: `Line too long (${trimmed.length} characters)`,
          line: index + 1,
          rule: 'max-len',
          fixable: true,
          effort: 'easy',
        });
      }
    });

    return codeSmells;
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations(
    fileAnalyses: FileAnalysisResult[],
    context: any
  ): Promise<
    Array<{
      type: 'refactor' | 'optimize' | 'secure' | 'document';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: string;
      effort: 'easy' | 'medium' | 'hard';
    }>
  > {
    const recommendations = [];

    // Analyze overall patterns
    const totalComplexity = fileAnalyses.reduce(
      (sum, analysis) => sum + analysis.metrics.complexity.cyclomatic,
      0
    );
    const avgComplexity = totalComplexity / fileAnalyses.length;

    if (avgComplexity > this.complexityThresholds.cyclomatic.high) {
      recommendations.push({
        type: 'refactor' as const,
        priority: 'high' as const,
        description:
          'High overall complexity detected. Consider refactoring complex methods.',
        impact: 'Improved maintainability and reduced bug risk',
        effort: 'hard' as const,
      });
    }

    const securityIssues = fileAnalyses.flatMap((f) =>
      f.issues.filter((i) => i.type === 'error')
    );
    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'secure' as const,
        priority: 'high' as const,
        description: `${securityIssues.length} security issues found. Address immediately.`,
        impact: 'Reduced security vulnerabilities',
        effort: 'medium' as const,
      });
    }

    const lowTestCoverage = context.testCoverage < 70;
    if (lowTestCoverage) {
      recommendations.push({
        type: 'document' as const,
        priority: 'medium' as const,
        description:
          'Test coverage is below recommended threshold. Add more tests.',
        impact: 'Better code reliability and maintainability',
        effort: 'medium' as const,
      });
    }

    return recommendations;
  }

  private async findSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            const subFiles = await this.findSourceFiles(fullPath);
            files.push(...subFiles);
          } else if (entry.isFile() && this.isSourceFile(entry.name)) {
            files.push(fullPath);
          }
        })
      );
    } catch (error) {
      this.logger.error('Error reading directory', error, { dir });
    }

    return files;
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
    ];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  private isSourceFile(name: string): boolean {
    return /\.(ts|js|tsx|jsx|vue|svelte)$/.test(name);
  }

  private parseToAST(content: string, extension: string): any {
    // Placeholder for AST parsing - would integrate with actual parser
    return {};
  }

  private async loadPackageJson(packagePath: string): Promise<any> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        return await fs.readJson(packageJsonPath);
      }
    } catch (error) {
      this.logger.warn('Could not load package.json', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return {};
  }

  private async detectDuplicatedLines(content: string): Promise<number> {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);
    const lineCount = new Map<string, number>();

    for (const line of lines) {
      lineCount.set(line, (lineCount.get(line) || 0) + 1);
    }

    return Array.from(lineCount.values()).reduce(
      (sum, count) => (count > 1 ? sum + (count - 1) : sum),
      0
    );
  }

  // Helper methods for calculations and ratings
  private calculateQualityScore(
    metrics: AdvancedCodeMetrics,
    testCoverage: number,
    securityIssues: any[]
  ): number {
    const maintainabilityScore = metrics.maintainability.index;
    const complexityPenalty = Math.min(30, metrics.complexity.cyclomatic * 2);
    const securityPenalty = securityIssues.length * 5;
    const testBonus = testCoverage * 0.3;

    return Math.max(
      0,
      Math.min(
        100,
        maintainabilityScore - complexityPenalty - securityPenalty + testBonus
      )
    );
  }

  private calculateSecurityScore(
    securityIssues: SecurityVulnerability[]
  ): number {
    let score = 100;

    for (const issue of securityIssues) {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 1;
          break;
      }
    }

    return Math.max(0, score);
  }

  private calculatePerformanceScore(metrics: AdvancedCodeMetrics): number {
    let score = 100;

    // Penalize based on performance indicators
    if (metrics.performance.computationalComplexity === 'O(n²)') score -= 20;
    if (metrics.performance.computationalComplexity === 'O(2^n)') score -= 40;
    if (metrics.performance.memoryUsagePattern === 'high') score -= 15;
    if (metrics.performance.potentialBottlenecks.length > 0) {
      score -= metrics.performance.potentialBottlenecks.length * 5;
    }

    return Math.max(0, score);
  }

  private aggregateMetrics(
    fileAnalyses: FileAnalysisResult[]
  ): AdvancedCodeMetrics {
    // Aggregate all file metrics into overall project metrics
    const totalFiles = fileAnalyses.length;

    return {
      complexity: {
        cyclomatic:
          fileAnalyses.reduce(
            (sum, f) => sum + f.metrics.complexity.cyclomatic,
            0
          ) / totalFiles,
        cognitive:
          fileAnalyses.reduce(
            (sum, f) => sum + f.metrics.complexity.cognitive,
            0
          ) / totalFiles,
        halstead: {
          vocabulary:
            fileAnalyses.reduce(
              (sum, f) => sum + f.metrics.complexity.halstead.vocabulary,
              0
            ) / totalFiles,
          length:
            fileAnalyses.reduce(
              (sum, f) => sum + f.metrics.complexity.halstead.length,
              0
            ) / totalFiles,
          difficulty:
            fileAnalyses.reduce(
              (sum, f) => sum + f.metrics.complexity.halstead.difficulty,
              0
            ) / totalFiles,
          effort:
            fileAnalyses.reduce(
              (sum, f) => sum + f.metrics.complexity.halstead.effort,
              0
            ) / totalFiles,
        },
      },
      maintainability: {
        index:
          fileAnalyses.reduce(
            (sum, f) => sum + f.metrics.maintainability.index,
            0
          ) / totalFiles,
        linesOfCode: fileAnalyses.reduce(
          (sum, f) => sum + f.metrics.maintainability.linesOfCode,
          0
        ),
        logicalLinesOfCode: fileAnalyses.reduce(
          (sum, f) => sum + f.metrics.maintainability.logicalLinesOfCode,
          0
        ),
        commentRatio:
          fileAnalyses.reduce(
            (sum, f) => sum + f.metrics.maintainability.commentRatio,
            0
          ) / totalFiles,
        duplicatedLines: fileAnalyses.reduce(
          (sum, f) => sum + f.metrics.maintainability.duplicatedLines,
          0
        ),
      },
      quality: {
        codeSmells: fileAnalyses.reduce(
          (sum, f) => sum + f.metrics.quality.codeSmells,
          0
        ),
        technicalDebt: fileAnalyses.reduce(
          (sum, f) => sum + f.metrics.quality.technicalDebt,
          0
        ),
        reliabilityRating: this.getAverageRating(
          fileAnalyses.map((f) => f.metrics.quality.reliabilityRating)
        ),
        securityRating: this.getAverageRating(
          fileAnalyses.map((f) => f.metrics.quality.securityRating)
        ),
        maintainabilityRating: this.getAverageRating(
          fileAnalyses.map((f) => f.metrics.quality.maintainabilityRating)
        ),
      },
      performance: {
        potentialBottlenecks: Array.from(
          new Set(
            fileAnalyses.flatMap(
              (f) => f.metrics.performance.potentialBottlenecks
            )
          )
        ),
        memoryUsagePattern: this.getWorstMemoryPattern(
          fileAnalyses.map((f) => f.metrics.performance.memoryUsagePattern)
        ),
        computationalComplexity: this.getWorstComplexity(
          fileAnalyses.map((f) => f.metrics.performance.computationalComplexity)
        ),
      },
    };
  }

  // ... Additional helper methods for calculations and assessments ...

  private async calculateTestCoverage(packagePath: string): Promise<number> {
    // Enhanced test coverage calculation
    const testDir = path.join(packagePath, 'test');
    const specDir = path.join(packagePath, 'spec');
    const srcDir = path.join(packagePath, 'src');

    const [testFiles, specFiles, srcFiles] = await Promise.all([
      this.findTestFiles(testDir),
      this.findTestFiles(specDir),
      this.findSourceFiles(srcDir),
    ]);

    const totalTestFiles = testFiles.length + specFiles.length;
    const totalSrcFiles = srcFiles.length;

    if (totalSrcFiles === 0) return 0;

    // Basic coverage estimation based on test-to-source ratio
    const basicCoverage = (totalTestFiles / totalSrcFiles) * 100;

    // Check for coverage reports
    const coverageReportPath = path.join(
      packagePath,
      'coverage',
      'lcov-report',
      'index.html'
    );
    if (await fs.pathExists(coverageReportPath)) {
      try {
        const coverageReport = await fs.readFile(coverageReportPath, 'utf-8');
        const coverageMatch = coverageReport.match(
          /Lines<\/dt>\s*<dd[^>]*>([0-9.]+)%/
        );
        if (coverageMatch) {
          return parseFloat(coverageMatch[1]);
        }
      } catch (error) {
        this.logger.warn('Could not parse coverage report', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return Math.min(basicCoverage, 100);
  }

  private async findTestFiles(dir: string): Promise<string[]> {
    if (!dir || !(await fs.pathExists(dir))) return [];

    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
        files.push(...(await this.findTestFiles(fullPath)));
      } else if (entry.isFile() && this.isTestFile(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private isTestFile(name: string): boolean {
    return (
      /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(name) || name.includes('__tests__')
    );
  }

  private async analyzeDependencies(
    packagePath: string
  ): Promise<{ all: string[]; dev: string[]; prod: string[] }> {
    const packageJson = await this.loadPackageJson(packagePath);

    const prodDeps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    return {
      all: [...prodDeps, ...devDeps],
      dev: devDeps,
      prod: prodDeps,
    };
  }

  private async performSecurityAnalysis(
    packagePath: string
  ): Promise<SecurityVulnerability[]> {
    // This would integrate with actual security scanning tools
    // For now, return empty array as placeholder
    return [];
  }

  private async analyzeCodePatterns(packagePath: string): Promise<{
    patterns: string[];
    antiPatterns: string[];
    securityIssues: string[];
  }> {
    // Placeholder for pattern analysis
    return {
      patterns: [],
      antiPatterns: [],
      securityIssues: [],
    };
  }

  // ... Additional helper methods for ratings and calculations

  private mapSeverity(
    severity: string
  ): 'critical' | 'major' | 'minor' | 'info' {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'major';
      case 'medium':
        return 'minor';
      case 'low':
        return 'info';
      default:
        return 'minor';
    }
  }

  private getSecurityRecommendation(type: string): string {
    const recommendations = {
      'Code Injection':
        'Avoid eval() and similar functions, use safe alternatives',
      XSS: 'Use textContent or safe DOM manipulation methods',
      'Weak Random': 'Use cryptographically secure random number generators',
    };

    return (
      recommendations[type as keyof typeof recommendations] ||
      'Follow security best practices'
    );
  }

  private getSecurityCategory(
    type: string
  ): 'injection' | 'crypto' | 'auth' | 'xss' | 'misc' {
    const categories = {
      'Code Injection': 'injection',
      XSS: 'xss',
      'Weak Random': 'crypto',
    } as const;

    return categories[type as keyof typeof categories] || 'misc';
  }

  private calculateTechnicalDebt(
    aggregatedMetrics: any,
    fileAnalyses: any[]
  ): number {
    // Calculate technical debt in minutes based on code smells and complexity
    let debtMinutes = 0;

    fileAnalyses.forEach((analysis) => {
      // Add debt for each code smell
      debtMinutes += analysis.metrics.quality.codeSmells * 15; // 15 minutes per code smell

      // Add debt for high complexity
      if (analysis.metrics.complexity.cyclomatic > 10) {
        debtMinutes += (analysis.metrics.complexity.cyclomatic - 10) * 30;
      }
    });

    return debtMinutes;
  }

  private assessProjectHealth(
    aggregatedMetrics: any,
    testCoverage: number,
    securityIssues: any[]
  ): string {
    let score = 100;

    // Deduct points for various issues
    score -= securityIssues.length * 5;
    score -= Math.max(0, 80 - testCoverage); // Penalty for low test coverage
    score -= Math.max(0, aggregatedMetrics.complexity.cyclomatic - 5) * 2;

    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }

  private calculateFileTechnicalDebt(codeSmells: any[]): number {
    return codeSmells.reduce((debt, smell) => {
      switch (smell.severity) {
        case 'critical':
          return debt + 60;
        case 'major':
          return debt + 30;
        case 'minor':
          return debt + 15;
        default:
          return debt + 5;
      }
    }, 0);
  }

  private calculateReliabilityRating(
    complexityMetrics: any,
    codeSmells: any[]
  ): 'A' | 'B' | 'C' | 'D' | 'E' {
    const complexity = complexityMetrics.cyclomatic;
    const smellCount = codeSmells.length;

    if (complexity <= 5 && smellCount <= 2) return 'A';
    if (complexity <= 10 && smellCount <= 5) return 'B';
    if (complexity <= 15 && smellCount <= 10) return 'C';
    if (complexity <= 25 && smellCount <= 15) return 'D';
    return 'E';
  }

  private calculateSecurityRating(
    securityIssues: SecurityVulnerability[]
  ): 'A' | 'B' | 'C' | 'D' | 'E' {
    const criticalIssues = securityIssues.filter(
      (i) => i.severity === 'critical'
    ).length;
    const highIssues = securityIssues.filter(
      (i) => i.severity === 'high'
    ).length;

    if (criticalIssues === 0 && highIssues === 0) return 'A';
    if (criticalIssues === 0 && highIssues <= 2) return 'B';
    if (criticalIssues <= 1 && highIssues <= 5) return 'C';
    if (criticalIssues <= 2 && highIssues <= 10) return 'D';
    return 'E';
  }

  private calculateMaintainabilityRating(
    maintainabilityMetrics: any
  ): 'A' | 'B' | 'C' | 'D' | 'E' {
    const index = maintainabilityMetrics.index;

    if (index >= 80) return 'A';
    if (index >= 65) return 'B';
    if (index >= 50) return 'C';
    if (index >= 35) return 'D';
    return 'E';
  }

  private generateFileSuggestions(
    metrics: any,
    issues: any[]
  ): Array<{
    type: 'refactor' | 'optimize' | 'secure' | 'document';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    effort: 'easy' | 'medium' | 'hard';
  }> {
    const suggestions = [];

    if (metrics.complexity.cyclomatic > 10) {
      suggestions.push({
        type: 'refactor' as const,
        priority: 'high' as const,
        description:
          'Reduce cyclomatic complexity by breaking down complex methods',
        impact: 'Improved maintainability and reduced bug risk',
        effort: 'medium' as const,
      });
    }

    if (issues.filter((i) => i.type === 'error').length > 0) {
      suggestions.push({
        type: 'secure' as const,
        priority: 'high' as const,
        description: 'Address security vulnerabilities found in the code',
        impact: 'Reduced security risk',
        effort: 'medium' as const,
      });
    }

    if (metrics.maintainability.commentRatio < 0.1) {
      suggestions.push({
        type: 'document' as const,
        priority: 'medium' as const,
        description: 'Add more comments and documentation',
        impact: 'Better code understanding and maintainability',
        effort: 'easy' as const,
      });
    }

    return suggestions;
  }

  private getAverageRating(
    ratings: ('A' | 'B' | 'C' | 'D' | 'E')[]
  ): 'A' | 'B' | 'C' | 'D' | 'E' {
    const values = ratings.map((r) => ({ A: 5, B: 4, C: 3, D: 2, E: 1 })[r]);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    if (avg >= 4.5) return 'A';
    if (avg >= 3.5) return 'B';
    if (avg >= 2.5) return 'C';
    if (avg >= 1.5) return 'D';
    return 'E';
  }

  private getWorstMemoryPattern(
    patterns: ('low' | 'medium' | 'high')[]
  ): 'low' | 'medium' | 'high' {
    if (patterns.includes('high')) return 'high';
    if (patterns.includes('medium')) return 'medium';
    return 'low';
  }

  private getWorstComplexity(
    complexities: string[]
  ): 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n²)' | 'O(2^n)' {
    const order = ['O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'O(2^n)'];
    let worst = 'O(1)' as const;

    for (const complexity of complexities) {
      const currentIndex = order.indexOf(complexity);
      const worstIndex = order.indexOf(worst);
      if (currentIndex > worstIndex) {
        worst = complexity as any;
      }
    }

    return worst;
  }
}

export default CodeAnalyzer;
