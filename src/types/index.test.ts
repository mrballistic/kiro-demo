import { describe, it, expect } from 'vitest';
import {
  isDeveloper,
  isCodeMetric,
  isMetricsSummary,
  isSnapshotData,
  isCommitData,
  isDateRange,
  Developer,
  CodeMetric,
  MetricsSummary,
  SnapshotData,
  CommitData,
  DateRange
} from './index';

describe('Type Validation Functions', () => {
  describe('isDeveloper', () => {
    it('should return true for valid Developer object', () => {
      const validDeveloper: Developer = {
        id: 'dev-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        metrics: []
      };
      
      expect(isDeveloper(validDeveloper)).toBe(true);
    });

    it('should return true for Developer with valid metrics', () => {
      const validMetric: CodeMetric = {
        id: 'metric-001',
        developerId: 'dev-001',
        timestamp: new Date(),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: 3
      };

      const developerWithMetrics: Developer = {
        id: 'dev-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        metrics: [validMetric]
      };
      
      expect(isDeveloper(developerWithMetrics)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isDeveloper(null)).toBe(false);
      expect(isDeveloper(undefined)).toBe(false);
    });

    it('should return false for object missing required fields', () => {
      expect(isDeveloper({ id: 'dev-001' })).toBe(false);
      expect(isDeveloper({ id: 'dev-001', name: 'John' })).toBe(false);
      expect(isDeveloper({ id: 'dev-001', name: 'John', email: 'john@example.com' })).toBe(false);
    });

    it('should return false for object with invalid field types', () => {
      expect(isDeveloper({
        id: 123,
        name: 'John',
        email: 'john@example.com',
        metrics: []
      })).toBe(false);

      expect(isDeveloper({
        id: 'dev-001',
        name: 'John',
        email: 'john@example.com',
        metrics: 'not-an-array'
      })).toBe(false);
    });
  });

  describe('isCodeMetric', () => {
    it('should return true for valid CodeMetric object', () => {
      const validMetric: CodeMetric = {
        id: 'metric-001',
        developerId: 'dev-001',
        timestamp: new Date(),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: 3
      };
      
      expect(isCodeMetric(validMetric)).toBe(true);
    });

    it('should return true for CodeMetric with optional fields', () => {
      const metricWithOptionals: CodeMetric = {
        id: 'metric-001',
        developerId: 'dev-001',
        timestamp: new Date(),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: 3,
        commitHash: 'abc123',
        repository: 'test-repo'
      };
      
      expect(isCodeMetric(metricWithOptionals)).toBe(true);
    });

    it('should return true for CodeMetric with string timestamp', () => {
      const metricWithStringDate = {
        id: 'metric-001',
        developerId: 'dev-001',
        timestamp: '2024-01-15T10:30:00Z',
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: 3
      };
      
      expect(isCodeMetric(metricWithStringDate)).toBe(true);
    });

    it('should return false for invalid CodeMetric objects', () => {
      expect(isCodeMetric(null)).toBe(false);
      expect(isCodeMetric({})).toBe(false);
      expect(isCodeMetric({
        id: 'metric-001',
        developerId: 'dev-001',
        timestamp: new Date(),
        linesAdded: 'not-a-number',
        linesRemoved: 20,
        filesModified: 3
      })).toBe(false);
    });
  });

  describe('isMetricsSummary', () => {
    it('should return true for valid MetricsSummary object', () => {
      const validSummary: MetricsSummary = {
        totalLinesAdded: 1000,
        totalLinesRemoved: 200,
        totalFiles: 50,
        linesPerFileRatio: 20.0,
        netLinesChanged: 800,
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };
      
      expect(isMetricsSummary(validSummary)).toBe(true);
    });

    it('should return true for MetricsSummary with string dates', () => {
      const summaryWithStringDates = {
        totalLinesAdded: 1000,
        totalLinesRemoved: 200,
        totalFiles: 50,
        linesPerFileRatio: 20.0,
        netLinesChanged: 800,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };
      
      expect(isMetricsSummary(summaryWithStringDates)).toBe(true);
    });

    it('should return false for invalid MetricsSummary objects', () => {
      expect(isMetricsSummary(null)).toBe(false);
      expect(isMetricsSummary({})).toBe(false);
      expect(isMetricsSummary({
        totalLinesAdded: 1000,
        totalLinesRemoved: 200,
        totalFiles: 50,
        linesPerFileRatio: 20.0,
        netLinesChanged: 800
        // missing timeRange
      })).toBe(false);
    });
  });

  describe('isSnapshotData', () => {
    it('should return true for valid SnapshotData object', () => {
      const validCommit: CommitData = {
        hash: 'abc123',
        author: 'John Doe',
        email: 'john@example.com',
        timestamp: new Date(),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: ['file1.ts', 'file2.ts']
      };

      const validSnapshot: SnapshotData = {
        repository: 'test-repo',
        commits: [validCommit]
      };
      
      expect(isSnapshotData(validSnapshot)).toBe(true);
    });

    it('should return true for SnapshotData with empty commits', () => {
      const emptySnapshot: SnapshotData = {
        repository: 'test-repo',
        commits: []
      };
      
      expect(isSnapshotData(emptySnapshot)).toBe(true);
    });

    it('should return false for invalid SnapshotData objects', () => {
      expect(isSnapshotData(null)).toBe(false);
      expect(isSnapshotData({})).toBe(false);
      expect(isSnapshotData({
        repository: 'test-repo',
        commits: 'not-an-array'
      })).toBe(false);
    });
  });

  describe('isCommitData', () => {
    it('should return true for valid CommitData object', () => {
      const validCommit: CommitData = {
        hash: 'abc123',
        author: 'John Doe',
        email: 'john@example.com',
        timestamp: new Date(),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: ['file1.ts', 'file2.ts']
      };
      
      expect(isCommitData(validCommit)).toBe(true);
    });

    it('should return true for CommitData with string timestamp', () => {
      const commitWithStringDate = {
        hash: 'abc123',
        author: 'John Doe',
        email: 'john@example.com',
        timestamp: '2024-01-15T10:30:00Z',
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: ['file1.ts', 'file2.ts']
      };
      
      expect(isCommitData(commitWithStringDate)).toBe(true);
    });

    it('should return false for invalid CommitData objects', () => {
      expect(isCommitData(null)).toBe(false);
      expect(isCommitData({})).toBe(false);
      expect(isCommitData({
        hash: 'abc123',
        author: 'John Doe',
        email: 'john@example.com',
        timestamp: new Date(),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: 'not-an-array'
      })).toBe(false);
    });
  });

  describe('isDateRange', () => {
    it('should return true for valid DateRange object', () => {
      const validRange: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };
      
      expect(isDateRange(validRange)).toBe(true);
    });

    it('should return true for DateRange with string dates', () => {
      const rangeWithStringDates = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z'
      };
      
      expect(isDateRange(rangeWithStringDates)).toBe(true);
    });

    it('should return false for invalid DateRange objects', () => {
      expect(isDateRange(null)).toBe(false);
      expect(isDateRange({})).toBe(false);
      expect(isDateRange({
        start: new Date('2024-01-01')
        // missing end
      })).toBe(false);
      expect(isDateRange({
        start: 'invalid-date',
        end: new Date('2024-01-31')
      })).toBe(false);
    });
  });
});