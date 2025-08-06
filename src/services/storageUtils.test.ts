import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageUtils, DataValidator } from './storageUtils';
import { Developer, CodeMetric, SnapshotData } from '../types/index.js';

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
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('StorageUtils', () => {
  const mockDevelopers: Developer[] = [
    {
      id: 'dev-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      metrics: []
    },
    {
      id: 'dev-002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      metrics: []
    }
  ];

  const mockMetrics: CodeMetric[] = [
    {
      id: 'metric-001',
      developerId: 'dev-001',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      linesAdded: 150,
      linesRemoved: 25,
      filesModified: 3,
      commitHash: 'abc123def456',
      repository: 'test-repo'
    },
    {
      id: 'metric-002',
      developerId: 'dev-002',
      timestamp: new Date('2024-01-16T14:20:00Z'),
      linesAdded: 75,
      linesRemoved: 10,
      filesModified: 2,
      commitHash: 'def456ghi789',
      repository: 'test-repo'
    }
  ];

  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('saveDevelopers and loadDevelopers', () => {
    it('should save and load developers correctly', async () => {
      await StorageUtils.saveDevelopers(mockDevelopers);
      const loadedDevelopers = await StorageUtils.loadDevelopers();
      
      expect(loadedDevelopers).toEqual(mockDevelopers);
    });

    it('should return empty array when no developers are stored', async () => {
      const developers = await StorageUtils.loadDevelopers();
      expect(developers).toEqual([]);
    });

    it('should handle corrupted developer data gracefully', async () => {
      localStorageMock.setItem('cgt_developers', 'invalid json');
      const developers = await StorageUtils.loadDevelopers();
      expect(developers).toEqual([]);
    });

    it('should filter out invalid developers', async () => {
      const invalidData = [
        mockDevelopers[0],
        { id: 'invalid', name: 123 }, // Invalid developer
        mockDevelopers[1]
      ];
      
      localStorageMock.setItem('cgt_developers', JSON.stringify(invalidData));
      const developers = await StorageUtils.loadDevelopers();
      
      expect(developers).toHaveLength(2);
      expect(developers[0]).toEqual(mockDevelopers[0]);
      expect(developers[1]).toEqual(mockDevelopers[1]);
    });

    it('should throw error when saving fails', async () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      await expect(StorageUtils.saveDevelopers(mockDevelopers))
        .rejects.toThrow('Failed to save developers: Storage full');

      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('saveMetrics and loadMetrics', () => {
    it('should save and load metrics correctly', async () => {
      await StorageUtils.saveMetrics(mockMetrics);
      const loadedMetrics = await StorageUtils.loadMetrics();
      
      expect(loadedMetrics).toEqual(mockMetrics);
    });

    it('should preserve Date objects in metrics', async () => {
      await StorageUtils.saveMetrics(mockMetrics);
      const loadedMetrics = await StorageUtils.loadMetrics();
      
      loadedMetrics.forEach((metric, index) => {
        expect(metric.timestamp).toBeInstanceOf(Date);
        expect(metric.timestamp.getTime()).toBe(mockMetrics[index].timestamp.getTime());
      });
    });

    it('should return empty array when no metrics are stored', async () => {
      const metrics = await StorageUtils.loadMetrics();
      expect(metrics).toEqual([]);
    });

    it('should handle corrupted metrics data gracefully', async () => {
      localStorageMock.setItem('cgt_metrics', 'invalid json');
      const metrics = await StorageUtils.loadMetrics();
      expect(metrics).toEqual([]);
    });

    it('should filter out invalid metrics', async () => {
      const invalidData = [
        mockMetrics[0],
        { id: 'invalid', developerId: 123 }, // Invalid metric
        mockMetrics[1]
      ];
      
      localStorageMock.setItem('cgt_metrics', JSON.stringify(invalidData, StorageUtils['dateReplacer']));
      const metrics = await StorageUtils.loadMetrics();
      
      expect(metrics).toHaveLength(2);
      expect(metrics[0]).toEqual(mockMetrics[0]);
      expect(metrics[1]).toEqual(mockMetrics[1]);
    });
  });

  describe('saveCompleteDataset and loadCompleteDataset', () => {
    it('should save and load complete dataset', async () => {
      await StorageUtils.saveCompleteDataset(mockDevelopers, mockMetrics, true);
      const { developers, metrics, isDummyData } = await StorageUtils.loadCompleteDataset();
      
      expect(developers).toEqual(mockDevelopers);
      expect(metrics).toEqual(mockMetrics);
      expect(isDummyData).toBe(true);
    });

    it('should default isDummyData to false', async () => {
      await StorageUtils.saveCompleteDataset(mockDevelopers, mockMetrics);
      const { isDummyData } = await StorageUtils.loadCompleteDataset();
      
      expect(isDummyData).toBe(false);
    });
  });

  describe('exportToJSON and importFromJSON', () => {
    it('should export data to JSON string', () => {
      const jsonString = StorageUtils.exportToJSON(mockDevelopers, mockMetrics);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.version).toBe('1.0');
      expect(parsed.exportDate).toBeTruthy();
      expect(parsed.developers).toHaveLength(mockDevelopers.length);
      expect(parsed.metrics).toHaveLength(mockMetrics.length);
      
      // Verify the JSON string is valid and contains expected data
      expect(jsonString).toContain('"version": "1.0"');
      expect(jsonString).toContain(mockDevelopers[0].name);
      expect(jsonString).toContain(mockMetrics[0].id);
      
      // The export should be parseable and importable
      const { developers, metrics } = StorageUtils.importFromJSON(jsonString);
      expect(developers).toHaveLength(mockDevelopers.length);
      expect(metrics).toHaveLength(mockMetrics.length);
    });

    it('should import data from JSON string', () => {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        developers: mockDevelopers,
        metrics: mockMetrics
      };
      
      const jsonString = JSON.stringify(exportData, StorageUtils['dateReplacer']);
      const { developers, metrics } = StorageUtils.importFromJSON(jsonString);
      
      expect(developers).toEqual(mockDevelopers);
      expect(metrics).toEqual(mockMetrics);
    });

    it('should handle import with missing developers array', () => {
      const exportData = {
        version: '1.0',
        metrics: mockMetrics
      };
      
      const jsonString = JSON.stringify(exportData);
      const { developers, metrics } = StorageUtils.importFromJSON(jsonString);
      
      expect(developers).toEqual([]);
      expect(metrics).toEqual(mockMetrics);
    });

    it('should handle import with missing metrics array', () => {
      const exportData = {
        version: '1.0',
        developers: mockDevelopers
      };
      
      const jsonString = JSON.stringify(exportData);
      const { developers, metrics } = StorageUtils.importFromJSON(jsonString);
      
      expect(developers).toEqual(mockDevelopers);
      expect(metrics).toEqual([]);
    });

    it('should filter out invalid data during import', () => {
      const exportData = {
        version: '1.0',
        developers: [mockDevelopers[0], { invalid: 'developer' }],
        metrics: [mockMetrics[0], { invalid: 'metric' }]
      };
      
      const jsonString = JSON.stringify(exportData);
      const { developers, metrics } = StorageUtils.importFromJSON(jsonString);
      
      expect(developers).toHaveLength(1);
      expect(metrics).toHaveLength(1);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => StorageUtils.importFromJSON('invalid json'))
        .toThrow('Failed to import JSON data');
    });

    it('should throw error for non-object JSON', () => {
      expect(() => StorageUtils.importFromJSON('"just a string"'))
        .toThrow('Failed to import JSON data: Invalid JSON format: expected object');
    });
  });

  describe('clearAllData', () => {
    it('should clear all stored data', async () => {
      await StorageUtils.saveCompleteDataset(mockDevelopers, mockMetrics, true);
      
      // Verify data is stored
      expect(localStorageMock.getItem('cgt_developers')).toBeTruthy();
      expect(localStorageMock.getItem('cgt_metrics')).toBeTruthy();
      expect(localStorageMock.getItem('cgt_is_dummy_data')).toBeTruthy();
      
      await StorageUtils.clearAllData();
      
      // Verify data is cleared
      expect(localStorageMock.getItem('cgt_developers')).toBeNull();
      expect(localStorageMock.getItem('cgt_metrics')).toBeNull();
      expect(localStorageMock.getItem('cgt_is_dummy_data')).toBeNull();
    });
  });

  describe('dummy data flag', () => {
    it('should set and check dummy data flag', async () => {
      await StorageUtils.setDummyDataFlag(true);
      expect(await StorageUtils.isDummyData()).toBe(true);
      
      await StorageUtils.setDummyDataFlag(false);
      expect(await StorageUtils.isDummyData()).toBe(false);
    });

    it('should return false for missing dummy data flag', async () => {
      expect(await StorageUtils.isDummyData()).toBe(false);
    });

    it('should handle corrupted dummy data flag', async () => {
      localStorageMock.setItem('cgt_is_dummy_data', 'invalid json');
      expect(await StorageUtils.isDummyData()).toBe(false);
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', () => {
      const info = StorageUtils.getStorageInfo();
      
      expect(typeof info.used).toBe('number');
      expect(typeof info.available).toBe('number');
      expect(typeof info.percentage).toBe('number');
      expect(info.used).toBeGreaterThanOrEqual(0);
      expect(info.available).toBeGreaterThanOrEqual(0);
      expect(info.percentage).toBeGreaterThanOrEqual(0);
      expect(info.percentage).toBeLessThanOrEqual(100);
    });

    it('should calculate usage correctly', async () => {
      const infoBefore = StorageUtils.getStorageInfo();
      
      await StorageUtils.saveCompleteDataset(mockDevelopers, mockMetrics);
      
      const infoAfter = StorageUtils.getStorageInfo();
      expect(infoAfter.used).toBeGreaterThan(infoBefore.used);
    });
  });
});

