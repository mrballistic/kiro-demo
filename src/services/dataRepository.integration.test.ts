import { describe, it, expect, beforeEach } from 'vitest';
import { JSONDataRepository } from './dataRepository.js';
import { dummyDataGenerator } from './dummyDataGenerator.js';
import type { SnapshotData } from '../types/index.js';

// Mock localStorage for integration tests
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

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('DataRepository Integration Tests', () => {
  let repository: JSONDataRepository;

  beforeEach(() => {
    localStorageMock.clear();
    repository = new JSONDataRepository();
  });

  it('should work with dummy data generator', async () => {
    // Initialize with dummy data
    await repository.initializeWithDummyData();

    // Verify data was created
    const developers = await repository.getDevelopers();
    expect(developers.length).toBeGreaterThan(0);

    // Verify each developer has metrics
    for (const developer of developers) {
      expect(developer.metrics.length).toBeGreaterThan(0);

      // Verify we can get metrics for this developer
      const metrics = await repository.getMetrics(developer.id);
      expect(metrics.length).toBe(developer.metrics.length);
    }

    // Verify dummy data flag is set
    const isDummy = await repository.isDummyData();
    expect(isDummy).toBe(true);
  });

  it('should work with snapshot data from dummy generator', async () => {
    // Generate snapshot data
    const snapshotData: SnapshotData = dummyDataGenerator.generateSnapshotData();

    // Import the snapshot
    await repository.importSnapshot(snapshotData);

    // Verify data was imported
    const developers = await repository.getDevelopers();
    expect(developers.length).toBeGreaterThan(0);

    // Verify metrics exist
    let totalMetrics = 0;
    for (const developer of developers) {
      const metrics = await repository.getMetrics(developer.id);
      totalMetrics += metrics.length;
    }
    expect(totalMetrics).toBeGreaterThan(0);

    // Verify dummy data flag is not set (since we imported real snapshot data)
    const isDummy = await repository.isDummyData();
    expect(isDummy).toBe(false);
  });

  it('should handle date range filtering correctly', async () => {
    await repository.initializeWithDummyData();
    const developers = await repository.getDevelopers();
    const developer = developers[0];

    // Get all metrics
    const allMetrics = await repository.getMetrics(developer.id);
    expect(allMetrics.length).toBeGreaterThan(0);

    // Sort metrics by timestamp to get date range
    const sortedMetrics = allMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstDate = sortedMetrics[0].timestamp;
    const lastDate = sortedMetrics[sortedMetrics.length - 1].timestamp;

    // Test filtering with a narrow date range
    const midDate = new Date((firstDate.getTime() + lastDate.getTime()) / 2);
    const filteredMetrics = await repository.getMetrics(developer.id, {
      start: firstDate,
      end: midDate
    });

    // Should have fewer metrics than total
    expect(filteredMetrics.length).toBeLessThanOrEqual(allMetrics.length);

    // All filtered metrics should be within the date range
    filteredMetrics.forEach(metric => {
      expect(metric.timestamp.getTime()).toBeGreaterThanOrEqual(firstDate.getTime());
      expect(metric.timestamp.getTime()).toBeLessThanOrEqual(midDate.getTime());
    });
  });

  it('should export and import data correctly', async () => {
    // Initialize with dummy data
    await repository.initializeWithDummyData();

    const originalDevelopers = await repository.getDevelopers();
    const originalDeveloperCount = originalDevelopers.length;

    // Export data
    const exportedData = await repository.exportData();
    expect(exportedData).toBeTruthy();

    const parsed = JSON.parse(exportedData);
    expect(parsed.developers).toHaveLength(originalDeveloperCount);
    expect(parsed.metrics.length).toBeGreaterThan(0);

    // Clear data
    await repository.clearAllData();
    const emptyDevelopers = await repository.getDevelopers();
    expect(emptyDevelopers).toHaveLength(0);

    // Import data back (this would typically be done through file upload)
    // For this test, we'll simulate by creating a new snapshot from the exported data
    if (parsed.developers.length > 0 && parsed.metrics.length > 0) {
      // Create a snapshot-like structure from exported data
      const snapshotData: SnapshotData = {
        repository: 'exported-data',
        commits: parsed.metrics.map((metric: {
          commitHash: string;
          timestamp: string;
          linesAdded: number;
          linesRemoved: number;
          developerId: string;
        }) => {
          const developer = parsed.developers.find((d: { id: string; name: string; email: string }) =>
            d.id === metric.developerId
          );
          return {
            hash: metric.commitHash || 'imported-hash',
            author: developer?.name || 'Unknown',
            email: developer?.email || 'unknown@example.com',
            timestamp: new Date(metric.timestamp),
            linesAdded: metric.linesAdded,
            linesRemoved: metric.linesRemoved,
            filesModified: ['imported-file.ts']
          };
        })
      };

      await repository.importSnapshot(snapshotData);

      const restoredDevelopers = await repository.getDevelopers();
      expect(restoredDevelopers.length).toBeGreaterThan(0);
    }
  });

  it('should handle storage info correctly', () => {
    const storageInfo = repository.getStorageInfo();

    expect(storageInfo).toHaveProperty('used');
    expect(storageInfo).toHaveProperty('available');
    expect(storageInfo).toHaveProperty('percentage');

    expect(typeof storageInfo.used).toBe('number');
    expect(typeof storageInfo.available).toBe('number');
    expect(typeof storageInfo.percentage).toBe('number');

    expect(storageInfo.used).toBeGreaterThanOrEqual(0);
    expect(storageInfo.available).toBeGreaterThanOrEqual(0);
    expect(storageInfo.percentage).toBeGreaterThanOrEqual(0);
    expect(storageInfo.percentage).toBeLessThanOrEqual(100);
  });
});