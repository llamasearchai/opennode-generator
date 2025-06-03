/**
 * UltraThink Engine Tests
 * =======================
 * 
 * Comprehensive test suite for the UltraThink AI reasoning engine
 */

import { UltraThinkEngine, AnalysisResult, CreativeSolution } from '../../src/ultrathink';

// Mock OpenAI client
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

describe('UltraThinkEngine', () => {
  let engine: UltraThinkEngine;
  let mockOpenAI: any;

  beforeEach(() => {
    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Create engine with test configuration
    const testConfig = {
      apiKey: 'test-api-key',
      model: 'gpt-4',
      temperature: 0.1,
      maxTokens: 4000,
      maxRetries: 3
    };
    
    engine = new UltraThinkEngine(testConfig);
    
    // Get mock instance
    const { OpenAI } = require('openai');
    mockOpenAI = new OpenAI();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(engine).toBeInstanceOf(UltraThinkEngine);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        models: ['gpt-4o'],
        temperature: 0.5,
        enableSelfReflection: false
      };
      
      const customEngine = new UltraThinkEngine(customConfig);
      expect(customEngine).toBeInstanceOf(UltraThinkEngine);
    });

    it('should handle missing API key gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      
      const engineWithoutKey = new UltraThinkEngine();
      expect(engineWithoutKey).toBeInstanceOf(UltraThinkEngine);
    });
  });

  describe('analyzeIdea', () => {
    beforeEach(() => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              suggestedType: 'library',
              confidence: 0.8,
              complexityScore: 6,
              suggestedFeatures: ['TypeScript', 'Testing'],
              recommendedStack: ['typescript', 'jest'],
              insights: ['Modern package structure recommended'],
              challenges: ['API design'],
              innovations: ['Advanced type system']
            })
          }
        }]
      });
    });

    it('should analyze package idea successfully', async () => {
      const idea = 'A utility library for data transformation';
      const context = {
        complexity: 'moderate',
        priorities: ['performance', 'type-safety']
      };

      const result = await engine.analyzeIdea(idea, context);

      expect(result).toEqual({
        suggestedType: 'library',
        confidence: 0.8,
        complexityScore: 6,
        suggestedFeatures: ['TypeScript', 'Testing'],
        recommendedStack: ['typescript', 'jest'],
        insights: ['Modern package structure recommended'],
        challenges: ['API design'],
        innovations: ['Advanced type system']
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('expert software architect')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(idea)
          })
        ]),
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await engine.analyzeIdea('test idea', { complexity: 'simple' });

      expect(result.suggestedType).toBe('library');
      expect(result.confidence).toBe(0.6);
      expect(result.complexityScore).toBe(5);
    });

    it('should handle invalid JSON response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }]
      });

      const result = await engine.analyzeIdea('test idea', { complexity: 'simple' });

      expect(result.suggestedType).toBe('library');
    });

    it('should handle empty response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }]
      });

      const result = await engine.analyzeIdea('test idea', { complexity: 'simple' });

      expect(result.suggestedType).toBe('library');
    });
  });

  describe('enhanceDesign', () => {
    beforeEach(() => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              features: ['Advanced caching', 'Plugin system'],
              optimizations: ['Memory optimization', 'Bundle size reduction'],
              patterns: ['Observer pattern', 'Factory pattern'],
              innovations: ['AI-powered auto-completion']
            })
          }
        }]
      });
    });

    it('should enhance design with additional features', async () => {
      const analysis: AnalysisResult = {
        suggestedType: 'library',
        confidence: 0.8,
        complexityScore: 6,
        suggestedFeatures: ['TypeScript'],
        recommendedStack: ['typescript'],
        insights: [],
        challenges: [],
        innovations: []
      };

      const result = await engine.enhanceDesign(analysis);

      expect(result).toEqual({
        ...analysis,
        enhancedFeatures: ['Advanced caching', 'Plugin system'],
        optimizations: ['Memory optimization', 'Bundle size reduction'],
        patterns: ['Observer pattern', 'Factory pattern'],
        innovations: ['AI-powered auto-completion']
      });
    });

    it('should handle enhancement errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Enhancement failed'));

      const analysis: AnalysisResult = {
        suggestedType: 'library',
        confidence: 0.8,
        complexityScore: 6,
        suggestedFeatures: ['TypeScript'],
        recommendedStack: ['typescript'],
        insights: [],
        challenges: [],
        innovations: []
      };

      const result = await engine.enhanceDesign(analysis);

      expect(result).toEqual(analysis);
    });
  });

  describe('generateCreativeSolutions', () => {
    beforeEach(() => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              solutions: [
                {
                  name: 'Reactive Solution',
                  description: 'Event-driven architecture',
                  innovationScore: 8,
                  complexity: 'medium',
                  approach: 'Reactive programming',
                  benefits: ['Real-time updates', 'Scalable'],
                  challenges: ['Learning curve'],
                  implementation: ['Setup streams', 'Add operators']
                }
              ]
            })
          }
        }]
      });
    });

    it('should generate creative solutions', async () => {
      const problem = {
        problem: 'Need real-time data processing',
        inspiration: 'RxJS',
        constraints: ['Low latency', 'High throughput']
      };

      const solutions = await engine.generateCreativeSolutions(problem);

      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual({
        name: 'Reactive Solution',
        description: 'Event-driven architecture',
        innovationScore: 8,
        complexity: 'medium',
        approach: 'Reactive programming',
        benefits: ['Real-time updates', 'Scalable'],
        challenges: ['Learning curve'],
        implementation: ['Setup streams', 'Add operators']
      });
    });

    it('should return fallback solutions on error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Generation failed'));

      const problem = {
        problem: 'Test problem',
        inspiration: 'Test inspiration',
        constraints: ['Test constraint']
      };

      const solutions = await engine.generateCreativeSolutions(problem);

      expect(solutions).toHaveLength(1);
      expect(solutions[0].name).toBe('Modular Architecture');
    });
  });

  describe('collaborationMode', () => {
    beforeEach(() => {
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'GPT-4o perspective on the challenge' } }]
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'O1-preview perspective on the challenge' } }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: 'Synthesized solution combining both perspectives'
            }
          }]
        });
    });

    it('should run multi-model collaboration', async () => {
      const result = await engine.collaborationMode();

      expect(result).toEqual({
        collaborationId: expect.stringMatching(/^collab_\d+$/),
        models: ['gpt-4o', 'o1-preview'],
        results: [
          {
            model: 'gpt-4o',
            perspective: 'GPT-4o perspective on the challenge',
            timestamp: expect.any(String)
          },
          {
            model: 'o1-preview',
            perspective: 'O1-preview perspective on the challenge',
            timestamp: expect.any(String)
          }
        ],
        synthesis: {
          synthesis: 'Synthesized solution combining both perspectives',
          confidence: 0.85,
          novelty: 0.78
        },
        innovationScore: expect.any(Number)
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should handle collaboration errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Collaboration failed'));

      const result = await engine.collaborationMode();

      expect(result).toEqual({
        error: 'Collaboration failed',
        innovationScore: 50
      });
    });
  });

  describe('mode methods', () => {
    it('should return creative mode results', async () => {
      const result = await engine.creativeMode();

      expect(result).toEqual({
        mode: 'creative',
        innovationScore: 85,
        insights: expect.arrayContaining([
          'Generated novel architectural patterns',
          'Identified unconventional use cases',
          'Proposed cutting-edge technologies'
        ]),
        optimizationLevel: 'high'
      });
    });

    it('should return experimental mode results', async () => {
      const result = await engine.experimentalMode();

      expect(result).toEqual({
        mode: 'experimental',
        innovationScore: 92,
        insights: expect.arrayContaining([
          'Explored bleeding-edge features',
          'Tested experimental APIs',
          'Prototyped future patterns'
        ]),
        optimizationLevel: 'extreme'
      });
    });

    it('should return architecture mode results', async () => {
      const result = await engine.architectureMode();

      expect(result).toEqual({
        mode: 'architecture',
        innovationScore: 78,
        insights: expect.arrayContaining([
          'Optimized performance patterns',
          'Enhanced scalability design',
          'Improved maintainability structure'
        ]),
        optimizationLevel: 'optimized'
      });
    });

    it('should return performance mode results', async () => {
      const result = await engine.performanceMode();

      expect(result).toEqual({
        mode: 'performance',
        innovationScore: 88,
        insights: expect.arrayContaining([
          'Eliminated performance bottlenecks',
          'Optimized memory usage',
          'Enhanced execution speed'
        ]),
        optimizationLevel: 'maximum'
      });
    });
  });

  describe('suggestOptimizations', () => {
    beforeEach(() => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              suggestions: [
                'Implement lazy loading',
                'Add caching layer',
                'Optimize algorithms'
              ]
            })
          }
        }]
      });
    });

    it('should suggest optimizations for analysis', async () => {
      const analysis = {
        qualityScore: 75,
        performanceScore: 60,
        dependencies: { total: 20 }
      };

      const result = await engine.suggestOptimizations(analysis);

      expect(result).toEqual({
        performanceGain: expect.any(Number),
        sizeReduction: expect.any(Number),
        suggestions: ['Implement lazy loading', 'Add caching layer', 'Optimize algorithms']
      });

      expect(result.performanceGain).toBeGreaterThanOrEqual(10);
      expect(result.performanceGain).toBeLessThanOrEqual(50);
      expect(result.sizeReduction).toBeGreaterThanOrEqual(5);
      expect(result.sizeReduction).toBeLessThanOrEqual(35);
    });

    it('should return fallback optimizations on error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Optimization failed'));

      const result = await engine.suggestOptimizations({});

      expect(result).toEqual({
        performanceGain: 15,
        sizeReduction: 10,
        suggestions: ['Enable production optimizations', 'Review dependency usage']
      });
    });
  });

  describe('analyzeRequirements', () => {
    beforeEach(() => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              requirements: ['Core API', 'Authentication', 'Testing'],
              architecture: 'microservices',
              stack: ['typescript', 'express', 'jest'],
              challenges: ['Scalability', 'Security'],
              opportunities: ['Cloud deployment', 'AI integration']
            })
          }
        }]
      });
    });

    it('should analyze requirements comprehensively', async () => {
      const config = {
        packageName: 'test-api',
        description: 'REST API service',
        complexity: 'advanced',
        features: ['authentication', 'database']
      };

      const result = await engine.analyzeRequirements(config);

      expect(result).toEqual({
        requirements: ['Core API', 'Authentication', 'Testing'],
        architecture: 'microservices',
        stack: ['typescript', 'express', 'jest'],
        challenges: ['Scalability', 'Security'],
        opportunities: ['Cloud deployment', 'AI integration']
      });
    });

    it('should return fallback requirements on error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Analysis failed'));

      const result = await engine.analyzeRequirements({ packageName: 'test' });

      expect(result).toEqual({
        requirements: ['Core functionality', 'Testing', 'Documentation'],
        architecture: 'modular',
        stack: ['typescript', 'jest'],
        challenges: ['Complexity management'],
        opportunities: ['Performance optimization']
      });
    });
  });

  describe('prompt building', () => {
    it('should build analysis prompt correctly', () => {
      const idea = 'Test package idea';
      const context = { complexity: 'simple', priorities: ['performance'] };

      // Access private method for testing
      const prompt = (engine as any).buildAnalysisPrompt(idea, context);

      expect(prompt).toContain(idea);
      expect(prompt).toContain('simple');
      expect(prompt).toContain('performance');
      expect(prompt).toContain('JSON object');
    });

    it('should build creativity prompt correctly', () => {
      const problem = {
        problem: 'Test problem',
        inspiration: 'Test inspiration',
        constraints: ['constraint1', 'constraint2']
      };

      const prompt = (engine as any).buildCreativityPrompt(problem);

      expect(prompt).toContain('Test problem');
      expect(prompt).toContain('Test inspiration');
      expect(prompt).toContain('constraint1, constraint2');
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

      const result = await engine.analyzeIdea('test', { complexity: 'simple' });

      expect(result.suggestedType).toBe('library');
      expect(result.confidence).toBe(0.6);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

      const result = await engine.analyzeIdea('test', { complexity: 'simple' });

      expect(result.suggestedType).toBe('library');
    });

    it('should handle malformed API responses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: []
      });

      const result = await engine.analyzeIdea('test', { complexity: 'simple' });

      expect(result.suggestedType).toBe('library');
    });
  });

  describe('integration scenarios', () => {
    it('should handle end-to-end workflow', async () => {
      // Mock responses for full workflow
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                suggestedType: 'library',
                confidence: 0.9,
                complexityScore: 7,
                suggestedFeatures: ['TypeScript', 'Testing'],
                recommendedStack: ['typescript', 'jest'],
                insights: ['High-quality architecture'],
                challenges: ['Performance'],
                innovations: ['Modern patterns']
              })
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                features: ['Advanced features'],
                optimizations: ['Performance optimizations'],
                patterns: ['Design patterns'],
                innovations: ['New innovations']
              })
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                pattern: 'microservices',
                performance: 9,
                maintainability: 8,
                scalability: 9,
                recommendations: ['Use containers'],
                tradeoffs: ['Complexity vs scalability']
              })
            }
          }]
        });

      // Run full workflow
      const analysis = await engine.analyzeIdea('Complex API service', {
        complexity: 'advanced',
        priorities: ['scalability', 'performance']
      });

      const enhanced = await engine.enhanceDesign(analysis);
      const architecture = await engine.optimizeArchitecture(enhanced);

      expect(analysis.confidence).toBe(0.9);
      expect(enhanced.enhancedFeatures).toContain('Advanced features');
      expect(architecture.pattern).toBe('microservices');
    });
  });
}); 