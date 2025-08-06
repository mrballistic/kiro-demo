import { describe, it, expect, beforeEach } from 'vitest';
import { DummyDataGenerator, dummyDataGenerator } from './dummyDataGenerator';
import { isDeveloper, isCodeMetric, isSnapshotData } from '../types/index.js';

describe('DummyDataGenerator', () => {
  let generator: DummyDataGenerator;

  beforeEach(() => {
    generator = new DummyDataGenerator();
  });

  describe('generateDevelopers', () => {
    it('should generate between 5-8 developers', () => {
      const developers = generator.generateDevelopers();
      expect(developers.length).toBeGreaterThanOrEqual(5);
      expect(developers.length).toBeLessThanOrEqual(8);
    });

    it('should generate developers with valid structure', () => {
      const developers = generator.generateDevelopers();
      
      developers.forEach(developer => {
        expect(isDeveloper(developer)).toBe(true);
        expect(developer.id).toMatch(/^dev-\d{3}$/);
        expect(developer.name).toBeTruthy();
        expect(developer.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(Array.isArray(developer.metrics)).toBe(true);
      });
    });

    it('should generate unique developer IDs', () => {
      const developers = generator.generateDevelopers();
      const ids = developers.map(d => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate unique developer emails', () => {
      const developers = generator.generateDevelopers();
      const emails = developers.map(d => d.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(emails.length);
    });
  });

  describe('generateMetricsForDeveloper', () => {
    it('should generate metrics for a developer', () => {
      const developerId = 'dev-001';
      const metrics = generator.generateMetricsForDeveloper(developerId);
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should generate metrics with valid structure', () => {
      const developerId = 'dev-001';
      const metrics = generator.generateMetricsForDeveloper(developerId);
      
      metrics.forEach(metric => {
        expect(isCodeMetric(metric)).toBe(true);
        expect(metric.developerId).toBe(developerId);
        expect(metric.linesAdded).toBeGreaterThanOrEqual(0);
        expect(metric.linesRemoved).toBeGreaterThanOrEqual(0);
        expect(metric.filesModified).toBeGreaterThanOrEqual(1);
        expect(metric.timestamp).toBeInstanceOf(Date);
        expect(metric.commitHash).toMatch(/^[0-9a-f]{40}$/);
      });
    });

    it('should generate metrics spanning 3-6 months', () => {
      const developerId = 'dev-001';
      const metrics = generator.generateMetricsForDeveloper(developerId);
      
      if (metrics.length > 0) {
        const dates = metrics.map(m => m.timestamp).sort((a, b) => a.getTime() - b.getTime());
        const oldestDate = dates[0];
        const newestDate = dates[dates.length - 1];
        const monthsDiff = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        expect(monthsDiff).toBeGreaterThanOrEqual(2); // Allow some flexibility
        expect(monthsDiff).toBeLessThanOrEqual(7); // Allow some flexibility
      }
    });

    it('should not generate metrics for weekends', () => {
      const developerId = 'dev-001';
      const metrics = generator.generateMetricsForDeveloper(developerId);
      
      metrics.forEach(metric => {
        const dayOfWeek = metric.timestamp.getDay();
        expect(dayOfWeek).not.toBe(0); // Not Sunday
        expect(dayOfWeek).not.toBe(6); // Not Saturday
      });
    });

    it('should generate unique metric IDs', () => {
      const developerId = 'dev-001';
      const metrics = generator.generateMetricsForDeveloper(developerId);
      
      const ids = metrics.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('generateCompleteDataset', () => {
    it('should generate complete dataset with developers and metrics', () => {
      const { developers, allMetrics } = generator.generateCompleteDataset();
      
      expect(Array.isArray(developers)).toBe(true);
      expect(Array.isArray(allMetrics)).toBe(true);
      expect(developers.length).toBeGreaterThanOrEqual(5);
      expect(developers.length).toBeLessThanOrEqual(8);
      expect(allMetrics.length).toBeGreaterThan(0);
    });

    it('should populate developer metrics arrays', () => {
      const { developers } = generator.generateCompleteDataset();
      
      developers.forEach(developer => {
        expect(Array.isArray(developer.metrics)).toBe(true);
        expect(developer.metrics.length).toBeGreaterThan(0);
        
        developer.metrics.forEach(metric => {
          expect(metric.developerId).toBe(developer.id);
        });
      });
    });

    it('should have consistent metrics between developer.metrics and allMetrics', () => {
      const { developers, allMetrics } = generator.generateCompleteDataset();
      
      const developerMetricsCount = developers.reduce((sum, dev) => sum + dev.metrics.length, 0);
      expect(allMetrics.length).toBe(developerMetricsCount);
    });
  });

  describe('generateSnapshotData', () => {
    it('should generate valid snapshot data', () => {
      const snapshot = generator.generateSnapshotData();
      
      expect(isSnapshotData(snapshot)).toBe(true);
      expect(snapshot.repository).toBeTruthy();
      expect(Array.isArray(snapshot.commits)).toBe(true);
      expect(snapshot.commits.length).toBeGreaterThan(0);
    });

    it('should generate commits with valid structure', () => {
      const snapshot = generator.generateSnapshotData();
      
      snapshot.commits.forEach(commit => {
        expect(commit.hash).toMatch(/^[0-9a-f]{40}$/);
        expect(commit.author).toBeTruthy();
        expect(commit.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(commit.timestamp).toBeInstanceOf(Date);
        expect(commit.linesAdded).toBeGreaterThanOrEqual(0);
        expect(commit.linesRemoved).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(commit.filesModified)).toBe(true);
        expect(commit.filesModified.length).toBeGreaterThan(0);
      });
    });

    it('should generate unique commit hashes', () => {
      const snapshot = generator.generateSnapshotData();
      const hashes = snapshot.commits.map(c => c.hash);
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    });
  });

  describe('singleton instance', () => {
    it('should provide a singleton instance', () => {
      expect(dummyDataGenerator).toBeInstanceOf(DummyDataGenerator);
    });

    it('should generate consistent data from singleton', () => {
      const developers1 = dummyDataGenerator.generateDevelopers();
      const developers2 = dummyDataGenerator.generateDevelopers();
      
      // Should generate different data each time (randomized)
      expect(developers1).not.toEqual(developers2);
      
      // But should follow the same constraints
      expect(developers1.length).toBeGreaterThanOrEqual(5);
      expect(developers1.length).toBeLessThanOrEqual(8);
      expect(developers2.length).toBeGreaterThanOrEqual(5);
      expect(developers2.length).toBeLessThanOrEqual(8);
    });
  });

  describe('data quality', () => {
    it('should generate realistic lines per file ratios', () => {
      const { allMetrics } = generator.generateCompleteDataset();
      
      // Calculate overall lines per file ratio
      const totalLines = allMetrics.reduce((sum, m) => sum + m.linesAdded + m.linesRemoved, 0);
      const totalFiles = allMetrics.reduce((sum, m) => sum + m.filesModified, 0);
      const ratio = totalLines / totalFiles;
      
      // Should be a reasonable ratio (not too high or too low)
      expect(ratio).toBeGreaterThan(5); // At least 5 lines per file on average
      expect(ratio).toBeLessThan(500); // Not more than 500 lines per file on average
    });

    it('should generate varied activity patterns', () => {
      const { allMetrics } = generator.generateCompleteDataset();
      
      // Check that we have variety in lines added
      const linesAddedValues = allMetrics.map(m => m.linesAdded);
      const uniqueLinesAdded = new Set(linesAddedValues);
      
      // Should have good variety (at least 10 different values)
      expect(uniqueLinesAdded.size).toBeGreaterThan(10);
      
      // Should have some high and low values
      const maxLines = Math.max(...linesAddedValues);
      const minLines = Math.min(...linesAddedValues);
      expect(maxLines).toBeGreaterThan(minLines * 2); // At least 2x difference
    });

    it('should generate reasonable file modification counts', () => {
      const { allMetrics } = generator.generateCompleteDataset();
      
      allMetrics.forEach(metric => {
        // Files modified should be reasonable relative to lines changed
        const totalLinesChanged = metric.linesAdded + metric.linesRemoved;
        
        if (totalLinesChanged > 0) {
          // Should not have more files than lines (unrealistic)
          expect(metric.filesModified).toBeLessThanOrEqual(totalLinesChanged);
          
          // Should have at least 1 file if there are line changes
          expect(metric.filesModified).toBeGreaterThanOrEqual(1);
        }
      });
    });
  });
});