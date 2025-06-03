/**
 * Advanced AI Reasoning Engine for OpenNode Forge
 * ================================================
 *
 * Provides sophisticated AI reasoning capabilities for package analysis,
 * code generation, and intelligent decision making.
 */

import { OpenAI } from 'openai';
import { AdvancedReasoningConfig } from '../types';

export class AdvancedReasoningEngine {
  private openai: OpenAI;
  private config: Required<AdvancedReasoningConfig>;

  constructor(config: AdvancedReasoningConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-4',
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens || 2000,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  /**
   * Perform advanced reasoning on a given prompt
   */
  async reason(prompt: string, context?: any): Promise<any> {
    try {
      const systemMessage = `You are an advanced AI reasoning engine for software development. 
      You provide intelligent analysis, recommendations, and solutions.
      Always respond with well-structured, actionable insights.
      When providing code or configurations, ensure they follow best practices.`;

      const messages = [
        { role: 'system' as const, content: systemMessage },
        { role: 'user' as const, content: prompt },
      ];

      if (context) {
        messages.push({
          role: 'user' as const,
          content: `Additional Context: ${JSON.stringify(context, null, 2)}`,
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
        throw new Error('No response from AI reasoning engine');
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
        `AI reasoning failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Analyze package requirements and provide structured recommendations
   */
  async analyzePackageRequirements(idea: string): Promise<any> {
    const prompt = `
    Analyze this npm package idea and provide a comprehensive analysis in JSON format:
    
    Package Idea: "${idea}"
    
    Please provide a JSON response with these fields:
    {
      "purpose": "Clear description of what this package does",
      "dependencies": ["array", "of", "required", "dependencies"],
      "devDependencies": ["array", "of", "dev", "dependencies"],
      "structure": {
        "src/": "Main source code directory",
        "test/": "Test files directory",
        "docs/": "Documentation directory"
      },
      "testingStrategy": "Description of testing approach",
      "buildConfig": "Build system recommendation",
      "documentation": ["README.md", "API.md"],
      "security": ["security", "considerations"],
      "performance": ["performance", "optimizations"],
      "features": ["list", "of", "key", "features"],
      "keywords": ["npm", "keywords"]
    }
    `;

    return this.reason(prompt);
  }

  /**
   * Select optimal template based on analysis
   */
  async selectOptimalTemplate(
    analysis: any,
    availableTemplates: any[]
  ): Promise<string> {
    const prompt = `
    Based on this package analysis, select the most appropriate template:
    
    Analysis: ${JSON.stringify(analysis, null, 2)}
    
    Available templates: 
    ${availableTemplates.map((t) => `- ${t.name}: ${t.description} (type: ${t.type})`).join('\n')}
    
    Return only the template name that best matches the requirements.
    Consider the package purpose, features, and complexity.
    `;

    const result = await this.reason(prompt);
    return typeof result === 'string' ? result.trim() : result;
  }

  /**
   * Generate enhancement plan for existing packages
   */
  async generateEnhancementPlan(
    analysis: any,
    enhancement: string
  ): Promise<any> {
    const prompt = `
    Create an enhancement plan for this package:
    
    Current Analysis: ${JSON.stringify(analysis, null, 2)}
    
    Requested Enhancement: "${enhancement}"
    
    Generate a JSON plan with these fields:
    {
      "description": "What this enhancement achieves",
      "steps": [
        {
          "type": "code_modification|test_addition|dependency_addition|file_creation",
          "description": "What this step does",
          "file": "path/to/file",
          "changes": "specific changes to make",
          "priority": "high|medium|low"
        }
      ],
      "risks": ["potential", "risks"],
      "benefits": ["expected", "benefits"],
      "estimatedTime": "time estimate"
    }
    `;

    return this.reason(prompt);
  }

  /**
   * Validate code quality and suggest improvements
   */
  async validateCodeQuality(code: string, language: string): Promise<any> {
    const prompt = `
    Analyze this ${language} code for quality, best practices, and potential improvements:
    
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Provide a JSON response with:
    {
      "quality_score": 85,
      "issues": [
        {
          "type": "error|warning|suggestion",
          "message": "Description of the issue",
          "line": 10,
          "severity": "high|medium|low"
        }
      ],
      "improvements": [
        "Specific improvement suggestions"
      ],
      "best_practices": [
        "Best practices that could be applied"
      ]
    }
    `;

    return this.reason(prompt);
  }

  /**
   * Generate smart code suggestions
   */
  async generateCodeSuggestions(
    purpose: string,
    context: any
  ): Promise<string> {
    const prompt = `
    Generate high-quality ${context.language || 'TypeScript'} code for this purpose:
    
    Purpose: ${purpose}
    Context: ${JSON.stringify(context, null, 2)}
    
    Requirements:
    - Follow best practices and modern patterns
    - Include proper error handling
    - Add comprehensive JSDoc comments
    - Use TypeScript types appropriately
    - Make the code maintainable and testable
    
    Return only the code, no additional explanation.
    `;

    const result = await this.reason(prompt);
    return typeof result === 'string'
      ? result
      : JSON.stringify(result, null, 2);
  }

  /**
   * Analyze security implications
   */
  async analyzeSecurityImplications(code: string, context: any): Promise<any> {
    const prompt = `
    Analyze the security implications of this code:
    
    Code:
    \`\`\`
    ${code}
    \`\`\`
    
    Context: ${JSON.stringify(context, null, 2)}
    
    Provide a JSON response with:
    {
      "security_score": 85,
      "vulnerabilities": [
        {
          "type": "vulnerability type",
          "severity": "critical|high|medium|low",
          "description": "vulnerability description",
          "recommendation": "how to fix"
        }
      ],
      "recommendations": [
        "general security recommendations"
      ]
    }
    `;

    return this.reason(prompt);
  }

  /**
   * Get performance optimization suggestions
   */
  async getPerformanceOptimizations(analysis: any): Promise<any> {
    const prompt = `
    Suggest performance optimizations for this package:
    
    Analysis: ${JSON.stringify(analysis, null, 2)}
    
    Provide JSON response with:
    {
      "optimizations": [
        {
          "area": "bundle size|runtime|memory|network",
          "suggestion": "specific optimization",
          "impact": "high|medium|low",
          "effort": "high|medium|low"
        }
      ],
      "tools": ["recommended", "tools"],
      "metrics": ["metrics", "to", "track"]
    }
    `;

    return this.reason(prompt);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // No cleanup needed for OpenAI client
  }
}

export default AdvancedReasoningEngine;
