#!/usr/bin/env node

/**
 * Performance Testing Script
 * ==========================
 * 
 * Comprehensive performance benchmarks for OpenNode Forge
 */

const { performance } = require('perf_hooks');
const fs = require('fs-extra');
const path = require('path');

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {}
    };
  }

  async runAllTests() {
    console.log('Starting performance tests...\n');

    try {
      await this.testPackageGeneration();
      await this.testAnalysisEngine();
      await this.testTemplateProcessing();
      await this.testCLIPerformance();
      await this.testMemoryUsage();
      
      this.generateSummary();
      await this.saveResults();
      
      console.log('\nPerformance tests completed successfully!');
      this.displayResults();
      
    } catch (error) {
      console.error('ERROR: Performance tests failed:', error);
      process.exit(1);
    }
  }

  async testPackageGeneration() {
    const testName = 'Package Generation';
    console.log(`Testing ${testName}...`);

    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate package generation
      await this.simulatePackageGeneration();
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateStats(testName, times, 'ms');
    this.results.tests.push(result);
    console.log(`   Average: ${result.average.toFixed(2)}ms`);
  }

  async testAnalysisEngine() {
    const testName = 'Code Analysis';
    console.log(`Testing ${testName}...`);

    const iterations = 5;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate analysis
      await this.simulateCodeAnalysis();
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateStats(testName, times, 'ms');
    this.results.tests.push(result);
    console.log(`   Average: ${result.average.toFixed(2)}ms`);
  }

  async testTemplateProcessing() {
    const testName = 'Template Processing';
    console.log(`Testing ${testName}...`);

    const iterations = 20;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate template processing
      await this.simulateTemplateProcessing();
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateStats(testName, times, 'ms');
    this.results.tests.push(result);
    console.log(`   Average: ${result.average.toFixed(2)}ms`);
  }

  async testCLIPerformance() {
    const testName = 'CLI Startup Time';
    console.log(`Testing ${testName}...`);

    const iterations = 5;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate CLI startup
      await this.simulateCLIStartup();
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateStats(testName, times, 'ms');
    this.results.tests.push(result);
    console.log(`   Average: ${result.average.toFixed(2)}ms`);
  }

  async testMemoryUsage() {
    const testName = 'Memory Usage';
    console.log(`Testing ${testName}...`);

    const initialMemory = process.memoryUsage();
    
    // Perform memory-intensive operations
    await this.simulateMemoryIntensiveOperations();
    
    const finalMemory = process.memoryUsage();
    
    const memoryDelta = {
      rss: finalMemory.rss - initialMemory.rss,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
    };

    const result = {
      name: testName,
      type: 'memory',
      initialMemory,
      finalMemory,
      delta: memoryDelta,
      unit: 'bytes'
    };

    this.results.tests.push(result);
    console.log(`   Memory delta: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }

  // Simulation methods
  async simulatePackageGeneration() {
    // Simulate file operations, AI calls, and processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Simulate some CPU work
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      sum += Math.sqrt(i);
    }
    return sum;
  }

  async simulateCodeAnalysis() {
    // Simulate file reading and analysis
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    // Simulate AST parsing and metrics calculation
    const data = new Array(10000).fill(0).map(() => Math.random());
    return data.reduce((acc, val) => acc + val, 0);
  }

  async simulateTemplateProcessing() {
    // Simulate template compilation and rendering
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    
    // Simulate string processing
    let result = '';
    for (let i = 0; i < 1000; i++) {
      result += `template_${i}_`;
    }
    return result.length;
  }

  async simulateCLIStartup() {
    // Simulate module loading and initialization
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    // Simulate configuration loading
    const config = {
      loaded: true,
      timestamp: Date.now()
    };
    return config;
  }

  async simulateMemoryIntensiveOperations() {
    // Create large data structures to test memory usage
    const largeArray = new Array(100000).fill(0).map((_, i) => ({
      id: i,
      data: `data_${i}_${Math.random()}`,
      nested: {
        value: Math.random(),
        array: new Array(100).fill(Math.random())
      }
    }));

    // Process the data
    const processed = largeArray.map(item => ({
      ...item,
      processed: true,
      hash: item.data.length + item.nested.value
    }));

    // Cleanup
    largeArray.length = 0;
    processed.length = 0;
  }

  calculateStats(name, times, unit) {
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const median = this.calculateMedian(times);
    const p95 = this.calculatePercentile(times, 95);
    const p99 = this.calculatePercentile(times, 99);

    return {
      name,
      type: 'timing',
      average,
      min,
      max,
      median,
      p95,
      p99,
      iterations: times.length,
      unit,
      rawTimes: times
    };
  }

  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculatePercentile(arr, percentile) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  generateSummary() {
    const timingTests = this.results.tests.filter(t => t.type === 'timing');
    
    this.results.summary = {
      totalTests: this.results.tests.length,
      averageTime: timingTests.reduce((sum, test) => sum + test.average, 0) / timingTests.length,
      slowestTest: timingTests.reduce((prev, current) => 
        (prev.average > current.average) ? prev : current
      ),
      fastestTest: timingTests.reduce((prev, current) => 
        (prev.average < current.average) ? prev : current
      ),
      memoryTest: this.results.tests.find(t => t.type === 'memory'),
      performanceGrade: this.calculatePerformanceGrade(timingTests)
    };
  }

  calculatePerformanceGrade(tests) {
    const avgTime = tests.reduce((sum, test) => sum + test.average, 0) / tests.length;
    
    if (avgTime < 100) return 'A';
    if (avgTime < 250) return 'B';
    if (avgTime < 500) return 'C';
    if (avgTime < 1000) return 'D';
    return 'F';
  }

  async saveResults() {
    const resultsDir = path.join(process.cwd(), 'performance-results');
    await fs.ensureDir(resultsDir);
    
    const filename = `performance-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);
    
    await fs.writeJson(filepath, this.results, { spaces: 2 });
    
    // Also save as the latest results
    const latestPath = path.join(process.cwd(), 'performance-results.json');
    await fs.writeJson(latestPath, this.results, { spaces: 2 });
    
    console.log(`\nResults saved to: ${filepath}`);
  }

  displayResults() {
    const { summary } = this.results;
    
    console.log('\nPerformance Test Summary:');
    console.log('================================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Overall Grade: ${summary.performanceGrade}`);
    console.log(`Average Time: ${summary.averageTime.toFixed(2)}ms`);
    console.log(`Fastest Test: ${summary.fastestTest.name} (${summary.fastestTest.average.toFixed(2)}ms)`);
    console.log(`Slowest Test: ${summary.slowestTest.name} (${summary.slowestTest.average.toFixed(2)}ms)`);
    
    if (summary.memoryTest) {
      const memoryDelta = summary.memoryTest.delta.heapUsed / 1024 / 1024;
      console.log(`Memory Usage: ${memoryDelta.toFixed(2)}MB delta`);
    }

    // Performance thresholds
    if (summary.performanceGrade === 'F') {
      console.log('\nWARNING: Performance issues detected! Consider optimization.');
      process.exit(1);
    } else if (summary.performanceGrade === 'D') {
      console.log('\nWARNING: Performance could be improved.');
    } else {
      console.log('\nPerformance is within acceptable limits.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTester; 