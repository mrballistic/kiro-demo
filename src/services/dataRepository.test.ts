import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSONDataRepository } from './dataRepository.js';
import type { SnapshotData, DateRange, Developer, CodeMetric } from '../types/index.js';
import { StorageUtils } from './storageUtils.js';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Also mock window.localStorage for browser compatibility
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('JSONDataRepository Integration Tests', () => {
  let repository: JSONDataRepository;

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorageMock.clear();
    repository = new JSONDataRepository();
    // Reset any mocks
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDevelopers', () => {
    it('should return empty array when no developers exist', async () => {
      const developers = await repository.getDevelopers();
      expect(developers).toEqual([]);
    });

    it('should return all developers from storage', async () => {
      // Setup test data
      const testDevelopers: Developer[] = [
        {
          id: 'dev-001',
          name: 'John Doe',
          email: 'john@example.com',
          metrics: []
        },
        {
          id: 'dev-002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          metrics: []
        }
      ];

      await StorageUtils.saveDevelopers(testDevelopers);

      const developers = await repository.getDevelopers();
      expect(developers).toHaveLength(2);
      expect(developers[0].name).toBe('John Doe');
      expect(developers[1].name).toBe('Jane Smith');
    });

    it('should return deep copies to prevent external modifications', async () => {
      const testDevelopers: Developer[] = [
        {
          id: 'dev-001',
          name: 'John Doe',
          email: 'john@example.com',
          metrics: [
            {
              id: 'metric-001',
              developerId: 'dev-001',
              timestamp: new Date('2024-01-01'),
              linesAdded: 100,
              linesRemoved: 10,
              filesModified: 2
            }
          ]
        }
      ];

      await StorageUtils.saveDevelopers(testDevelopers);

      const developers = await repository.getDevelopers();
      const originalMetricsLength = developers[0].metrics.length;

      // Modify the returned data
      developers[0].name = 'Modified Name';
      developers[0].metrics.push({
        id: 'new-metric',
        developerId: 'dev-001',
        timestamp: new Date(),
        linesAdded: 50,
        linesRemoved: 5,
        filesModified: 1
      });

      // Get fresh data and verify it wasn't modified
      const freshDevelopers = await repository.getDevelopers();
      expect(freshDevelopers[0].name).toBe('John Doe');
      expect(freshDevelopers[0].metrics).toHaveLength(originalMetricsLength);
    });

    it('should handle storage errors gracefully', async () => {
      // Mock StorageUtils to throw an error
      vi.spyOn(StorageUtils, 'loadCompleteDataset').mockRejectedValue(new Error('Storage error'));

      await expect(repository.getDevelopers()).rejects.toThrow('Unable to retrieve developers');
    });
  });

  describe('getDeveloper', () => {
    beforeEach(async () => {
      const testDevelopers: Developer[] = [
        {
          id: 'dev-001',
          name: 'John Doe',
          email: 'john@example.com',
          metrics: [
            {
              id: 'metric-001',
              developerId: 'dev-001',
              timestamp: new Date('2024-01-01'),
              linesAdded: 100,
              linesRemoved: 10,
              filesModified: 2
            }
          ]
        }
      ];

      await StorageUtils.saveDevelopers(testDevelopers);
    });

    it('should return developer by ID', async () => {
      const developer = await repository.getDeveloper('dev-001');
      
      expect(developer).not.toBeNull();
      expect(developer!.name).toBe('John Doe');
      expect(developer!.email).toBe('john@example.com');
      expect(developer!.metrics).toHaveLength(1);
    });

    it('should return null for non-existent developer', async () => {
      const developer = await repository.getDeveloper('non-existent');
      expect(developer).toBeNull();
    });

    it('should validate developer ID parameter', async () => {
      await expect(repository.getDeveloper('')).rejects.toThrow('Developer ID must be a non-empty string');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(repository.getDeveloper(null as any)).rejects.toThrow('Developer ID must be a non-empty string');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(repository.getDeveloper(123 as any)).rejects.toThrow('Developer ID must be a non-empty string');
    });

    it('should return deep copy to prevent external modifications', async () => {
      const developer = await repository.getDeveloper('dev-001');
      const originalMetricsLength = developer!.metrics.length;

      // Modify the returned data
      developer!.name = 'Modified Name';
      developer!.metrics.push({
        id: 'new-metric',
        developerId: 'dev-001',
        timestamp: new Date(),
        linesAdded: 50,
        linesRemoved: 5,
        filesModified: 1
      });

      // Get fresh data and verify it wasn't modified
      const freshDeveloper = await repository.getDeveloper('dev-001');
      expect(freshDeveloper!.name).toBe('John Doe');
      expect(freshDeveloper!.metrics).toHaveLength(originalMetricsLength);
    });
  });

  describe('getMetrics', () => {
    beforeEach(async () => {
      const testMetrics: CodeMetric[] = [
        {
          id: 'metric-001',
          developerId: 'dev-001',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 10,
          filesModified: 2,
          commitHash: 'abc123',
          repository: 'test-repo'
        },
        {
          id: 'metric-002',
          developerId: 'dev-001',
          timestamp: new Date('2024-01-02T10:00:00Z'),
          linesAdded: 50,
          linesRemoved: 5,
          filesModified: 1,
          commitHash: 'def456',
          repository: 'test-repo'
        },
        {
          id: 'metric-003',
          developerId: 'dev-002',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 75,
          linesRemoved: 15,
          filesModified: 3,
          commitHash: 'ghi789',
          repository: 'test-repo'
        }
      ];

      await StorageUtils.saveMetrics(testMetrics);
    });

    it('should return metrics for specific developer', async () => {
      const metrics = await repository.getMetrics('dev-001');
      
      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('metric-001');
      expect(metrics[1].id).toBe('metric-002');
    });

    it('should return empty array for non-existent developer', async () => {
      const metrics = await repository.getMetrics('non-existent');
      expect(metrics).toEqual([]);
    });

    it('should sort metrics by timestamp (oldest first)', async () => {
      const metrics = await repository.getMetrics('dev-001');
      
      expect(metrics[0].timestamp.getTime()).toBeLessThan(metrics[1].timestamp.getTime());
    });

    it('should filter metrics by date range', async () => {
      const dateRange: DateRange = {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-01T23:59:59Z')
      };

      const metrics = await repository.getMetrics('dev-001', dateRange);
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].id).toBe('metric-001');
    });

    it('should validate developer ID parameter', async () => {
      await expect(repository.getMetrics('')).rejects.toThrow('Developer ID must be a non-empty string');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(repository.getMetrics(null as any)).rejects.toThrow('Developer ID must be a non-empty string');
    });

    it('should validate date range parameters', async () => {
      const invalidDateRange = {
        start: new Date('2024-01-02'),
        end: new Date('2024-01-01') // end before start
      };

      await expect(repository.getMetrics('dev-001', invalidDateRange)).rejects.toThrow('Invalid date range');
    });

    it('should return deep copies to prevent external modifications', async () => {
      const metrics = await repository.getMetrics('dev-001');
      const originalTimestamp = metrics[0].timestamp.getTime();

      // Modify the returned data
      metrics[0].linesAdded = 999;
      metrics[0].timestamp = new Date('2025-01-01');

      // Get fresh data and verify it wasn't modified
      const freshMetrics = await repository.getMetrics('dev-001');
      expect(freshMetrics[0].linesAdded).toBe(100);
      expect(freshMetrics[0].timestamp.getTime()).toBe(originalTimestamp);
    });
  });

  describe('importSnapshot', () => {
    it('should import valid snapshot data', async () => {
      const snapshotData: SnapshotData = {
        repository: 'test-repo',
        commits: [
          {
            hash: 'abc123def456',
            author: 'John Doe',
            email: 'john@example.com',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            linesAdded: 100,
            linesRemoved: 10,
            filesModified: ['file1.ts', 'file2.ts']
          },
          {
            hash: 'def456ghi789',
            author: 'Jane Smith',
            email: 'jane@example.com',
            timestamp: new Date('2024-01-02T10:00:00Z'),
            linesAdded: 50,
            linesRemoved: 5,
            filesModified: ['file3.ts']
          }
        ]
      };

      await repository.importSnapshot(snapshotData);

      const developers = await repository.getDevelopers();
      // Verify data was imported by checking storage directly

      expect(developers.length).toBeGreaterThan(0);
      const storageData = await StorageUtils.loadCompleteDataset();
      expect(storageData.developers.length).toBe(2);
      expect(storageData.metrics.length).toBe(2);
    });

    it('should reject invalid snapshot data', async () => {
      const invalidSnapshot = {
        repository: '', // Invalid: empty repository
        commits: []
      };

      await expect(repository.importSnapshot(invalidSnapshot as SnapshotData))
        .rejects.toThrow('Invalid snapshot data');
    });

    it('should merge with existing data without duplicates', async () => {
      // First import
      const firstSnapshot: SnapshotData = {
        repository: 'test-repo',
        commits: [
          {
            hash: 'abc123',
            author: 'John Doe',
            email: 'john@example.com',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            linesAdded: 100,
            linesRemoved: 10,
            filesModified: ['file1.ts']
          }
        ]
      };

      await repository.importSnapshot(firstSnapshot);

      // Second import with same commit (should not duplicate)
      const secondSnapshot: SnapshotData = {
        repository: 'test-repo',
        commits: [
          {
            hash: 'abc123', // Same hash
            author: 'John Doe',
            email: 'john@example.com',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            linesAdded: 100,
            linesRemoved: 10,
            filesModified: ['file1.ts']
          },
          {
            hash: 'def456', // New commit
            author: 'John Doe',
            email: 'john@example.com',
            timestamp: new Date('2024-01-02T10:00:00Z'),
            linesAdded: 50,
            linesRemoved: 5,
            filesModified: ['file2.ts']
          }
        ]
      };

      await repository.importSnapshot(secondSnapshot);

      const storageData = await StorageUtils.loadCompleteDataset();
      expect(storageData.developers.length).toBe(1); // Same developer
      expect(storageData.metrics.length).toBe(2); // One duplicate filtered out, one new added
    });

    it('should handle malformed commit data gracefully', async () => {
      const malformedSnapshot = {
        repository: 'test-repo',
        commits: [
          {
            hash: 'abc123',
            author: 'John Doe',
            email: 'invalid-email', // Invalid email format
            timestamp: 'invalid-date', // Invalid date
            linesAdded: -10, // Invalid negative value
            linesRemoved: 5,
            filesModified: ['file1.ts']
          }
        ]
      };

      await expect(repository.importSnapshot(malformedSnapshot as SnapshotData))
        .rejects.toThrow('Invalid snapshot data');
    });
  });

  describe('initializeWithDummyData', () => {
    it('should initialize with dummy data when no data exists', async () => {
      await repository.initializeWithDummyData();

      const developers = await repository.getDevelopers();
      const isDummy = await repository.isDummyData();

      expect(developers.length).toBeGreaterThan(0);
      expect(isDummy).toBe(true);
    });

    it('should not overwrite existing data', async () => {
      // Add some existing data
      const existingDevelopers: Developer[] = [
        {
          id: 'existing-dev',
          name: 'Existing Developer',
          email: 'existing@example.com',
          metrics: []
        }
      ];

      await StorageUtils.saveDevelopers(existingDevelopers);

      await repository.initializeWithDummyData();

      const developers = await repository.getDevelopers();
      expect(developers).toHaveLength(1);
      expect(developers[0].name).toBe('Existing Developer');
    });
  });

  describe('clearAllData', () => {
    it('should clear all data from storage', async () => {
      // Add some data first
      await repository.initializeWithDummyData();
      
      let developers = await repository.getDevelopers();
      expect(developers.length).toBeGreaterThan(0);

      // Clear data
      await repository.clearAllData();

      developers = await repository.getDevelopers();
      expect(developers).toEqual([]);
    });
  });

  describe('exportData', () => {
    it('should export data in JSON format', async () => {
      await repository.initializeWithDummyData();

      const exportedData = await repository.exportData();
      const parsed = JSON.parse(exportedData);

      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('exportDate');
      expect(parsed).toHaveProperty('developers');
      expect(parsed).toHaveProperty('metrics');
      expect(Array.isArray(parsed.developers)).toBe(true);
      expect(Array.isArray(parsed.metrics)).toBe(true);
    });

    it('should export empty data when no data exists', async () => {
      const exportedData = await repository.exportData();
      const parsed = JSON.parse(exportedData);

      expect(parsed.developers).toEqual([]);
      expect(parsed.metrics).toEqual([]);
    });
  });

  describe('caching behavior', () => {
    it('should cache data and reuse it for subsequent calls', async () => {
      const loadSpy = vi.spyOn(StorageUtils, 'loadCompleteDataset');
      
      // First call should load data
      await repository.getDevelopers();
      expect(loadSpy).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await repository.getDevelopers();
      expect(loadSpy).toHaveBeenCalledTimes(1);

      // Third call should also use cache
      await repository.getDeveloper('any-id');
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after data modifications', async () => {
      const loadSpy = vi.spyOn(StorageUtils, 'loadCompleteDataset');
      
      // Load initial data
      await repository.getDevelopers();
      expect(loadSpy).toHaveBeenCalledTimes(1);

      // Import new data (should invalidate cache)
      const snapshotData: SnapshotData = {
        repository: 'test-repo',
        commits: [
          {
            hash: 'abc123',
            author: 'John Doe',
            email: 'john@example.com',
            timestamp: new Date('2024-01-01'),
            linesAdded: 100,
            linesRemoved: 10,
            filesModified: ['file1.ts']
          }
        ]
      };

      await repository.importSnapshot(snapshotData);

      // Next call should reload data
      await repository.getDevelopers();
      expect(loadSpy).toHaveBeenCalledTimes(3); // Initial load + load for import + load after cache invalidation
    });
  });

  describe('error handling', () => {
    it('should handle storage failures gracefully', async () => {
      vi.spyOn(StorageUtils, 'loadCompleteDataset').mockRejectedValue(new Error('Storage failure'));

      await expect(repository.getDevelopers()).rejects.toThrow('Unable to retrieve developers');
    });

    it('should handle import failures gracefully', async () => {
      vi.spyOn(StorageUtils, 'saveCompleteDataset').mockRejectedValue(new Error('Save failure'));

      const snapshotData: SnapshotData = {
        repository: 'test-repo',
        commits: [
          {
            hash: 'abc123',
            author: 'John Doe',
            email: 'john@example.com',
            timestamp: new Date('2024-01-01'),
            linesAdded: 100,
            linesRemoved: 10,
            filesModified: ['file1.ts']
          }
        ]
      };

      await expect(repository.importSnapshot(snapshotData)).rejects.toThrow('Import failed');
    });
  });
});