/**
 * Enhanced Logger utility for OpenNode
 * ====================================
 *
 * Provides advanced structured logging with performance optimization,
 * security features, and comprehensive monitoring capabilities.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { performance } from 'perf_hooks';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
  requestId?: string;
  userId?: string;
  component?: string;
  executionTime?: number;
  metadata?: Record<string, any>;
}

export interface LoggerOptions {
  level?: LogLevel;
  file?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableRotation?: boolean;
  enableConsole?: boolean;
  enablePerformanceTracking?: boolean;
  sanitizeSensitiveData?: boolean;
  component?: string;
}

export class Logger {
  private logLevel: LogLevel;
  private logToFile: boolean;
  private logFile?: string;
  private maxFileSize: number;
  private maxFiles: number;
  private enableRotation: boolean;
  private enableConsole: boolean;
  private enablePerformanceTracking: boolean;
  private sanitizeSensitiveData: boolean;
  private component?: string;
  private logBuffer: LogEntry[] = [];
  private bufferFlushInterval?: NodeJS.Timeout;
  private readonly sensitiveKeys = new Set([
    'password',
    'token',
    'apiKey',
    'secret',
    'key',
    'authorization',
    'jwt',
    'bearer',
    'cookie',
    'session',
    'credentials',
  ]);

  constructor(options: LoggerOptions = {}) {
    this.logLevel = options.level ?? LogLevel.INFO;
    this.logToFile = !!options.file;
    this.logFile = options.file;
    this.maxFileSize = options.maxFileSize ?? 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles ?? 5;
    this.enableRotation = options.enableRotation ?? true;
    this.enableConsole = options.enableConsole ?? true;
    this.enablePerformanceTracking = options.enablePerformanceTracking ?? true;
    this.sanitizeSensitiveData = options.sanitizeSensitiveData ?? true;
    this.component = options.component;

    // Start buffer flush interval for better performance
    this.bufferFlushInterval = setInterval(() => {
      this.flushBuffer();
    }, 1000);

    // Ensure log directory exists
    if (this.logFile) {
      this.ensureLogDirectory();
    }
  }

  debug(message: string, data?: any, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data, undefined, metadata);
  }

  info(message: string, data?: any, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data, undefined, metadata);
  }

  warn(message: string, data?: any, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data, undefined, metadata);
  }

  error(message: string, error?: any, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, undefined, error, metadata);
  }

  fatal(message: string, error?: any, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, undefined, error, metadata);
  }

  /**
   * Performance tracking wrapper
   */
  async performance<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enablePerformanceTracking) {
      return fn();
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const executionTime = endTime - startTime;

      this.info(
        `Performance: ${operation}`,
        {
          executionTime: `${executionTime.toFixed(2)}ms`,
          memoryDelta: {
            heapUsed:
              (
                (endMemory.heapUsed - startMemory.heapUsed) /
                1024 /
                1024
              ).toFixed(2) + 'MB',
            external:
              (
                (endMemory.external - startMemory.external) /
                1024 /
                1024
              ).toFixed(2) + 'MB',
          },
        },
        { ...metadata, performance: true }
      );

      return result;
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      this.error(`Performance: ${operation} failed`, error, {
        ...metadata,
        executionTime: `${executionTime.toFixed(2)}ms`,
        performance: true,
      });

      throw error;
    }
  }

  /**
   * Structured logging with context
   */
  logWithContext(
    level: LogLevel,
    message: string,
    context: {
      requestId?: string;
      userId?: string;
      component?: string;
      data?: any;
      error?: any;
      metadata?: Record<string, any>;
    }
  ): void {
    this.log(level, message, context.data, context.error, {
      ...context.metadata,
      requestId: context.requestId,
      userId: context.userId,
      component: context.component || this.component,
    });
  }

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    error?: any,
    metadata?: Record<string, any>
  ): void {
    if (level < this.logLevel) {
      return;
    }

    // Sanitize sensitive data
    const sanitizedData = this.sanitizeSensitiveData
      ? this.sanitizeData(data)
      : data;
    const sanitizedMetadata = this.sanitizeSensitiveData
      ? this.sanitizeData(metadata)
      : metadata;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: sanitizedData,
      error:
        error instanceof Error
          ? error
          : error
            ? new Error(String(error))
            : undefined,
      component: this.component,
      metadata: sanitizedMetadata,
    };

    // Add to buffer for batch processing
    this.logBuffer.push(entry);

    // Immediate output for high-priority logs
    if (level >= LogLevel.ERROR) {
      this.flushBuffer();
    }

    // Console output if enabled
    if (this.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (
        this.sensitiveKeys.has(lowerKey) ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const component = entry.component ? `[${entry.component}]` : '';
    const message = entry.message;

    const logMessage = `[${timestamp}] ${levelName}${component}: ${message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, entry.error || entry.data || '');
        break;
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.logToFile || !this.logFile) {
      return;
    }

    const entriesToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.writeToFile(entriesToFlush);
    } catch (error) {
      console.error('Failed to write logs to file:', error);
      // Re-add entries to buffer for retry
      this.logBuffer.unshift(...entriesToFlush);
    }
  }

  private async writeToFile(entries: LogEntry[]): Promise<void> {
    if (!this.logFile) return;

    try {
      // Check if rotation is needed
      if (this.enableRotation && (await this.shouldRotateLog())) {
        await this.rotateLog();
      }

      const logLines = entries
        .map((entry) => JSON.stringify(entry) + '\n')
        .join('');
      await fs.appendFile(this.logFile, logLines);
    } catch (error) {
      console.error('Failed to write to log file:', error);
      throw error;
    }
  }

  private async shouldRotateLog(): Promise<boolean> {
    if (!this.logFile || !(await fs.pathExists(this.logFile))) {
      return false;
    }

    const stats = await fs.stat(this.logFile);
    return stats.size >= this.maxFileSize;
  }

  private async rotateLog(): Promise<void> {
    if (!this.logFile) return;

    const logDir = path.dirname(this.logFile);
    const logName = path.basename(this.logFile, path.extname(this.logFile));
    const logExt = path.extname(this.logFile);

    // Rotate existing logs
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = path.join(logDir, `${logName}.${i}${logExt}`);
      const newFile = path.join(logDir, `${logName}.${i + 1}${logExt}`);

      if (await fs.pathExists(oldFile)) {
        if (i === this.maxFiles - 1) {
          await fs.remove(newFile); // Remove oldest log
        }
        await fs.move(oldFile, newFile);
      }
    }

    // Move current log to .1
    const firstRotated = path.join(logDir, `${logName}.1${logExt}`);
    if (await fs.pathExists(this.logFile)) {
      await fs.move(this.logFile, firstRotated);
    }
  }

  private async ensureLogDirectory(): Promise<void> {
    if (!this.logFile) return;

    const logDir = path.dirname(this.logFile);
    await fs.ensureDir(logDir);
  }

  /**
   * Create child logger with additional context
   */
  child(component: string, metadata?: Record<string, any>): Logger {
    const childLogger = new Logger({
      level: this.logLevel,
      file: this.logFile,
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles,
      enableRotation: this.enableRotation,
      enableConsole: this.enableConsole,
      enablePerformanceTracking: this.enablePerformanceTracking,
      sanitizeSensitiveData: this.sanitizeSensitiveData,
      component: this.component ? `${this.component}:${component}` : component,
    });

    return childLogger;
  }

  /**
   * Get logger metrics
   */
  getMetrics(): {
    level: LogLevel;
    bufferSize: number;
    component?: string;
    logFile?: string;
  } {
    return {
      level: this.logLevel,
      bufferSize: this.logBuffer.length,
      component: this.component,
      logFile: this.logFile,
    };
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Flush remaining buffer
    await this.flushBuffer();
  }
}
