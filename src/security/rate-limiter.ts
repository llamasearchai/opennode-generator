/**
 * Rate Limiter for OpenNode Generator
 * ==================================
 * 
 * Implements rate limiting to prevent abuse and DoS attacks
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (req: any, res: any) => void;
  store?: RateLimitStore;
}

export interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory rate limit store
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.count;
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, {
      count: value,
      resetTime: Date.now() + ttl
    });
  }

  async increment(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);
    const now = Date.now();
    
    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + ttl };
      this.store.set(key, newEntry);
      return 1;
    }
    
    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis-based rate limit store
 */
export class RedisRateLimitStore implements RateLimitStore {
  private redis: any;

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<number | null> {
    try {
      const value = await this.redis.get(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Redis rate limit get error:', error);
      return null;
    }
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, Math.ceil(ttl / 1000), value);
    } catch (error) {
      console.error('Redis rate limit set error:', error);
    }
  }

  async increment(key: string, ttl: number): Promise<number> {
    try {
      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(ttl / 1000));
      const results = await multi.exec();
      return results[0][1];
    } catch (error) {
      console.error('Redis rate limit increment error:', error);
      return 1;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis rate limit reset error:', error);
    }
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator,
      onLimitReached: config.onLimitReached ?? this.defaultLimitReachedHandler,
      store: config.store ?? new MemoryRateLimitStore()
    };
    
    this.store = this.config.store;
    
    // Cleanup expired entries every 5 minutes for memory store
    if (this.store instanceof MemoryRateLimitStore) {
      setInterval(() => {
        (this.store as MemoryRateLimitStore).cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(req: any): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator(req);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;
    
    try {
      const currentCount = await this.store.increment(key, this.config.windowMs);
      const remaining = Math.max(0, this.config.maxRequests - currentCount);
      const allowed = currentCount <= this.config.maxRequests;
      
      return {
        allowed,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime
      };
    }
  }

  /**
   * Express middleware for rate limiting
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const result = await this.checkLimit(req);
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });
        
        if (!result.allowed) {
          this.config.onLimitReached(req, res);
          return;
        }
        
        next();
      } catch (error) {
        console.error('Rate limiter middleware error:', error);
        // Fail open - continue if rate limiter fails
        next();
      }
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetKey(req: any): Promise<void> {
    const key = this.config.keyGenerator(req);
    await this.store.reset(key);
  }

  /**
   * Get current rate limit status for a key
   */
  async getStatus(req: any): Promise<{ count: number; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator(req);
    const count = await this.store.get(key) || 0;
    const remaining = Math.max(0, this.config.maxRequests - count);
    const resetTime = Date.now() + this.config.windowMs;
    
    return { count, remaining, resetTime };
  }

  private defaultKeyGenerator(req: any): string {
    // Use IP address as default key
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  private defaultLimitReachedHandler(req: any, res: any): void {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(this.config.windowMs / 1000)
    });
  }
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_PRESETS = {
  // Very strict - for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10
  },
  
  // Standard API rate limit
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  
  // Generous - for public APIs
  GENEROUS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000
  },
  
  // Per-second rate limit for real-time operations
  PER_SECOND: {
    windowMs: 1000, // 1 second
    maxRequests: 10
  },
  
  // Per-minute rate limit
  PER_MINUTE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60
  }
};

/**
 * Create rate limiter with preset configuration
 */
export function createRateLimiter(preset: keyof typeof RATE_LIMIT_PRESETS, overrides?: Partial<RateLimitConfig>): RateLimiter {
  const config = { ...RATE_LIMIT_PRESETS[preset], ...overrides };
  return new RateLimiter(config);
}

/**
 * Advanced rate limiter with multiple tiers
 */
export class TieredRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();

  constructor(private tiers: Record<string, RateLimitConfig>) {
    for (const [tier, config] of Object.entries(tiers)) {
      this.limiters.set(tier, new RateLimiter(config));
    }
  }

  /**
   * Check rate limit for a specific tier
   */
  async checkTier(tier: string, req: any): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Unknown rate limit tier: ${tier}`);
    }
    
    return limiter.checkLimit(req);
  }

  /**
   * Get middleware for a specific tier
   */
  middleware(tier: string) {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Unknown rate limit tier: ${tier}`);
    }
    
    return limiter.middleware();
  }

  /**
   * Check all tiers and return the most restrictive result
   */
  async checkAllTiers(req: any): Promise<{ allowed: boolean; remaining: number; resetTime: number; tier: string }> {
    let mostRestrictive = {
      allowed: true,
      remaining: Infinity,
      resetTime: Date.now(),
      tier: 'none'
    };

    for (const [tier, limiter] of this.limiters.entries()) {
      const result = await limiter.checkLimit(req);
      
      if (!result.allowed || result.remaining < mostRestrictive.remaining) {
        mostRestrictive = {
          ...result,
          tier
        };
      }
    }

    return mostRestrictive;
  }
}

export default RateLimiter; 