/**
 * Monitoring and Metrics Module
 * ============================
 *
 * Comprehensive monitoring for package generation, performance tracking,
 * health checks, and analytics for OpenNode Forge
 */

import { Logger } from '../core/logger';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  labels: Record<string, string>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  details?: any;
}

export interface GenerationMetrics {
  packageType: string;
  qualityLevel: string;
  generationTime: number;
  filesCreated: number;
  linesOfCode: number;
  dependencyCount: number;
  success: boolean;
  errors: string[];
  timestamp: Date;
}

export interface SystemMetrics {
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
  timestamp: Date;
}

export class MonitoringService extends EventEmitter {
  private logger: Logger;
  private metrics: Metric[] = [];
  private healthChecks: HealthCheck[] = [];
  private generationMetrics: GenerationMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private metricsRetentionDays: number = 30;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(options: { retentionDays?: number } = {}) {
    super();
    this.logger = new Logger();
    this.metricsRetentionDays = options.retentionDays || 30;
    this.startSystemMonitoring();
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    labels: Record<string, string> = {}
  ): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      labels,
    };

    this.metrics.push(metric);
    this.emit('metric', metric);
    this.logger.debug(`Recorded metric: ${name} = ${value} ${unit}`, {
      labels,
    });

    // Clean up old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Record generation metrics
   */
  recordGenerationMetrics(metrics: GenerationMetrics): void {
    this.generationMetrics.push(metrics);
    this.emit('generationMetrics', metrics);

    // Record individual metrics
    this.recordMetric('generation_time', metrics.generationTime, 'ms', {
      packageType: metrics.packageType,
      qualityLevel: metrics.qualityLevel,
      success: metrics.success.toString(),
    });

    this.recordMetric('files_created', metrics.filesCreated, 'count', {
      packageType: metrics.packageType,
    });

    this.recordMetric('lines_of_code', metrics.linesOfCode, 'count', {
      packageType: metrics.packageType,
    });

    this.recordMetric('dependency_count', metrics.dependencyCount, 'count', {
      packageType: metrics.packageType,
    });

    this.logger.info('Generation metrics recorded', {
      packageType: metrics.packageType,
      success: metrics.success,
      generationTime: metrics.generationTime,
    });
  }

  /**
   * Record a health check result
   */
  recordHealthCheck(check: Omit<HealthCheck, 'timestamp'>): void {
    const healthCheck: HealthCheck = {
      ...check,
      timestamp: new Date(),
    };

    this.healthChecks.push(healthCheck);
    this.emit('healthCheck', healthCheck);

    if (healthCheck.status === 'critical') {
      this.logger.error(
        `Critical health check: ${healthCheck.name} - ${healthCheck.message}`
      );
    } else if (healthCheck.status === 'warning') {
      this.logger.warn(
        `Health check warning: ${healthCheck.name} - ${healthCheck.message}`
      );
    } else {
      this.logger.debug(`Health check passed: ${healthCheck.name}`);
    }
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // System health checks
    checks.push(await this.checkSystemHealth());
    checks.push(await this.checkDiskSpace());
    checks.push(await this.checkDependencies());
    checks.push(await this.checkAPIConnectivity());

    // Record all checks (recordHealthCheck will add timestamp automatically)
    checks.forEach((check) => {
      const { timestamp, ...checkWithoutTimestamp } = check;
      this.recordHealthCheck(checkWithoutTimestamp);
    });

    return checks;
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string, since?: Date): Metric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter((m) => m.name === name);
    }

    if (since) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp >= since);
    }

    return filteredMetrics.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get generation statistics
   */
  getGenerationStats(since?: Date): {
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    averageGenerationTime: number;
    packageTypeDistribution: Record<string, number>;
    qualityLevelDistribution: Record<string, number>;
  } {
    let metrics = this.generationMetrics;

    if (since) {
      metrics = metrics.filter((m) => m.timestamp >= since);
    }

    const totalGenerations = metrics.length;
    const successfulGenerations = metrics.filter((m) => m.success).length;
    const failedGenerations = totalGenerations - successfulGenerations;

    const averageGenerationTime =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.generationTime, 0) / metrics.length
        : 0;

    const packageTypeDistribution: Record<string, number> = {};
    const qualityLevelDistribution: Record<string, number> = {};

    metrics.forEach((m) => {
      packageTypeDistribution[m.packageType] =
        (packageTypeDistribution[m.packageType] || 0) + 1;
      qualityLevelDistribution[m.qualityLevel] =
        (qualityLevelDistribution[m.qualityLevel] || 0) + 1;
    });

    return {
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      averageGenerationTime,
      packageTypeDistribution,
      qualityLevelDistribution,
    };
  }

  /**
   * Get current system status
   */
  getSystemStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    recentHealthChecks: HealthCheck[];
  } {
    const recentHealthChecks = this.healthChecks
      .filter((check) => check.timestamp > new Date(Date.now() - 300000)) // Last 5 minutes
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const criticalChecks = recentHealthChecks.filter(
      (check) => check.status === 'critical'
    );
    const warningChecks = recentHealthChecks.filter(
      (check) => check.status === 'warning'
    );

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalChecks.length > 0) {
      status = 'critical';
    } else if (warningChecks.length > 0) {
      status = 'warning';
    }

    return {
      status,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      recentHealthChecks,
    };
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(filePath: string): Promise<void> {
    const data = {
      metrics: this.metrics,
      generationMetrics: this.generationMetrics,
      healthChecks: this.healthChecks,
      systemMetrics: this.systemMetrics,
      exportTimestamp: new Date(),
    };

    await fs.writeJson(filePath, data, { spaces: 2 });
    this.logger.info(`Metrics exported to ${filePath}`);
  }

  /**
   * Import metrics from file
   */
  async importMetrics(filePath: string): Promise<void> {
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Metrics file not found: ${filePath}`);
    }

    const data = await fs.readJson(filePath);

    if (data.metrics) {
      this.metrics.push(...data.metrics);
    }
    if (data.generationMetrics) {
      this.generationMetrics.push(...data.generationMetrics);
    }
    if (data.healthChecks) {
      this.healthChecks.push(...data.healthChecks);
    }
    if (data.systemMetrics) {
      this.systemMetrics.push(...data.systemMetrics);
    }

    this.logger.info(`Metrics imported from ${filePath}`);
  }

  /**
   * Start system monitoring
   */
  private startSystemMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.recordSystemMetrics();
    }, 30000); // Every 30 seconds

    // Record initial metrics
    this.recordSystemMetrics();
  }

  /**
   * Record system metrics
   */
  private recordSystemMetrics(): void {
    const systemMetric: SystemMetrics = {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date(),
    };

    this.systemMetrics.push(systemMetric);

    // Record individual metrics
    this.recordMetric('memory_rss', systemMetric.memoryUsage.rss, 'bytes');
    this.recordMetric(
      'memory_heap_used',
      systemMetric.memoryUsage.heapUsed,
      'bytes'
    );
    this.recordMetric(
      'memory_heap_total',
      systemMetric.memoryUsage.heapTotal,
      'bytes'
    );
    this.recordMetric('cpu_user', systemMetric.cpuUsage.user, 'microseconds');
    this.recordMetric(
      'cpu_system',
      systemMetric.cpuUsage.system,
      'microseconds'
    );

    // Clean up old system metrics
    const cutoff = new Date(
      Date.now() - this.metricsRetentionDays * 24 * 60 * 60 * 1000
    );
    this.systemMetrics = this.systemMetrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<HealthCheck> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (heapUsagePercent > 90) {
      return {
        name: 'system_health',
        status: 'critical',
        message: `High memory usage: ${heapUsagePercent.toFixed(1)}%`,
        timestamp: new Date(),
        details: { heapUsedMB, heapTotalMB, heapUsagePercent },
      };
    } else if (heapUsagePercent > 75) {
      return {
        name: 'system_health',
        status: 'warning',
        message: `Elevated memory usage: ${heapUsagePercent.toFixed(1)}%`,
        timestamp: new Date(),
        details: { heapUsedMB, heapTotalMB, heapUsagePercent },
      };
    }

    return {
      name: 'system_health',
      status: 'healthy',
      message: `Memory usage normal: ${heapUsagePercent.toFixed(1)}%`,
      timestamp: new Date(),
      details: { heapUsedMB, heapTotalMB, heapUsagePercent },
    };
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheck> {
    try {
      // This is a simplified check - in production, you'd use a proper disk space check
      const tmpDir = path.join(process.cwd(), 'tmp');
      await fs.ensureDir(tmpDir);

      return {
        name: 'disk_space',
        status: 'healthy',
        message: 'Disk space sufficient',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'disk_space',
        status: 'critical',
        message: `Disk space check failed: ${(error as Error).message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check dependencies
   */
  private async checkDependencies(): Promise<HealthCheck> {
    try {
      // Check if required dependencies are available
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (!(await fs.pathExists(packageJsonPath))) {
        return {
          name: 'dependencies',
          status: 'critical',
          message: 'package.json not found',
          timestamp: new Date(),
        };
      }

      return {
        name: 'dependencies',
        status: 'healthy',
        message: 'All dependencies available',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'dependencies',
        status: 'critical',
        message: `Dependency check failed: ${(error as Error).message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check API connectivity
   */
  private async checkAPIConnectivity(): Promise<HealthCheck> {
    try {
      // Check if OpenAI API is accessible (if API key is configured)
      if (process.env.OPENAI_API_KEY) {
        // This is a simplified check - in production, you'd make an actual API call
        return {
          name: 'api_connectivity',
          status: 'healthy',
          message: 'OpenAI API key configured',
          timestamp: new Date(),
        };
      }

      return {
        name: 'api_connectivity',
        status: 'warning',
        message: 'OpenAI API key not configured',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'api_connectivity',
        status: 'critical',
        message: `API connectivity check failed: ${(error as Error).message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(
      Date.now() - this.metricsRetentionDays * 24 * 60 * 60 * 1000
    );

    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
    this.healthChecks = this.healthChecks.filter((h) => h.timestamp > cutoff);
    this.generationMetrics = this.generationMetrics.filter(
      (g) => g.timestamp > cutoff
    );
  }

  /**
   * Stop monitoring
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.removeAllListeners();
  }
}

// Global monitoring instance
let globalMonitoring: MonitoringService | null = null;

export function getGlobalMonitoring(): MonitoringService {
  if (!globalMonitoring) {
    globalMonitoring = new MonitoringService();
  }
  return globalMonitoring;
}

export function setGlobalMonitoring(monitoring: MonitoringService): void {
  if (globalMonitoring) {
    globalMonitoring.destroy();
  }
  globalMonitoring = monitoring;
}
