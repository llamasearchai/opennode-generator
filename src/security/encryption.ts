/**
 * Encryption and Hashing Utilities for OpenNode Generator
 * =======================================================
 * 
 * Provides secure encryption, hashing, and key management
 */

import * as crypto from 'crypto';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  iterations: number;
  hashAlgorithm: string;
}

export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
  iterations: 100000, // PBKDF2 iterations
  hashAlgorithm: 'sha256'
};

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt?: string;
}

/**
 * Encryption utility class
 */
export class EncryptionManager {
  private config: EncryptionConfig;

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = { ...DEFAULT_ENCRYPTION_CONFIG, ...config };
  }

  /**
   * Generate a cryptographically secure random key
   */
  generateKey(): string {
    return crypto.randomBytes(this.config.keyLength).toString('hex');
  }

  /**
   * Generate a cryptographically secure random salt
   */
  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Derive key from password using PBKDF2
   */
  deriveKey(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.config.iterations,
      this.config.keyLength,
      this.config.hashAlgorithm
    );
  }

  /**
   * Encrypt data using AES-256-CBC (simplified for compatibility)
   */
  encrypt(data: string, key: string | Buffer): EncryptedData {
    try {
      const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
      const iv = crypto.randomBytes(this.config.ivLength);
      
      const cipher = crypto.createCipher('aes-256-cbc', keyBuffer);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Create authentication tag using HMAC
      const tag = crypto.createHmac('sha256', keyBuffer)
        .update(encrypted + iv.toString('hex'))
        .digest('hex')
        .substring(0, 32);
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt data using AES-256-CBC (simplified for compatibility)
   */
  decrypt(encryptedData: EncryptedData, key: string | Buffer): string {
    try {
      const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
      
      // Verify authentication tag
      const expectedTag = crypto.createHmac('sha256', keyBuffer)
        .update(encryptedData.encrypted + encryptedData.iv)
        .digest('hex')
        .substring(0, 32);
        
      if (expectedTag !== encryptedData.tag) {
        throw new Error('Authentication tag verification failed');
      }
      
      const decipher = crypto.createDecipher('aes-256-cbc', keyBuffer);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encrypt data with password (includes salt generation)
   */
  encryptWithPassword(data: string, password: string): EncryptedData & { salt: string } {
    const salt = this.generateSalt();
    const key = this.deriveKey(password, salt);
    const encrypted = this.encrypt(data, key);
    
    return {
      ...encrypted,
      salt
    };
  }

  /**
   * Decrypt data with password
   */
  decryptWithPassword(encryptedData: EncryptedData & { salt: string }, password: string): string {
    const key = this.deriveKey(password, encryptedData.salt);
    return this.decrypt(encryptedData, key);
  }

  /**
   * Hash data using SHA-256
   */
  hash(data: string): string {
    return crypto.createHash(this.config.hashAlgorithm).update(data).digest('hex');
  }

  /**
   * Hash data with salt
   */
  hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
    const saltToUse = salt || this.generateSalt();
    const hash = crypto.createHash(this.config.hashAlgorithm)
      .update(data + saltToUse)
      .digest('hex');
    
    return { hash, salt: saltToUse };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const computed = this.hashWithSalt(data, salt);
    return computed.hash === hash;
  }

  /**
   * Generate HMAC
   */
  generateHMAC(data: string, secret: string): string {
    return crypto.createHmac(this.config.hashAlgorithm, secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, hmac: string, secret: string): boolean {
    const computed = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  generateUUID(): string {
    return crypto.randomUUID();
  }
}

/**
 * Password hashing utility using bcrypt-like approach
 */
export class PasswordManager {
  private rounds: number;

  constructor(rounds: number = 12) {
    this.rounds = rounds;
  }

  /**
   * Hash password with automatic salt generation
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, Math.pow(2, this.rounds), 64, 'sha256');
    return `${this.rounds}$${salt}$${hash.toString('hex')}`;
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const [rounds, salt, storedHash] = hash.split('$');
      const computedHash = crypto.pbkdf2Sync(
        password,
        salt,
        Math.pow(2, parseInt(rounds)),
        64,
        'sha256'
      );
      
      return crypto.timingSafeEqual(
        Buffer.from(storedHash, 'hex'),
        computedHash
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if password meets security requirements
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * API key management utility
 */
export class APIKeyManager {
  private encryption: EncryptionManager;
  private prefix: string;

  constructor(prefix: string = 'onk', encryptionConfig?: Partial<EncryptionConfig>) {
    this.encryption = new EncryptionManager(encryptionConfig);
    this.prefix = prefix;
  }

  /**
   * Generate new API key
   */
  generateAPIKey(): string {
    const timestamp = Date.now().toString(36);
    const random = this.encryption.generateToken(16);
    const checksum = this.encryption.hash(`${timestamp}${random}`).substring(0, 8);
    
    return `${this.prefix}_${timestamp}_${random}_${checksum}`;
  }

  /**
   * Validate API key format
   */
  validateAPIKey(apiKey: string): boolean {
    try {
      const parts = apiKey.split('_');
      if (parts.length !== 4 || parts[0] !== this.prefix) {
        return false;
      }
      
      const [, timestamp, random, checksum] = parts;
      const expectedChecksum = this.encryption.hash(`${timestamp}${random}`).substring(0, 8);
      
      return checksum === expectedChecksum;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract metadata from API key
   */
  getAPIKeyMetadata(apiKey: string): { timestamp: number; valid: boolean } {
    try {
      if (!this.validateAPIKey(apiKey)) {
        return { timestamp: 0, valid: false };
      }
      
      const parts = apiKey.split('_');
      const timestamp = parseInt(parts[1], 36);
      
      return { timestamp, valid: true };
    } catch (error) {
      return { timestamp: 0, valid: false };
    }
  }

  /**
   * Hash API key for storage
   */
  hashAPIKey(apiKey: string): string {
    return this.encryption.hash(apiKey);
  }
}

/**
 * Secure session management
 */
export class SessionManager {
  private encryption: EncryptionManager;
  private sessionTimeout: number;

  constructor(sessionTimeout: number = 24 * 60 * 60 * 1000) { // 24 hours
    this.encryption = new EncryptionManager();
    this.sessionTimeout = sessionTimeout;
  }

  /**
   * Create new session
   */
  createSession(userId: string, metadata: any = {}): string {
    const sessionData = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      metadata
    };
    
    const sessionToken = this.encryption.generateToken(32);
    const encryptedData = this.encryption.encryptWithPassword(
      JSON.stringify(sessionData),
      sessionToken
    );
    
    return Buffer.from(JSON.stringify({
      token: sessionToken,
      data: encryptedData
    })).toString('base64');
  }

  /**
   * Validate and decode session
   */
  validateSession(sessionString: string): { valid: boolean; userId?: string; metadata?: any } {
    try {
      const session = JSON.parse(Buffer.from(sessionString, 'base64').toString());
      const decryptedData = this.encryption.decryptWithPassword(session.data, session.token);
      const sessionData = JSON.parse(decryptedData);
      
      if (Date.now() > sessionData.expiresAt) {
        return { valid: false };
      }
      
      return {
        valid: true,
        userId: sessionData.userId,
        metadata: sessionData.metadata
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Refresh session expiration
   */
  refreshSession(sessionString: string): string | null {
    const validation = this.validateSession(sessionString);
    if (!validation.valid || !validation.userId) {
      return null;
    }
    
    return this.createSession(validation.userId, validation.metadata);
  }
}

/**
 * Utility functions for common security operations
 */
export const SecurityUtils = {
  /**
   * Generate secure random string
   */
  randomString(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    const bytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += charset[bytes[i] % charset.length];
    }
    
    return result;
  },

  /**
   * Constant-time string comparison
   */
  safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  },

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - visibleChars * 2);
    
    return `${start}${middle}${end}`;
  },

  /**
   * Generate cryptographic nonce
   */
  generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Create secure hash of object
   */
  hashObject(obj: any): string {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(sortedObj))
      .digest('hex');
  }
};

export default EncryptionManager; 