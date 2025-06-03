/**
 * Advanced Security Scanner
 * =========================
 *
 * Comprehensive security analysis, vulnerability detection, and compliance
 * checking for generated packages and code
 */

import { Logger } from '../core/logger';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'dependency' | 'code' | 'configuration' | 'secrets' | 'permissions';
  title: string;
  description: string;
  file?: string;
  line?: number;
  remediation: string;
  cwe?: string;
  cvss?: number;
}

export interface SecurityReport {
  packagePath: string;
  scanTimestamp: Date;
  overallScore: number;
  vulnerabilities: SecurityVulnerability[];
  compliance: {
    owasp: boolean;
    nist: boolean;
    iso27001: boolean;
  };
  recommendations: string[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ScanOptions {
  includeNodeModules: boolean;
  includeLockFiles: boolean;
  checkSecrets: boolean;
  checkPermissions: boolean;
  checkDependencies: boolean;
  checkCodeQuality: boolean;
  enableAudit: boolean;
}

export class AdvancedSecurityScanner {
  private logger: Logger;
  private secretPatterns: RegExp[] = [];

  constructor() {
    this.logger = new Logger();
    this.initializeSecretPatterns();
  }

  /**
   * Perform comprehensive security scan
   */
  async scanPackage(
    packagePath: string,
    options: Partial<ScanOptions> = {}
  ): Promise<SecurityReport> {
    const defaultOptions: ScanOptions = {
      includeNodeModules: false,
      includeLockFiles: true,
      checkSecrets: true,
      checkPermissions: true,
      checkDependencies: true,
      checkCodeQuality: true,
      enableAudit: true,
    };

    const scanOptions = { ...defaultOptions, ...options };
    const vulnerabilities: SecurityVulnerability[] = [];

    this.logger.info(`Starting security scan of ${packagePath}`);

    try {
      // Dependency vulnerabilities
      if (scanOptions.checkDependencies) {
        const depVulns = await this.scanDependencies(packagePath, scanOptions);
        vulnerabilities.push(...depVulns);
      }

      // Secret detection
      if (scanOptions.checkSecrets) {
        const secretVulns = await this.scanForSecrets(packagePath, scanOptions);
        vulnerabilities.push(...secretVulns);
      }

      // Permission issues
      if (scanOptions.checkPermissions) {
        const permVulns = await this.scanPermissions(packagePath, scanOptions);
        vulnerabilities.push(...permVulns);
      }

      // Code quality and security
      if (scanOptions.checkCodeQuality) {
        const codeVulns = await this.scanCodeSecurity(packagePath, scanOptions);
        vulnerabilities.push(...codeVulns);
      }

      // Configuration security
      const configVulns = await this.scanConfiguration(
        packagePath,
        scanOptions
      );
      vulnerabilities.push(...configVulns);

      // Generate report
      const report = this.generateSecurityReport(packagePath, vulnerabilities);

      this.logger.info(
        `Security scan completed. Found ${vulnerabilities.length} issues`
      );
      return report;
    } catch (error) {
      this.logger.error('Security scan failed:', error);
      throw error;
    }
  }

  /**
   * Scan for dependency vulnerabilities
   */
  private async scanDependencies(
    packagePath: string,
    options: ScanOptions
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(packagePath, 'package.json');
      if (!(await fs.pathExists(packageJsonPath))) {
        return vulnerabilities;
      }

      // Run npm audit if enabled
      if (options.enableAudit) {
        try {
          const auditOutput = execSync('npm audit --json', {
            cwd: packagePath,
            stdio: 'pipe',
            encoding: 'utf8',
          });

          const auditResults = JSON.parse(auditOutput);

          if (auditResults.vulnerabilities) {
            Object.entries(auditResults.vulnerabilities).forEach(
              ([pkg, vuln]: [string, any]) => {
                vulnerabilities.push({
                  id: `dep-${pkg}-${vuln.via[0]?.source || 'unknown'}`,
                  severity: this.mapSeverity(vuln.severity),
                  category: 'dependency',
                  title: `Vulnerable dependency: ${pkg}`,
                  description:
                    vuln.via[0]?.title || 'Dependency vulnerability detected',
                  remediation: `Update ${pkg} to version ${vuln.fixAvailable?.version || 'latest'}`,
                  cvss: vuln.via[0]?.cvss?.score,
                });
              }
            );
          }
        } catch (error) {
          // npm audit may fail, log but continue
          this.logger.debug('npm audit failed:', error);
        }
      }

      // Check for known vulnerable patterns in package.json
      const packageJson = await fs.readJson(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };

      // Check for commonly vulnerable packages
      const vulnerablePackages = [
        'lodash',
        'moment',
        'request',
        'node-uuid',
        'validator',
      ];

      Object.keys(allDeps).forEach((dep) => {
        if (vulnerablePackages.includes(dep)) {
          const version = allDeps[dep];
          if (this.isVersionVulnerable(dep, version)) {
            vulnerabilities.push({
              id: `dep-pattern-${dep}`,
              severity: 'medium',
              category: 'dependency',
              title: `Potentially vulnerable dependency: ${dep}`,
              description: `Package ${dep} version ${version} may have known vulnerabilities`,
              remediation: `Review and update ${dep} to the latest secure version`,
              file: 'package.json',
            });
          }
        }
      });
    } catch (error) {
      this.logger.error('Dependency scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Scan for secrets and sensitive data
   */
  private async scanForSecrets(
    packagePath: string,
    options: ScanOptions
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const files = await this.getFilesToScan(packagePath, options);

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            this.secretPatterns.forEach((pattern, patternIndex) => {
              const match = line.match(pattern);
              if (match) {
                vulnerabilities.push({
                  id: `secret-${patternIndex}-${path.basename(file)}-${index}`,
                  severity: 'high',
                  category: 'secrets',
                  title: 'Potential secret detected',
                  description: `Possible API key, password, or token found in code`,
                  file: path.relative(packagePath, file),
                  line: index + 1,
                  remediation:
                    'Remove hardcoded secrets and use environment variables or secure vaults',
                });
              }
            });
          });
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    } catch (error) {
      this.logger.error('Secret scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Scan file permissions
   */
  private async scanPermissions(
    packagePath: string,
    options: ScanOptions
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const files = await this.getFilesToScan(packagePath, options);

      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          const mode = stats.mode;

          // Check for overly permissive files
          if ((mode & parseInt('077', 8)) !== 0) {
            vulnerabilities.push({
              id: `perm-${path.basename(file)}`,
              severity: 'medium',
              category: 'permissions',
              title: 'Overly permissive file permissions',
              description: `File has world or group write permissions`,
              file: path.relative(packagePath, file),
              remediation:
                'Restrict file permissions to prevent unauthorized access',
            });
          }

          // Check for executable scripts
          if (file.endsWith('.sh') || file.endsWith('.bat')) {
            if ((mode & parseInt('111', 8)) !== 0) {
              vulnerabilities.push({
                id: `exec-${path.basename(file)}`,
                severity: 'low',
                category: 'permissions',
                title: 'Executable script detected',
                description: `Script file is executable`,
                file: path.relative(packagePath, file),
                remediation:
                  "Review script content and ensure it's safe to execute",
              });
            }
          }
        } catch (error) {
          // Skip files with permission errors
          continue;
        }
      }
    } catch (error) {
      this.logger.error('Permission scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Scan code for security issues
   */
  private async scanCodeSecurity(
    packagePath: string,
    options: ScanOptions
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const files = await this.getFilesToScan(packagePath, options, [
        '.js',
        '.ts',
        '.json',
      ]);

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            // Check for dangerous functions
            const dangerousPatterns = [
              /eval\s*\(/,
              /new\s+Function\s*\(/,
              /setTimeout\s*\(\s*['"`][^'"`]*['"`]/,
              /setInterval\s*\(\s*['"`][^'"`]*['"`]/,
              /document\.write\s*\(/,
              /innerHTML\s*=/,
              /outerHTML\s*=/,
            ];

            dangerousPatterns.forEach((pattern, patternIndex) => {
              if (pattern.test(line)) {
                vulnerabilities.push({
                  id: `code-danger-${patternIndex}-${path.basename(file)}-${index}`,
                  severity: 'high',
                  category: 'code',
                  title: 'Dangerous function usage',
                  description:
                    'Usage of potentially dangerous function that could lead to code injection',
                  file: path.relative(packagePath, file),
                  line: index + 1,
                  remediation:
                    'Replace with safer alternatives or implement proper input validation',
                  cwe: 'CWE-94',
                });
              }
            });

            // Check for SQL injection patterns
            const sqlPatterns = [
              /query\s*\(\s*['"`][^'"`]*\+/,
              /execute\s*\(\s*['"`][^'"`]*\+/,
              /SELECT\s+.*\+/i,
              /INSERT\s+.*\+/i,
              /UPDATE\s+.*\+/i,
              /DELETE\s+.*\+/i,
            ];

            sqlPatterns.forEach((pattern, patternIndex) => {
              if (pattern.test(line)) {
                vulnerabilities.push({
                  id: `sql-injection-${patternIndex}-${path.basename(file)}-${index}`,
                  severity: 'critical',
                  category: 'code',
                  title: 'Potential SQL injection',
                  description:
                    'Code pattern suggests potential SQL injection vulnerability',
                  file: path.relative(packagePath, file),
                  line: index + 1,
                  remediation:
                    'Use parameterized queries or prepared statements',
                  cwe: 'CWE-89',
                  cvss: 9.1,
                });
              }
            });
          });
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    } catch (error) {
      this.logger.error('Code security scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Scan configuration files
   */
  private async scanConfiguration(
    packagePath: string,
    options: ScanOptions
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check package.json for security issues
      const packageJsonPath = path.join(packagePath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);

        // Check for missing security fields
        if (!packageJson.engines) {
          vulnerabilities.push({
            id: 'config-engines',
            severity: 'low',
            category: 'configuration',
            title: 'Missing engines specification',
            description:
              'package.json does not specify supported Node.js versions',
            file: 'package.json',
            remediation:
              'Add engines field to specify supported Node.js versions',
          });
        }

        if (!packageJson.files) {
          vulnerabilities.push({
            id: 'config-files',
            severity: 'medium',
            category: 'configuration',
            title: 'Missing files specification',
            description:
              'package.json does not specify which files to include in package',
            file: 'package.json',
            remediation:
              'Add files field to explicitly control what gets published',
          });
        }

        // Check for dangerous scripts
        if (packageJson.scripts) {
          Object.entries(packageJson.scripts).forEach(
            ([scriptName, script]) => {
              if (typeof script === 'string' && script.includes('rm -rf')) {
                vulnerabilities.push({
                  id: `script-dangerous-${scriptName}`,
                  severity: 'high',
                  category: 'configuration',
                  title: 'Dangerous script command',
                  description: `Script "${scriptName}" contains potentially dangerous commands`,
                  file: 'package.json',
                  remediation:
                    'Review and replace dangerous commands with safer alternatives',
                });
              }
            }
          );
        }
      }

      // Check for .env files in wrong locations
      const envFiles = [
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
      ];
      for (const envFile of envFiles) {
        const envPath = path.join(packagePath, envFile);
        if (await fs.pathExists(envPath)) {
          vulnerabilities.push({
            id: `config-env-${envFile}`,
            severity: 'medium',
            category: 'configuration',
            title: 'Environment file detected',
            description: `Environment file ${envFile} found in repository`,
            file: envFile,
            remediation:
              'Add environment files to .gitignore and use environment variables',
          });
        }
      }
    } catch (error) {
      this.logger.error('Configuration scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Generate comprehensive security report
   */
  private generateSecurityReport(
    packagePath: string,
    vulnerabilities: SecurityVulnerability[]
  ): SecurityReport {
    const summary = vulnerabilities.reduce(
      (acc, vuln) => {
        acc[vuln.severity]++;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    );

    // Calculate overall security score (0-100)
    const severityWeights = { critical: 25, high: 10, medium: 3, low: 1 };
    const totalPenalty = Object.entries(summary).reduce(
      (acc, [severity, count]) =>
        acc + count * severityWeights[severity as keyof typeof severityWeights],
      0
    );
    const overallScore = Math.max(0, 100 - totalPenalty);

    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilities);

    // Check compliance
    const compliance = {
      owasp: summary.critical === 0 && summary.high <= 2,
      nist: summary.critical === 0 && summary.high <= 1,
      iso27001:
        summary.critical === 0 && summary.high === 0 && summary.medium <= 5,
    };

    return {
      packagePath,
      scanTimestamp: new Date(),
      overallScore,
      vulnerabilities,
      compliance,
      recommendations,
      summary,
    };
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    vulnerabilities: SecurityVulnerability[]
  ): string[] {
    const recommendations: string[] = [];
    const categories = [...new Set(vulnerabilities.map((v) => v.category))];

    if (categories.includes('secrets')) {
      recommendations.push('Implement a secrets management solution');
      recommendations.push(
        'Use environment variables for sensitive configuration'
      );
    }

    if (categories.includes('dependency')) {
      recommendations.push('Enable automated dependency scanning');
      recommendations.push('Keep dependencies up to date');
      recommendations.push('Use npm audit fix regularly');
    }

    if (categories.includes('code')) {
      recommendations.push('Implement static code analysis in CI/CD pipeline');
      recommendations.push('Use linting rules that include security checks');
      recommendations.push('Conduct regular code reviews focusing on security');
    }

    if (categories.includes('configuration')) {
      recommendations.push('Review and harden configuration files');
      recommendations.push('Implement least-privilege principles');
    }

    if (categories.includes('permissions')) {
      recommendations.push('Review and restrict file permissions');
      recommendations.push('Implement proper access controls');
    }

    return recommendations;
  }

  /**
   * Get files to scan based on options
   */
  private async getFilesToScan(
    packagePath: string,
    options: ScanOptions,
    extensions: string[] = ['.js', '.ts', '.json', '.md', '.txt']
  ): Promise<string[]> {
    const files: string[] = [];

    const walk = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules unless explicitly included
          if (entry.name === 'node_modules' && !options.includeNodeModules) {
            continue;
          }
          // Skip common directories that shouldn't be scanned
          if (
            ['.git', '.svn', '.hg', 'coverage', 'dist', 'build'].includes(
              entry.name
            )
          ) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext) || extensions.includes('*')) {
            files.push(fullPath);
          }

          // Include lock files if specified
          if (
            options.includeLockFiles &&
            ['package-lock.json', 'yarn.lock'].includes(entry.name)
          ) {
            files.push(fullPath);
          }
        }
      }
    };

    await walk(packagePath);
    return files;
  }

  /**
   * Initialize secret detection patterns
   */
  private initializeSecretPatterns(): void {
    this.secretPatterns = [
      // API Keys
      /(?:api_key|apikey|api-key)[\s]*[:=][\s]*['"`]([a-zA-Z0-9_\-]{20,})/i,
      // AWS
      /AKIA[0-9A-Z]{16}/,
      /(?:aws_access_key_id|aws_secret_access_key)[\s]*[:=][\s]*['"`]([a-zA-Z0-9+/]{20,})/i,
      // GitHub
      /ghp_[a-zA-Z0-9]{36}/,
      /github_pat_[a-zA-Z0-9_]{82}/,
      // Generic secrets
      /(?:password|passwd|secret|token)[\s]*[:=][\s]*['"`]([a-zA-Z0-9!@#$%^&*()_+\-=]{8,})/i,
      // JWT
      /eyJ[a-zA-Z0-9_\-]*\.eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*/,
      // Base64 encoded (potential secrets)
      /(?:secret|key|token|password)[\s]*[:=][\s]*['"`]([a-zA-Z0-9+/]{40,}={0,2})/i,
    ];
  }

  /**
   * Map severity levels
   */
  private mapSeverity(
    severity: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'moderate':
      case 'medium':
        return 'medium';
      case 'low':
      case 'info':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Check if a package version is vulnerable
   */
  private isVersionVulnerable(packageName: string, version: string): boolean {
    // This is a simplified check - in production, you'd use a vulnerability database
    const knownVulnerable = {
      lodash: ['<4.17.21'],
      moment: ['<2.29.4'],
      request: ['*'], // Deprecated
      'node-uuid': ['*'], // Deprecated
      validator: ['<13.7.0'],
    };

    return (
      knownVulnerable[packageName as keyof typeof knownVulnerable]?.some(
        (pattern) => {
          if (pattern === '*') return true;
          // Simplified version comparison
          return pattern.startsWith('<') && version.includes(pattern.slice(1));
        }
      ) || false
    );
  }
}

export const securityScanner = new AdvancedSecurityScanner();