describe('DataValidator', () => {
  const validSnapshotData: SnapshotData = {
    repository: 'test-repo',
    commits: [
      {
        hash: 'abc123def456ghi789jkl012mno345pqr678stu901',
        author: 'John Doe',
        email: 'john.doe@example.com',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        linesAdded: 150,
        linesRemoved: 25,
        filesModified: ['file1.ts', 'file2.ts', 'file3.ts']
      },
      {
        hash: 'def456ghi789jkl012mno345pqr678stu901vwx234',
        author: 'Jane Smith',
        email: 'jane.smith@example.com',
        timestamp: new Date('2024-01-16T14:20:00Z'),
        linesAdded: 75,
        linesRemoved: 10,
        filesModified: ['file4.js', 'file5.js']
      }
    ]
  };

  describe('validateSnapshotData', () => {
    it('should validate correct snapshot data', () => {
      const result = DataValidator.validateSnapshotData(validSnapshotData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid snapshot structure', () => {
      const result = DataValidator.validateSnapshotData({ invalid: 'data' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid snapshot data structure');
    });

    it('should reject empty repository name', () => {
      const invalidData = { ...validSnapshotData, repository: '' };
      const result = DataValidator.validateSnapshotData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Repository name is required and cannot be empty');
    });

    it('should reject empty commits array', () => {
      const invalidData = { ...validSnapshotData, commits: [] };
      const result = DataValidator.validateSnapshotData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Commits array is required and cannot be empty');
    });

    it('should warn about duplicate commit hashes', () => {
      const invalidData = {
        ...validSnapshotData,
        commits: [
          validSnapshotData.commits[0],
          { ...validSnapshotData.commits[1], hash: validSnapshotData.commits[0].hash }
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.warnings).toContain('Duplicate commit hashes found in data');
    });

    it('should warn about data spanning more than a year', () => {
      const oldDate = new Date('2022-01-01T00:00:00Z'); // Fixed old date
      const newDate = new Date('2024-01-01T00:00:00Z'); // Fixed new date
      
      const invalidData = {
        ...validSnapshotData,
        commits: [
          { ...validSnapshotData.commits[0], timestamp: oldDate },
          { ...validSnapshotData.commits[1], timestamp: newDate }
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.warnings.some(w => w.includes('more than a year'))).toBe(true);
    });

    it('should validate individual commit data', () => {
      const invalidData = {
        ...validSnapshotData,
        commits: [
          { ...validSnapshotData.commits[0], hash: '' }, // Invalid hash
          { ...validSnapshotData.commits[1], linesAdded: -5 } // Invalid lines added
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('hash is required'))).toBe(true);
      expect(result.errors.some(e => e.includes('linesAdded must be a non-negative number'))).toBe(true);
    });

    it('should warn about short commit hashes', () => {
      const invalidData = {
        ...validSnapshotData,
        commits: [
          { ...validSnapshotData.commits[0], hash: 'abc123' } // Short hash
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.warnings.some(w => w.includes('hash seems too short'))).toBe(true);
    });

    it('should warn about invalid email formats', () => {
      const invalidData = {
        ...validSnapshotData,
        commits: [
          { ...validSnapshotData.commits[0], email: 'invalid-email' }
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.warnings.some(w => w.includes('email format appears invalid'))).toBe(true);
    });

    it('should warn about future timestamps', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const invalidData = {
        ...validSnapshotData,
        commits: [
          { ...validSnapshotData.commits[0], timestamp: futureDate }
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.warnings.some(w => w.includes('timestamp is in the future'))).toBe(true);
    });

    it('should warn about very high line counts', () => {
      const invalidData = {
        ...validSnapshotData,
        commits: [
          { ...validSnapshotData.commits[0], linesAdded: 15000, linesRemoved: 12000 }
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.warnings.some(w => w.includes('linesAdded is very high'))).toBe(true);
      expect(result.warnings.some(w => w.includes('linesRemoved is very high'))).toBe(true);
    });

    it('should warn about high file modification counts', () => {
      const manyFiles = Array.from({ length: 150 }, (_, i) => `file${i}.ts`);
      const invalidData = {
        ...validSnapshotData,
        commits: [
          { ...validSnapshotData.commits[0], filesModified: manyFiles }
        ]
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.warnings.some(w => w.includes('very high number of files modified'))).toBe(true);
    });

    it('should handle non-object commit data', () => {
      const invalidData = {
        ...validSnapshotData,
        commits: ['invalid', 'commit', 'data']
      };
      
      const result = DataValidator.validateSnapshotData(invalidData);
      expect(result.isValid).toBe(false);
      // The error should come from the basic structure validation since strings aren't valid commits
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});