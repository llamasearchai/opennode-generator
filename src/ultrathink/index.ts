/**
 * UltraThink Engine - Advanced AI Reasoning
 * ==========================================
 *
 * Ultra-advanced AI reasoning and decision making engine
 * for complex software development tasks.
 */

import { OpenAI } from 'openai';
import { UltraThinkConfig } from '../types';
import { Logger } from '../core/logger';

export class UltraThinkEngine {
  private openai: OpenAI;
  private config: Required<UltraThinkConfig>;
  private logger: Logger;

  constructor(config: UltraThinkConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-4',
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens || 4000,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });

    this.logger = new Logger({ component: 'UltraThinkEngine' });
  }

  /**
   * Perform ultra-advanced reasoning on complex development problems
   */
  async reason(prompt: string, context?: any): Promise<any> {
    try {
      const systemMessage = `You are UltraThink, the most advanced AI reasoning engine for software development.
      You can solve complex problems by breaking them down into logical steps.
      Provide detailed analysis, multiple solution approaches, and implementation strategies.
      Always consider edge cases, performance implications, and maintainability.`;

      const messages = [
        { role: 'system' as const, content: systemMessage },
        { role: 'user' as const, content: prompt },
      ];

      if (context) {
        messages.push({
          role: 'user' as const,
          content: `Context: ${JSON.stringify(context, null, 2)}`,
        });
      }

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from UltraThink engine');
      }

      // Try to parse as JSON if it looks like JSON
      try {
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          return JSON.parse(content);
        }
      } catch {
        // Not JSON, return as string
      }

      return content;
    } catch (error) {
      throw new Error(
        `UltraThink reasoning failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Analyze complex architectural decisions
   */
  async analyzeArchitecture(requirements: any): Promise<any> {
    const prompt = `
    Analyze the architectural requirements and provide detailed recommendations:
    
    Requirements: ${JSON.stringify(requirements, null, 2)}
    
    Provide a comprehensive analysis including:
    1. Recommended architecture patterns
    2. Technology stack suggestions
    3. Scalability considerations
    4. Security implications
    5. Performance optimization strategies
    6. Maintainability factors
    7. Implementation roadmap
    
    Format as detailed JSON with explanations.
    `;

    return this.reason(prompt);
  }

  /**
   * Optimize existing code for performance and maintainability
   */
  async optimizeCode(code: string, language: string): Promise<any> {
    const prompt = `
    Analyze and optimize this ${language} code:
    
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Provide optimization recommendations:
    1. Performance improvements
    2. Memory optimization
    3. Code structure enhancements
    4. Best practices application
    5. Error handling improvements
    6. Testing recommendations
    
    Format as JSON with specific suggestions and refactored code examples.
    `;

    return this.reason(prompt);
  }

  /**
   * Generate comprehensive project documentation
   */
  async generateDocumentation(project: any): Promise<string> {
    const prompt = `
    Generate comprehensive documentation for this project:
    
    Project: ${JSON.stringify(project, null, 2)}
    
    Create:
    1. Project overview and purpose
    2. Installation instructions
    3. Usage examples
    4. API documentation
    5. Contributing guidelines
    6. Troubleshooting guide
    
    Format as clean Markdown.
    `;

    const result = await this.reason(prompt);
    return typeof result === 'string'
      ? result
      : JSON.stringify(result, null, 2);
  }

  /**
   * Generate enhancement plan for existing packages
   */
  async generateEnhancementPlan(
    analysis: any,
    enhancement: string
  ): Promise<any> {
    try {
      // Validate inputs
      if (!analysis || typeof analysis !== 'object') {
        throw new Error('Invalid analysis object provided');
      }

      if (
        !enhancement ||
        typeof enhancement !== 'string' ||
        enhancement.trim().length === 0
      ) {
        throw new Error('Enhancement description is required');
      }

      const prompt = `
      Create a comprehensive enhancement plan for this package:
      
      Current Analysis: ${JSON.stringify(analysis, null, 2)}
      
      Requested Enhancement: "${enhancement}"
      
      Generate a detailed JSON plan with these fields:
      {
        "description": "What this enhancement achieves and its business value",
        "scope": "high|medium|low - complexity and scope of changes",
        "steps": [
          {
            "id": "unique step identifier",
            "type": "code_modification|test_addition|dependency_addition|file_creation|configuration|documentation",
            "description": "What this step does",
            "file": "path/to/file",
            "changes": "specific changes to make",
            "priority": "high|medium|low",
            "dependencies": ["list of step IDs this depends on"],
            "estimatedHours": "time estimate in hours",
            "complexity": "low|medium|high"
          }
        ],
        "risks": [
          {
            "description": "potential risk",
            "severity": "high|medium|low",
            "mitigation": "how to mitigate this risk",
            "probability": "high|medium|low"
          }
        ],
        "benefits": [
          {
            "description": "expected benefit",
            "impact": "high|medium|low",
            "measurable": "how to measure this benefit"
          }
        ],
        "estimatedTime": "total time estimate",
        "prerequisites": ["things needed before starting"],
        "successCriteria": ["how to know if the enhancement was successful"],
        "rollbackPlan": "how to rollback if something goes wrong"
      }
      `;

      const result = await this.reason(prompt);

      // Validate the response structure
      this.validateEnhancementPlan(result);

      return result;
    } catch (error) {
      this.logger.error('Enhancement plan generation failed', error, {
        enhancement,
        analysisKeys: analysis ? Object.keys(analysis) : [],
      });

      // Return a fallback plan
      return this.generateFallbackEnhancementPlan(enhancement);
    }
  }

  /**
   * Validate enhancement plan structure
   */
  private validateEnhancementPlan(plan: any): void {
    const requiredFields = [
      'description',
      'steps',
      'risks',
      'benefits',
      'estimatedTime',
    ];

    for (const field of requiredFields) {
      if (!plan[field]) {
        throw new Error(`Enhancement plan missing required field: ${field}`);
      }
    }

    if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
      throw new Error('Enhancement plan must have at least one step');
    }

    // Validate each step
    for (const step of plan.steps) {
      const stepRequired = ['type', 'description', 'priority'];
      for (const field of stepRequired) {
        if (!step[field]) {
          throw new Error(`Enhancement step missing required field: ${field}`);
        }
      }
    }
  }

  /**
   * Generate fallback enhancement plan when AI fails
   */
  private generateFallbackEnhancementPlan(enhancement: string): any {
    return {
      description: `Implement ${enhancement} with standard best practices`,
      scope: 'medium',
      steps: [
        {
          id: 'analysis',
          type: 'code_modification',
          description:
            'Analyze current codebase and identify modification points',
          file: 'src/',
          changes: 'Review and document current implementation',
          priority: 'high',
          dependencies: [],
          estimatedHours: '2-4',
          complexity: 'low',
        },
        {
          id: 'implementation',
          type: 'code_modification',
          description: `Implement ${enhancement} functionality`,
          file: 'src/',
          changes: 'Add new functionality following existing patterns',
          priority: 'high',
          dependencies: ['analysis'],
          estimatedHours: '4-8',
          complexity: 'medium',
        },
        {
          id: 'testing',
          type: 'test_addition',
          description: 'Add comprehensive tests for new functionality',
          file: 'test/',
          changes: 'Create unit and integration tests',
          priority: 'high',
          dependencies: ['implementation'],
          estimatedHours: '2-4',
          complexity: 'medium',
        },
        {
          id: 'documentation',
          type: 'documentation',
          description: 'Update documentation to reflect new features',
          file: 'README.md',
          changes: 'Add usage examples and API documentation',
          priority: 'medium',
          dependencies: ['testing'],
          estimatedHours: '1-2',
          complexity: 'low',
        },
      ],
      risks: [
        {
          description: 'Breaking changes to existing functionality',
          severity: 'medium',
          mitigation: 'Comprehensive testing and gradual rollout',
          probability: 'low',
        },
      ],
      benefits: [
        {
          description: 'Enhanced functionality and user experience',
          impact: 'medium',
          measurable: 'User feedback and adoption metrics',
        },
      ],
      estimatedTime: '8-16 hours',
      prerequisites: ['Development environment setup', 'Access to codebase'],
      successCriteria: [
        'All tests pass',
        'Documentation is updated',
        'No regression bugs',
      ],
      rollbackPlan: 'Revert commits and restore previous version from git',
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // No cleanup needed for OpenAI client
  }
}

export default UltraThinkEngine;
