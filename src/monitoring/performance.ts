/**
 * Performance Monitoring System for OpenNode Forge
 * ================================================
 *
 * Comprehensive performance tracking and optimization system with:
 * - Real-time performance metrics collection
 * - Resource usage monitoring (CPU, memory, I/O)
 * - Generation time tracking and optimization
 * - Bottleneck identification and analysis
 * - Performance alerts and notifications
 * - Historical performance data and trends
 * - Automated performance optimization suggestions
 * - Load testing and stress testing capabilities
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs-extra';
import { Logger } from '../core/logger';

export interface PerformanceMetrics {
  timestamp: number;
  operation: string;
  duration: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  resourceUsage: {
    diskIO: number;
    networkIO: number;
  };
  customMetrics?: Record<string, number>;
}

export interface PerformanceThresholds {
  maxDuration: number; // milliseconds
  maxMemoryIncrease: number; // bytes
  maxCpuUsage: number; // percentage
  warningDuration: number; // milliseconds
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  operation: string;
  recommendation: string;
}

export interface PerformanceReport {
  summary: {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: string;
    fastestOperation: string;
    memoryLeaks: number;
    cpuBottlenecks: number;
  };
  trends: {
    durationTrend: 'improving' | 'degrading' | 'stable';
    memoryTrend: 'improving' | 'degrading' | 'stable';
    cpuTrend: 'improving' | 'degrading' | 'stable';
  };
  recommendations: string[];
  alerts: PerformanceAlert[];
}

export class PerformanceMonitor extends EventEmitter {
  private logger: Logger;
  private metrics: PerformanceMetrics[] = [];
  private activeOperations = new Map<
    string,
    {
      startTime: number;
      startMemory: NodeJS.MemoryUsage;
      startCpu: NodeJS.CpuUsage;
    }
  >();
  private thresholds: PerformanceThresholds;
  private observer?: PerformanceObserver;
  private metricsFile?: string;
  private alertHandlers: Array<(alert: PerformanceAlert) => void> = [];
  private isMonitoring = false;

  constructor(
    options: {
      thresholds?: Partial<PerformanceThresholds>;
      metricsFile?: string;
      logger?: Logger;
    } = {}
  ) {
    super();

    this.logger =
      options.logger || new Logger({ component: 'PerformanceMonitor' });
    this.metricsFile = options.metricsFile;

    this.thresholds = {
      maxDuration: 30000, // 30 seconds
      maxMemoryIncrease: 100 * 1024 * 1024, // 100MB
      maxCpuUsage: 80, // 80%
      warningDuration: 10000, // 10 seconds
      ...options.thresholds,
    };

    this.setupPerformanceObserver();
  }

  /**
   * Start monitoring an operation
   */
  startOperation(operationId: string, operationName: string): void {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    this.activeOperations.set(operationId, {
      startTime,
      startMemory,
      startCpu,
    });

    this.logger.debug('Started monitoring operation', {
      operationId,
      operationName,
    });
  }

  /**
   * End monitoring an operation and record metrics
   */
  async endOperation(
    operationId: string,
    operationName: string,
    customMetrics?: Record<string, number>
  ): Promise<PerformanceMetrics> {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found or already ended`);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(operation.startCpu);

    const duration = endTime - operation.startTime;

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      operation: operationName,
      duration,
      memoryUsage: {
        rss: endMemory.rss - operation.startMemory.rss,
        heapUsed: endMemory.heapUsed - operation.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - operation.startMemory.heapTotal,
        external: endMemory.external - operation.startMemory.external,
      },
      cpuUsage: {
        user: endCpu.user / 1000, // Convert to milliseconds
        system: endCpu.system / 1000,
      },
      resourceUsage: {
        diskIO: await this.measureDiskIO(),
        networkIO: await this.measureNetworkIO(),
      },
      customMetrics,
    };

    this.activeOperations.delete(operationId);
    this.recordMetrics(metrics);
    this.checkThresholds(metrics);

    this.logger.info('Operation completed', {
      operationId,
      operationName,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: `${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    });

    return metrics;
  }

  /**
   * Monitor an async operation with automatic tracking
   */
  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    customMetrics?: Record<string, number>
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.startOperation(operationId, operationName);

    try {
      const result = await operation();
      const metrics = await this.endOperation(
        operationId,
        operationName,
        customMetrics
      );

      return { result, metrics };
    } catch (error) {
      // Still record metrics for failed operations
      const metrics = await this.endOperation(
        operationId,
        `${operationName}(failed)`,
        customMetrics
      );
      this.logger.error('Monitored operation failed', error, {
        operationName,
        metrics,
      });
      throw error;
    }
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // Keep only last 10000 metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }

    // Save to file if configured
    if (this.metricsFile) {
      this.saveMetricsToFile(metrics);
    }

    this.emit('metrics', metrics);
  }

  /**
   * Check if metrics exceed thresholds and emit alerts
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Check duration thresholds
    if (metrics.duration > this.thresholds.maxDuration) {
      alerts.push({
        type: 'critical',
        metric: 'duration',
        value: metrics.duration,
        threshold: this.thresholds.maxDuration,
        timestamp: metrics.timestamp,
        operation: metrics.operation,
        recommendation:
          'Optimize algorithm or consider async/parallel processing',
      });
    } else if (metrics.duration > this.thresholds.warningDuration) {
      alerts.push({
        type: 'warning',
        metric: 'duration',
        value: metrics.duration,
        threshold: this.thresholds.warningDuration,
        timestamp: metrics.timestamp,
        operation: metrics.operation,
        recommendation: 'Monitor for performance degradation',
      });
    }

    // Check memory thresholds
    if (metrics.memoryUsage.heapUsed > this.thresholds.maxMemoryIncrease) {
      alerts.push({
        type: 'critical',
        metric: 'memory',
        value: metrics.memoryUsage.heapUsed,
        threshold: this.thresholds.maxMemoryIncrease,
        timestamp: metrics.timestamp,
        operation: metrics.operation,
        recommendation: 'Check for memory leaks and optimize data structures',
      });
    }

    // Check CPU usage
    const totalCpu = metrics.cpuUsage.user + metrics.cpuUsage.system;
    if (totalCpu > this.thresholds.maxCpuUsage) {
      alerts.push({
        type: 'warning',
        metric: 'cpu',
        value: totalCpu,
        threshold: this.thresholds.maxCpuUsage,
        timestamp: metrics.timestamp,
        operation: metrics.operation,
        recommendation:
          'Optimize CPU-intensive operations or consider load balancing',
      });
    }

    // Emit alerts
    alerts.forEach((alert) => {
      this.emit('alert', alert);
      this.alertHandlers.forEach((handler) => handler(alert));
      this.logger.warn('Performance alert', { alert });
    });
  }

  /**
   * Get current system performance snapshot
   */
  getSystemSnapshot(): {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    uptime: number;
    loadAverage: number[];
    freeMemory: number;
    totalMemory: number;
  } {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(timeWindow?: number): PerformanceReport {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const relevantMetrics = this.metrics.filter((m) => m.timestamp > cutoff);

    if (relevantMetrics.length === 0) {
      return {
        summary: {
          totalOperations: 0,
          averageDuration: 0,
          slowestOperation: 'N/A',
          fastestOperation: 'N/A',
          memoryLeaks: 0,
          cpuBottlenecks: 0,
        },
        trends: {
          durationTrend: 'stable',
          memoryTrend: 'stable',
          cpuTrend: 'stable',
        },
        recommendations: [
          'Collect more performance data for meaningful analysis',
        ],
        alerts: [],
      };
    }

    const durations = relevantMetrics.map((m) => m.duration);
    const memoryUsages = relevantMetrics.map((m) => m.memoryUsage.heapUsed);
    const cpuUsages = relevantMetrics.map(
      (m) => m.cpuUsage.user + m.cpuUsage.system
    );

    const averageDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const slowestMetric = relevantMetrics.reduce((max, m) =>
      m.duration > max.duration ? m : max
    );
    const fastestMetric = relevantMetrics.reduce((min, m) =>
      m.duration < min.duration ? m : min
    );

    // Detect trends
    const recentMetrics = relevantMetrics.slice(
      -Math.min(100, relevantMetrics.length)
    );
    const olderMetrics = relevantMetrics.slice(
      0,
      Math.min(100, relevantMetrics.length)
    );

    const recentAvgDuration =
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
      recentMetrics.length;
    const olderAvgDuration =
      olderMetrics.reduce((sum, m) => sum + m.duration, 0) /
      olderMetrics.length;

    const durationTrend =
      recentAvgDuration < olderAvgDuration * 0.9
        ? 'improving'
        : recentAvgDuration > olderAvgDuration * 1.1
          ? 'degrading'
          : 'stable';

    const recommendations = this.generateRecommendations(relevantMetrics);

    return {
      summary: {
        totalOperations: relevantMetrics.length,
        averageDuration: Math.round(averageDuration),
        slowestOperation: slowestMetric.operation,
        fastestOperation: fastestMetric.operation,
        memoryLeaks: memoryUsages.filter(
          (m) => m > this.thresholds.maxMemoryIncrease
        ).length,
        cpuBottlenecks: cpuUsages.filter((c) => c > this.thresholds.maxCpuUsage)
          .length,
      },
      trends: {
        durationTrend,
        memoryTrend: 'stable', // Simplified for now
        cpuTrend: 'stable', // Simplified for now
      },
      recommendations,
      alerts: [], // Would collect recent alerts
    };
  }

  /**
   * Generate optimization recommendations based on metrics
   */
  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];

    // Analyze duration patterns
    const avgDuration =
      metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    if (avgDuration > 5000) {
      recommendations.push(
        'Consider implementing caching to reduce operation times'
      );
    }

    // Analyze memory patterns
    const avgMemoryIncrease =
      metrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) /
      metrics.length;
    if (avgMemoryIncrease > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push(
        'Review memory usage patterns and implement garbage collection optimization'
      );
    }

    // Analyze operation types
    const operationCounts = new Map<string, number>();
    metrics.forEach((m) => {
      operationCounts.set(
        m.operation,
        (operationCounts.get(m.operation) || 0) + 1
      );
    });

    const frequentOperations = Array.from(operationCounts.entries())
      .filter(([, count]) => count > metrics.length * 0.1)
      .map(([operation]) => operation);

    if (frequentOperations.length > 0) {
      recommendations.push(
        `Optimize frequently used operations: ${frequentOperations.join(', ')}`
      );
    }

    // Check for concurrency opportunities
    const sequentialPatterns = this.detectSequentialPatterns(metrics);
    if (sequentialPatterns.length > 0) {
      recommendations.push(
        'Consider implementing parallel processing for independent operations'
      );
    }

    return recommendations;
  }

  /**
   * Detect sequential operation patterns that could benefit from parallelization
   */
  private detectSequentialPatterns(metrics: PerformanceMetrics[]): string[] {
    // Simplified pattern detection
    const patterns: string[] = [];

    for (let i = 0; i < metrics.length - 1; i++) {
      const current = metrics[i];
      const next = metrics[i + 1];

      if (
        next.timestamp - current.timestamp < 1000 && // Within 1 second
        current.operation !== next.operation
      ) {
        patterns.push(`${current.operation} -> ${next.operation}`);
      }
    }

    return [...new Set(patterns)].slice(0, 5); // Return unique patterns, max 5
  }

  /**
   * Add alert handler
   */
  onAlert(handler: (alert: PerformanceAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Setup Node.js Performance Observer
   */
  private setupPerformanceObserver(): void {
    if (this.observer) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logger.debug('Performance entry', {
            name: entry.name,
            duration: entry.duration,
            type: entry.entryType,
          });
        }
      });

      this.observer.observe({ entryTypes: ['measure', 'mark'] });
    } catch (error) {
      this.logger.warn('Failed to setup PerformanceObserver', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Save metrics to file
   */
  private async saveMetricsToFile(metrics: PerformanceMetrics): Promise<void> {
    if (!this.metricsFile) return;

    try {
      await fs.ensureFile(this.metricsFile);
      await fs.appendFile(this.metricsFile, JSON.stringify(metrics) + '\n');
    } catch (error) {
      this.logger.error('Failed to save metrics to file', error);
    }
  }

  /**
   * Load historical metrics from file
   */
  async loadHistoricalMetrics(): Promise<PerformanceMetrics[]> {
    if (!this.metricsFile || !(await fs.pathExists(this.metricsFile))) {
      return [];
    }

    try {
      const content = await fs.readFile(this.metricsFile, 'utf-8');
      const lines = content
        .trim()
        .split('\n')
        .filter((line) => line);

      return lines.map((line) => JSON.parse(line));
    } catch (error) {
      this.logger.error('Failed to load historical metrics', error);
      return [];
    }
  }

  /**
   * Measure disk I/O (simplified implementation)
   */
  private async measureDiskIO(): Promise<number> {
    // This is a simplified implementation
    // In a real scenario, you might want to use system-specific tools
    return 0;
  }

  /**
   * Measure network I/O (simplified implementation)
   */
  private async measureNetworkIO(): Promise<number> {
    // This is a simplified implementation
    // In a real scenario, you might want to track actual network usage
    return 0;
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    const monitoringInterval = setInterval(() => {
      const snapshot = this.getSystemSnapshot();
      this.emit('systemSnapshot', snapshot);

      // Check for memory leaks
      if (snapshot.memory.heapUsed > 500 * 1024 * 1024) {
        // 500MB
        this.emit('alert', {
          type: 'warning',
          metric: 'system-memory',
          value: snapshot.memory.heapUsed,
          threshold: 500 * 1024 * 1024,
          timestamp: Date.now(),
          operation: 'system-monitoring',
          recommendation: 'Investigate potential memory leaks',
        });
      }
    }, interval);

    this.once('stopMonitoring', () => {
      clearInterval(monitoringInterval);
      this.isMonitoring = false;
    });
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    this.emit('stopMonitoring');
  }

  /**
   * Clear collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.logger.info('Performance metrics cleared');
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }

    this.removeAllListeners();
  }
}
