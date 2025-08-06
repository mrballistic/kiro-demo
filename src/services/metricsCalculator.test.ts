import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCalculator, DataTransformer } from './metricsCalculator.js';
import type { CodeMetric, TimeRange, SnapshotData, CommitData } from '../types/index.js';

describe('MetricsCalculator', () => {
  let calculator: MetricsCalculator;
  let sampleMetrics: CodeMetric[];

  beforeEach(() => {
    calculator = new MetricsCalculator();
    
    // Create sample metrics for testing
    sampleMetrics = [
      {
        id: 'metric-001',
        developerId: 'dev-001',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: 2,
        commitHash: 'abc123',
        repository: 'test-repo'
      },
      {
        id: 'metric-002',
        developerId: 'dev-001',
        timestamp: new Date('2024-01-02T10:00:00Z'),
        linesAdded: 150,
        linesRemoved: 30,
        filesModified: 3,
        commitHash: 'def456',
        repository: 'test-repo'
      },
      {
        id: 'metric-003',
        developerId: 'dev-001',
        timestamp: new Date('2024-01-03T10:00:00Z'),
        linesAdded: 50,
        linesRemoved: 10,
        filesModified: 1,
        commitHash: 'ghi789',
        repository: 'test-repo'
      }
    ];
  });

  describe('calculateLinesPerFileRatio', () => {
    it('should calculate correct ratio for valid metrics', () => {
      // Total lines: 100 + 150 + 50 = 300
      // Total files: 2 + 3 + 1 = 6
      // Ratio: 300 / 6 = 50
      const ratio = calculator.calculateLinesPerFileRatio(sampleMetrics);
      expect(ratio).toBe(50);
    });

    it('should return 0 for empty metrics array', () => {
      const ratio = calculator.calculateLinesPerFileRatio([]);
      expect(ratio).toBe(0);
    });

    it('should return 0 for null/undefined metrics', () => {
      expect(calculator.calculateLinesPerFileRatio(null as any)).toBe(0);
      expect(calculator.calculateLinesPerFileRatio(undefined as any)).toBe(0);
    });

    it('should return 0 when total files is 0', () => {
      const metricsWithNoFiles: CodeMetric[] = [
        {
          id: 'metric-001',
          developerId: 'dev-001',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 20,
          filesModified: 0,
          commitHash: 'abc123',
          repository: 'test-repo'
        }
      ];
      
      const ratio = calculator.calculateLinesPerFileRatio(metricsWithNoFiles);
      expect(ratio).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const metricsWithDecimal: CodeMetric[] = [
        {
          id: 'metric-001',
          developerId: 'dev-001',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 0,
          filesModified: 3, // 100/3 = 33.333...
          commitHash: 'abc123',
          repository: 'test-repo'
        }
      ];
      
      const ratio = calculator.calculateLinesPerFileRatio(metricsWithDecimal);
      expect(ratio).toBe(33.33);
    });
  });

  describe('calculateSummary', () => {
    it('should calculate correct summary for valid metrics', () => {
      const summary = calculator.calculateSummary(sampleMetrics);
      
      expect(summary.totalLinesAdded).toBe(300); // 100 + 150 + 50
      expect(summary.totalLinesRemoved).toBe(60); // 20 + 30 + 10
      expect(summary.totalFiles).toBe(6); // 2 + 3 + 1
      expect(summary.linesPerFileRatio).toBe(50); // 300 / 6
      expect(summary.netLinesChanged).toBe(240); // 300 - 60
      expect(summary.timeRange.start).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(summary.timeRange.end).toEqual(new Date('2024-01-03T10:00:00Z'));
    });

    it('should return zero summary for empty metrics', () => {
      const summary = calculator.calculateSummary([]);
      
      expect(summary.totalLinesAdded).toBe(0);
      expect(summary.totalLinesRemoved).toBe(0);
      expect(summary.totalFiles).toBe(0);
      expect(summary.linesPerFileRatio).toBe(0);
      expect(summary.netLinesChanged).toBe(0);
      expect(summary.timeRange.start).toBeInstanceOf(Date);
      expect(summary.timeRange.end).toBeInstanceOf(Date);
    });

    it('should handle single metric correctly', () => {
      const singleMetric = [sampleMetrics[0]];
      const summary = calculator.calculateSummary(singleMetric);
      
      expect(summary.totalLinesAdded).toBe(100);
      expect(summary.totalLinesRemoved).toBe(20);
      expect(summary.totalFiles).toBe(2);
      expect(summary.linesPerFileRatio).toBe(50);
      expect(summary.netLinesChanged).toBe(80);
      expect(summary.timeRange.start).toEqual(summary.timeRange.end);
    });

    it('should handle metrics with negative net changes', () => {
      const metricsWithMoreRemovals: CodeMetric[] = [
        {
          id: 'metric-001',
          developerId: 'dev-001',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 50,
          linesRemoved: 100,
          filesModified: 2,
          commitHash: 'abc123',
          repository: 'test-repo'
        }
      ];
      
      const summary = calculator.calculateSummary(metricsWithMoreRemovals);
      expect(summary.netLinesChanged).toBe(-50);
    });
  });

  describe('aggregateByTimeRange', () => {
    it('should filter metrics within time range', () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T23:59:59Z')
      };
      
      const filtered = calculator.aggregateByTimeRange(sampleMetrics, timeRange);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('metric-001');
      expect(filtered[1].id).toBe('metric-002');
    });

    it('should return empty array for time range with no matches', () => {
      const timeRange: TimeRange = {
        start: new Date('2024-02-01T00:00:00Z'),
        end: new Date('2024-02-02T23:59:59Z')
      };
      
      const filtered = calculator.aggregateByTimeRange(sampleMetrics, timeRange);
      expect(filtered).toHaveLength(0);
    });

    it('should handle empty metrics array', () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T23:59:59Z')
      };
      
      const filtered = calculator.aggregateByTimeRange([], timeRange);
      expect(filtered).toHaveLength(0);
    });

    it('should include metrics exactly at range boundaries', () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01T10:00:00Z'), // Exact match with first metric
        end: new Date('2024-01-02T10:00:00Z')   // Exact match with second metric
      };
      
      const filtered = calculator.aggregateByTimeRange(sampleMetrics, timeRange);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('groupMetricsByDeveloper', () => {
    it('should group metrics by developer ID', () => {
      const mixedMetrics: CodeMetric[] = [
        ...sampleMetrics,
        {
          id: 'metric-004',
          developerId: 'dev-002',
          timestamp: new Date('2024-01-04T10:00:00Z'),
          linesAdded: 75,
          linesRemoved: 15,
          filesModified: 2,
          commitHash: 'jkl012',
          repository: 'test-repo'
        }
      ];
      
      const grouped = calculator.groupMetricsByDeveloper(mixedMetrics);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('dev-001')).toHaveLength(3);
      expect(grouped.get('dev-002')).toHaveLength(1);
    });

    it('should handle empty metrics array', () => {
      const grouped = calculator.groupMetricsByDeveloper([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('aggregateByDay', () => {
    it('should aggregate metrics by day', () => {
      // Add metrics on the same day
      const metricsWithSameDay: CodeMetric[] = [
        ...sampleMetrics,
        {
          id: 'metric-004',
          developerId: 'dev-001',
          timestamp: new Date('2024-01-01T15:00:00Z'), // Same day as metric-001
          linesAdded: 25,
          linesRemoved: 5,
          filesModified: 1,
          commitHash: 'xyz789',
          repository: 'test-repo'
        }
      ];
      
      const aggregated = calculator.aggregateByDay(metricsWithSameDay);
      
      expect(aggregated).toHaveLength(3); // 3 unique days
      
      // First day should have aggregated values
      const firstDay = aggregated.find(m => m.timestamp.toISOString().startsWith('2024-01-01'));
      expect(firstDay?.linesAdded).toBe(125); // 100 + 25
      expect(firstDay?.linesRemoved).toBe(25); // 20 + 5
      expect(firstDay?.filesModified).toBe(3); // 2 + 1
    });

    it('should return empty array for empty input', () => {
      const aggregated = calculator.aggregateByDay([]);
      expect(aggregated).toHaveLength(0);
    });

    it('should sort results by timestamp', () => {
      const aggregated = calculator.aggregateByDay(sampleMetrics);
      
      for (let i = 1; i < aggregated.length; i++) {
        expect(aggregated[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          aggregated[i - 1].timestamp.getTime()
        );
      }
    });
  });

  describe('aggregateByWeek', () => {
    it('should aggregate metrics by week', () => {
      const weeklyAggregated = calculator.aggregateByWeek(sampleMetrics);
      
      expect(weeklyAggregated).toHaveLength(1); // All metrics are in the same week
      expect(weeklyAggregated[0].linesAdded).toBe(300);
      expect(weeklyAggregated[0].linesRemoved).toBe(60);
      expect(weeklyAggregated[0].filesModified).toBe(6);
    });

    it('should handle metrics across multiple weeks', () => {
      const multiWeekMetrics: CodeMetric[] = [
        sampleMetrics[0], // Week 1
        {
          ...sampleMetrics[1],
          timestamp: new Date('2024-01-08T10:00:00Z') // Week 2
        }
      ];
      
      const weeklyAggregated = calculator.aggregateByWeek(multiWeekMetrics);
      expect(weeklyAggregated).toHaveLength(2);
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average correctly', () => {
      const movingAvg = calculator.calculateMovingAverage(sampleMetrics, 2);
      
      expect(movingAvg).toHaveLength(3);
      
      // First point should just be itself
      expect(movingAvg[0].linesAdded).toBe(100);
      
      // Second point should be average of first two
      expect(movingAvg[1].linesAdded).toBe(125); // (100 + 150) / 2
      
      // Third point should be average of last two
      expect(movingAvg[2].linesAdded).toBe(100); // (150 + 50) / 2
    });

    it('should return empty array for invalid window', () => {
      expect(calculator.calculateMovingAverage(sampleMetrics, 0)).toHaveLength(0);
      expect(calculator.calculateMovingAverage(sampleMetrics, -1)).toHaveLength(0);
    });

    it('should handle empty metrics', () => {
      const movingAvg = calculator.calculateMovingAverage([], 7);
      expect(movingAvg).toHaveLength(0);
    });
  });
});

describe('DataTransformer', () => {
  let transformer: DataTransformer;
  let sampleSnapshot: SnapshotData;

  beforeEach(() => {
    transformer = new DataTransformer();
    
    sampleSnapshot = {
      repository: 'test-repo',
      commits: [
        {
          hash: 'abc123',
          author: 'John Doe',
          email: 'john.doe@example.com',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 20,
          filesModified: ['file1.ts', 'file2.ts']
        },
        {
          hash: 'def456',
          author: 'Jane Smith',
          email: 'jane.smith@example.com',
          timestamp: new Date('2024-01-02T10:00:00Z'),
          linesAdded: 150,
          linesRemoved: 30,
          filesModified: ['file3.ts', 'file4.ts', 'file5.ts']
        },
        {
          hash: 'ghi789',
          author: 'John Doe',
          email: 'john.doe@example.com',
          timestamp: new Date('2024-01-03T10:00:00Z'),
          linesAdded: 50,
          linesRemoved: 10,
          filesModified: ['file1.ts']
        }
      ]
    };
  });

  describe('transformSnapshotToMetrics', () => {
    it('should transform snapshot data to metrics correctly', () => {
      const metrics = transformer.transformSnapshotToMetrics(sampleSnapshot);
      
      expect(metrics).toHaveLength(3);
      
      // Check first metric
      expect(metrics[0].id).toBe('metric-0001');
      expect(metrics[0].developerId).toBe('dev-001');
      expect(metrics[0].linesAdded).toBe(100);
      expect(metrics[0].linesRemoved).toBe(20);
      expect(metrics[0].filesModified).toBe(2);
      expect(metrics[0].commitHash).toBe('abc123');
      expect(metrics[0].repository).toBe('test-repo');
      
      // Check that same email gets same developer ID
      expect(metrics[0].developerId).toBe(metrics[2].developerId);
      
      // Check that different email gets different developer ID
      expect(metrics[1].developerId).toBe('dev-002');
    });

    it('should handle empty snapshot', () => {
      const emptySnapshot: SnapshotData = {
        repository: 'test-repo',
        commits: []
      };
      
      const metrics = transformer.transformSnapshotToMetrics(emptySnapshot);
      expect(metrics).toHaveLength(0);
    });

    it('should handle null/undefined snapshot', () => {
      expect(transformer.transformSnapshotToMetrics(null as any)).toHaveLength(0);
      expect(transformer.transformSnapshotToMetrics(undefined as any)).toHaveLength(0);
    });

    it('should convert timestamp strings to Date objects', () => {
      const snapshotWithStringDates: SnapshotData = {
        repository: 'test-repo',
        commits: [
          {
            hash: 'abc123',
            author: 'John Doe',
            email: 'john.doe@example.com',
            timestamp: '2024-01-01T10:00:00Z' as any, // String instead of Date
            linesAdded: 100,
            linesRemoved: 20,
            filesModified: ['file1.ts']
          }
        ]
      };
      
      const metrics = transformer.transformSnapshotToMetrics(snapshotWithStringDates);
      expect(metrics[0].timestamp).toBeInstanceOf(Date);
      expect(metrics[0].timestamp.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    });
  });

  describe('groupMetricsByDeveloper', () => {
    it('should group metrics by developer ID', () => {
      const metrics = transformer.transformSnapshotToMetrics(sampleSnapshot);
      const grouped = transformer.groupMetricsByDeveloper(metrics);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('dev-001')).toHaveLength(2); // John Doe has 2 commits
      expect(grouped.get('dev-002')).toHaveLength(1); // Jane Smith has 1 commit
    });

    it('should handle empty metrics array', () => {
      const grouped = transformer.groupMetricsByDeveloper([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('extractDevelopersFromSnapshot', () => {
    it('should extract unique developers from snapshot', () => {
      const developers = transformer.extractDevelopersFromSnapshot(sampleSnapshot);
      
      expect(developers).toHaveLength(2);
      
      expect(developers[0].id).toBe('dev-001');
      expect(developers[0].name).toBe('John Doe');
      expect(developers[0].email).toBe('john.doe@example.com');
      
      expect(developers[1].id).toBe('dev-002');
      expect(developers[1].name).toBe('Jane Smith');
      expect(developers[1].email).toBe('jane.smith@example.com');
    });

    it('should handle empty snapshot', () => {
      const emptySnapshot: SnapshotData = {
        repository: 'test-repo',
        commits: []
      };
      
      const developers = transformer.extractDevelopersFromSnapshot(emptySnapshot);
      expect(developers).toHaveLength(0);
    });

    it('should handle null/undefined snapshot', () => {
      expect(transformer.extractDevelopersFromSnapshot(null as any)).toHaveLength(0);
      expect(transformer.extractDevelopersFromSnapshot(undefined as any)).toHaveLength(0);
    });
  });

  describe('validateAndCleanCommitData', () => {
    it('should filter out invalid commits', () => {
      const invalidCommits: CommitData[] = [
        sampleSnapshot.commits[0], // Valid commit
        {
          hash: '', // Invalid: empty hash
          author: 'Test Author',
          email: 'test@example.com',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 20,
          filesModified: ['file1.ts']
        },
        {
          hash: 'valid123',
          author: 'Test Author',
          email: 'test@example.com',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: -10, // Invalid: negative lines
          linesRemoved: 20,
          filesModified: ['file1.ts']
        },
        sampleSnapshot.commits[1] // Valid commit
      ];
      
      const cleaned = transformer.validateAndCleanCommitData(invalidCommits);
      expect(cleaned).toHaveLength(2); // Only 2 valid commits
    });

    it('should convert string timestamps to Date objects', () => {
      const commitsWithStringDates: CommitData[] = [
        {
          ...sampleSnapshot.commits[0],
          timestamp: '2024-01-01T10:00:00Z' as any
        }
      ];
      
      const cleaned = transformer.validateAndCleanCommitData(commitsWithStringDates);
      expect(cleaned[0].timestamp).toBeInstanceOf(Date);
    });

    it('should filter out empty file names', () => {
      const commitsWithEmptyFiles: CommitData[] = [
        {
          ...sampleSnapshot.commits[0],
          filesModified: ['file1.ts', '', '   ', 'file2.ts']
        }
      ];
      
      const cleaned = transformer.validateAndCleanCommitData(commitsWithEmptyFiles);
      expect(cleaned[0].filesModified).toEqual(['file1.ts', 'file2.ts']);
    });

    it('should handle invalid timestamp formats', () => {
      const commitsWithInvalidDates: CommitData[] = [
        {
          ...sampleSnapshot.commits[0],
          timestamp: 'invalid-date' as any
        }
      ];
      
      const cleaned = transformer.validateAndCleanCommitData(commitsWithInvalidDates);
      expect(cleaned).toHaveLength(0);
    });
  });
});