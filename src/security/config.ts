/**
 * Security Configuration for OpenNode Generator
 * ============================================
 * 
 * Centralized security settings and constants
 */

export interface SecurityConfig {
  // Input validation
  maxInputLength: number;
  maxPackageNameLength: number;
  maxDescriptionLength: number;
  
  // File system security
  allowedFileExtensions: string[];
  blockedPaths: string[];
  maxFileSize: number;
  
  // Network security
  allowedProtocols: string[];
  trustedDomains: string[];
  requestTimeout: number;
  
  // API security
  rateLimitWindow: number;
  rateLimitMax: number;
  apiKeyMinLength: number;
  
  // Content security
  dangerousPatterns: RegExp[];
  sensitiveKeys: string[];
  
  // Logging
  enableSecurityLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  // Input validation
  maxInputLength: 200,
  maxPackageNameLength: 100,
  maxDescriptionLength: 1000,
  
  // File system security
  allowedFileExtensions: [
    '.ts', '.js', '.json', '.md', '.txt', '.yml', '.yaml',
    '.dockerfile', '.gitignore', '.npmignore', '.py'
  ],
  blockedPaths: [
    '../', '..\\', '/etc/', '/var/', '/usr/', '/root/',
    'C:\\Windows\\', 'C:\\Program Files\\', '/System/'
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // Network security
  allowedProtocols: ['http:', 'https:'],
  trustedDomains: [
    'api.openai.com',
    'registry.npmjs.org',
    'github.com',
    'api.github.com'
  ],
  requestTimeout: 30000, // 30 seconds
  
  // API security
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // requests per window
  apiKeyMinLength: 20,
  
  // Content security
  dangerousPatterns: [
    /\.\.\//, // Path traversal
    /<script/i, // XSS
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data protocol
    /eval\(/i, // Code injection
    /exec\(/i, // Command injection
    /system\(/i, // System calls
    /require\(['"]child_process['"]\)/i, // Node.js child process
    /fs\.unlink/i, // File deletion
    /fs\.rmdir/i, // Directory deletion
    /process\.exit/i, // Process termination
    /\$\{.*\}/g, // Template literal injection
    /\$\(.*\)/g, // Command substitution
    /`.*`/g, // Backtick execution
  ],
  sensitiveKeys: [
    'apiKey', 'api_key', 'password', 'secret', 'token', 'key',
    'auth', 'authorization', 'credential', 'private', 'confidential'
  ],
  
  // Logging
  enableSecurityLogging: true,
  logLevel: 'info'
};

/**
 * Security validation utilities
 */
export class SecurityValidator {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Validate input string for security threats
   */
  validateInput(input: string, maxLength?: number): void {
    const limit = maxLength || this.config.maxInputLength;
    
    if (!input || typeof input !== 'string') {
      throw new Error('SECURITY: Invalid input type');
    }

    if (input.length > limit) {
      throw new Error(`SECURITY: Input too long (max ${limit} characters)`);
    }

    // Check for dangerous patterns
    for (const pattern of this.config.dangerousPatterns) {
      if (pattern.test(input)) {
        throw new Error('SECURITY: Dangerous pattern detected in input');
      }
    }
  }

  /**
   * Validate file path for security
   */
  validatePath(filePath: string): void {
    // Check for blocked paths
    for (const blockedPath of this.config.blockedPaths) {
      if (filePath.includes(blockedPath)) {
        throw new Error(`SECURITY: Blocked path detected: ${blockedPath}`);
      }
    }

    // Normalize and check for path traversal
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('../') || normalized.includes('..\\')) {
      throw new Error('SECURITY: Path traversal detected');
    }
  }

  /**
   * Validate URL for security
   */
  validateUrl(url: string): void {
    try {
      const parsed = new URL(url);
      
      if (!this.config.allowedProtocols.includes(parsed.protocol)) {
        throw new Error(`SECURITY: Invalid protocol: ${parsed.protocol}`);
      }

      // Check if domain is in trusted list (optional)
      if (this.config.trustedDomains.length > 0) {
        const istrusted = this.config.trustedDomains.some(domain => 
          parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        );
        
        if (!istrusted) {
          console.warn(`SECURITY WARNING: Untrusted domain: ${parsed.hostname}`);
        }
      }
    } catch (error) {
      throw new Error(`SECURITY: Invalid URL: ${url}`);
    }
  }

  /**
   * Sanitize string by removing dangerous characters
   */
  sanitizeString(input: string): string {
    return input
      .replace(/[<>'"&;`${}()|\\]/g, '') // Remove script injection characters
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }

  /**
   * Sanitize file path
   */
  sanitizePath(inputPath: string): string {
    return inputPath
      .replace(/\.\./g, '') // Remove .. patterns
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/\\/g, '/') // Normalize path separators
      .replace(/\/+/g, '/'); // Remove duplicate slashes
  }

  /**
   * Sanitize log data by removing sensitive information
   */
  sanitizeLogData(data: any): any {
    const sanitized = { ...data };
    
    for (const key of this.config.sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Check if file extension is allowed
   */
  isAllowedFileExtension(filename: string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return this.config.allowedFileExtensions.includes(ext);
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): void {
    if (!apiKey || apiKey.length < this.config.apiKeyMinLength) {
      throw new Error('SECURITY: Invalid API key format');
    }

    if (apiKey.includes('your_api') || apiKey === 'test-key') {
      throw new Error('SECURITY: Placeholder API key detected');
    }
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update security configuration
   */
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

/**
 * Security audit logger
 */
export class SecurityAuditLogger {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Log security event
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', event: string, data: any = {}): void {
    if (!this.config.enableSecurityLogging) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      data: new SecurityValidator(this.config).sanitizeLogData(data),
      pid: process.pid,
      nodeVersion: process.version,
    };

    // In production, this would go to a secure logging service
    console.log(`SECURITY [${level.toUpperCase()}]:`, JSON.stringify(logEntry));
  }

  /**
   * Log security warning
   */
  warn(event: string, data: any = {}): void {
    this.log('warn', event, data);
  }

  /**
   * Log security error
   */
  error(event: string, data: any = {}): void {
    this.log('error', event, data);
  }

  /**
   * Log security info
   */
  info(event: string, data: any = {}): void {
    this.log('info', event, data);
  }
}

export default SecurityValidator; 