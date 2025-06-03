/**
 * AI Module - Exports for OpenNode Forge
 * ======================================
 *
 * Centralized AI functionality including:
 * - OpenAI Agents Manager
 * - Code generation capabilities
 * - Test generation
 * - Performance optimization
 */

export * from './agents';
export * from './reasoning';

/**
 * OpenAI Agents Manager for OpenNode Forge
 * =========================================
 *
 * Manages AI agents for code generation, testing, documentation,
 * and other automated development tasks.
 */

import { OpenAI } from 'openai';
import { OpenAIAgentsConfig, Agent } from '../types';

export interface CodeGenerationRequest {
  purpose: string;
  features: string[];
  dependencies: string[];
  language: string;
  context?: any;
}

export interface TestGenerationRequest {
  feature: string;
  purpose: string;
  language: string;
  context?: any;
}

export interface FastAPIGenerationRequest {
  purpose: string;
  features: string[];
  packageName: string;
  context?: any;
}

export class OpenAIAgentsManager {
  private openai: OpenAI;
  private config: Required<OpenAIAgentsConfig>;
  private agents: Map<string, Agent> = new Map();

  constructor(config: OpenAIAgentsConfig) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4',
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens || 2000,
    };

    // Validate API key
    if (!this.config.apiKey || this.config.apiKey === 'test-key' || this.config.apiKey.includes('your_api')) {
      console.warn('WARNING: No valid OpenAI API key provided. AI features will be disabled.');
      console.warn('Please set OPENAI_API_KEY environment variable or provide apiKey in config.');
      console.warn('Get your API key from: https://platform.openai.com/api-keys');
      
      // Create a mock OpenAI instance for offline mode
      this.openai = {
        chat: {
          completions: {
            create: async () => ({
              choices: [{ message: { content: this.generateFallbackResponse() } }],
            }),
          },
        },
      } as any;
    } else {
      try {
        this.openai = new OpenAI({
          apiKey: this.config.apiKey,
        });
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        // Fallback to mock instance
        this.openai = {
          chat: {
            completions: {
              create: async () => ({
                choices: [{ message: { content: this.generateFallbackResponse() } }],
              }),
            },
          },
        } as any;
      }
    }

    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Code Generation Agent
    this.agents.set('code-generator', {
      id: 'code-generator',
      name: 'Code Generator',
      description: 'Generates high-quality TypeScript/JavaScript code',
      capabilities: ['code-generation', 'best-practices', 'error-handling'],
      model: this.config.model,
      temperature: 0.2,
      maxTokens: 3000,
    });

    // Test Generation Agent
    this.agents.set('test-generator', {
      id: 'test-generator',
      name: 'Test Generator',
      description: 'Creates comprehensive test suites',
      capabilities: ['unit-tests', 'integration-tests', 'test-coverage'],
      model: this.config.model,
      temperature: 0.1,
      maxTokens: 2000,
    });

    // API Generator Agent
    this.agents.set('api-generator', {
      id: 'api-generator',
      name: 'API Generator',
      description: 'Generates FastAPI endpoints and documentation',
      capabilities: ['fastapi', 'rest-apis', 'openapi-docs'],
      model: this.config.model,
      temperature: 0.2,
      maxTokens: 2500,
    });

    // Documentation Agent
    this.agents.set('docs-generator', {
      id: 'docs-generator',
      name: 'Documentation Generator',
      description: 'Creates comprehensive documentation',
      capabilities: ['markdown', 'api-docs', 'examples'],
      model: this.config.model,
      temperature: 0.3,
      maxTokens: 2000,
    });
  }

  /**
   * Generate code using the code generation agent
   */
  async generateCode(request: CodeGenerationRequest): Promise<string> {
    const agent = this.agents.get('code-generator')!;

    const prompt = `
    Generate high-quality ${request.language} code for the following purpose:
    
    Purpose: ${request.purpose}
    Features: ${request.features.join(', ')}
    Dependencies: ${request.dependencies.join(', ')}
    
    Requirements:
    - Use modern ${request.language} best practices
    - Include comprehensive JSDoc comments
    - Implement proper error handling
    - Make the code modular and testable
    - Follow SOLID principles
    - Include TypeScript types if applicable
    
    ${request.context ? `Additional Context: ${JSON.stringify(request.context, null, 2)}` : ''}
    
    Return only the code without explanation.
    `;

    return this.callAgent(agent, prompt);
  }

  /**
   * Generate test code using the test generation agent
   */
  async generateTests(request: TestGenerationRequest): Promise<string> {
    const agent = this.agents.get('test-generator')!;

    const prompt = `
    Generate comprehensive unit tests for the following feature:
    
    Feature: ${request.feature}
    Purpose: ${request.purpose}
    Language: ${request.language}
    
    Requirements:
    - Use Jest testing framework
    - Include test cases for success scenarios
    - Include test cases for error scenarios
    - Test edge cases and boundary conditions
    - Achieve high test coverage
    - Use proper mocking where necessary
    - Include setup and teardown if needed
    
    ${request.context ? `Additional Context: ${JSON.stringify(request.context, null, 2)}` : ''}
    
    Return only the test code without explanation.
    `;

    return this.callAgent(agent, prompt);
  }

  /**
   * Generate integration tests
   */
  async generateIntegrationTests(request: {
    purpose: string;
    features: string[];
  }): Promise<string> {
    const agent = this.agents.get('test-generator')!;

    const prompt = `
    Generate integration tests for a package with the following specifications:
    
    Purpose: ${request.purpose}
    Features: ${request.features.join(', ')}
    
    Requirements:
    - Test the integration between different modules
    - Test external dependencies and APIs
    - Use realistic test data
    - Include setup and cleanup
    - Test error scenarios and timeouts
    - Use Jest testing framework
    
    Return only the test code without explanation.
    `;

    return this.callAgent(agent, prompt);
  }

  /**
   * Generate performance tests
   */
  async generatePerformanceTests(request: {
    purpose: string;
    features: string[];
  }): Promise<string> {
    const agent = this.agents.get('test-generator')!;

    const prompt = `
    Generate performance tests for a package with the following specifications:
    
    Purpose: ${request.purpose}
    Features: ${request.features.join(', ')}
    
    Requirements:
    - Test execution time and memory usage
    - Test scalability with large datasets
    - Benchmark critical operations
    - Set reasonable performance thresholds
    - Use Jest testing framework with performance assertions
    - Include baseline measurements
    
    Return only the test code without explanation.
    `;

    return this.callAgent(agent, prompt);
  }

  /**
   * Generate FastAPI endpoints
   */
  async generateFastAPIEndpoints(
    request: FastAPIGenerationRequest
  ): Promise<string> {
    const agent = this.agents.get('api-generator')!;

    const prompt = `
    Generate a FastAPI application for the following package:
    
    Package Name: ${request.packageName}
    Purpose: ${request.purpose}
    Features: ${request.features.join(', ')}
    
    Requirements:
    - Create a complete FastAPI application
    - Include proper error handling and validation
    - Use Pydantic models for request/response
    - Include health check endpoint
    - Add CORS middleware
    - Include OpenAPI documentation
    - Use async/await where appropriate
    - Follow REST API best practices
    
    ${request.context ? `Additional Context: ${JSON.stringify(request.context, null, 2)}` : ''}
    
    Return only the Python code without explanation.
    `;

    return this.callAgent(agent, prompt);
  }

  /**
   * Generate API documentation
   */
  async generateAPIDocumentation(request: {
    purpose: string;
    features: string[];
  }): Promise<string> {
    const agent = this.agents.get('docs-generator')!;

    const prompt = `
    Generate comprehensive API documentation for a package with:
    
    Purpose: ${request.purpose}
    Features: ${request.features.join(', ')}
    
    Requirements:
    - Create markdown documentation
    - Include endpoint descriptions
    - Provide request/response examples
    - Document authentication if applicable
    - Include error codes and responses
    - Add usage examples
    - Include rate limiting information
    
    Return only the markdown documentation.
    `;

    return this.callAgent(agent, prompt);
  }

  /**
   * Modify existing code
   */
  async modifyCode(filePath: string, changes: string): Promise<void> {
    // This would integrate with the file system to modify code
    // For now, this is a placeholder
    console.log(`Modifying code in ${filePath} with changes: ${changes}`);
  }

  /**
   * Add tests to existing test files
   */
  async addTests(testFile: string, tests: string): Promise<void> {
    // This would integrate with the file system to add tests
    // For now, this is a placeholder
    console.log(`Adding tests to ${testFile}: ${tests}`);
  }

  /**
   * Call an AI agent with a specific prompt
   */
  private async callAgent(agent: Agent, prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: agent.model,
        messages: [
          {
            role: 'system',
            content: `You are ${agent.name}. ${agent.description}. Your capabilities include: ${agent.capabilities.join(', ')}.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error(`No response from ${agent.name}`);
      }

      return content;
    } catch (error) {
      throw new Error(
        `${agent.name} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get available agents
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get a specific agent by ID
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Generate fallback response when OpenAI is not available
   */
  private generateFallbackResponse(): string {
    return `// Generated by OpenNode Generator (Offline Mode)
// This is a basic template generated without AI assistance
// To enable AI features, please set your OpenAI API key

export class GeneratedClass {
  constructor() {
    // Initialize your class here
  }
  
  public basicMethod(): string {
    return 'Basic functionality';
  }
}

export default GeneratedClass;
`;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.agents.clear();
  }
}

// Export Agent interface for external use
export { Agent } from '../types';

export default OpenAIAgentsManager;
