import { Developer, CodeMetric, isDeveloper, isCodeMetric, isSnapshotData } from '../types/index.js';

/**
 * JSON-based storage utilities for reading and writing application data
 */
export class StorageUtils {
  private static readonly STORAGE_KEY_DEVELOPERS = 'cgt_developers';
  private static readonly STORAGE_KEY_METRICS = 'cgt_metrics';
  private static readonly STORAGE_KEY_IS_DUMMY = 'cgt_is_dummy_data';

  /**
   * Saves developers to localStorage
   */
  static async saveDevelopers(developers: Developer[]): Promise<void> {
    try {
      const serializedData = JSON.stringify(developers, this.dateReplacer);
      localStorage.setItem(this.STORAGE_KEY_DEVELOPERS, serializedData);
    } catch (error) {
      throw new Error(`Failed to save developers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads developers from localStorage
   */
  static async loadDevelopers(): Promise<Developer[]> {
    try {
      const serializedData = localStorage.getItem(this.STORAGE_KEY_DEVELOPERS);
      if (!serializedData) {
        return [];
      }

      const parsed = JSON.parse(serializedData, this.dateReviver);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid developers data format: expected array');
      }

      // Validate each developer and convert timestamp strings in metrics to Date objects
      const validDevelopers = parsed.filter((dev, index) => {
        // Convert timestamp strings to Date objects in metrics
        if (Array.isArray(dev.metrics)) {
          dev.metrics.forEach((metric: CodeMetric) => {
            if (typeof metric.timestamp === 'string') {
              metric.timestamp = new Date(metric.timestamp);
            }
          });
        }
        
        if (!isDeveloper(dev)) {
          console.warn(`Invalid developer at index ${index}, skipping:`, dev);
          return false;
        }
        return true;
      });

      return validDevelopers;
    } catch (error) {
      console.error('Failed to load developers:', error);
      return [];
    }
  }

  /**
   * Saves metrics to localStorage
   */
  static async saveMetrics(metrics: CodeMetric[]): Promise<void> {
    try {
      const serializedData = JSON.stringify(metrics, this.dateReplacer);
      localStorage.setItem(this.STORAGE_KEY_METRICS, serializedData);
    } catch (error) {
      throw new Error(`Failed to save metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads metrics from localStorage
   */
  static async loadMetrics(): Promise<CodeMetric[]> {
    try {
      const serializedData = localStorage.getItem(this.STORAGE_KEY_METRICS);
      if (!serializedData) {
        return [];
      }

      const parsed = JSON.parse(serializedData, this.dateReviver);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid metrics data format: expected array');
      }

      // Validate each metric and convert timestamp strings to Date objects
      const validMetrics = parsed.filter((metric, index) => {
        // Convert timestamp string to Date if needed
        if (typeof metric.timestamp === 'string') {
          metric.timestamp = new Date(metric.timestamp);
        }
        
        if (!isCodeMetric(metric)) {
          console.warn(`Invalid metric at index ${index}, skipping:`, metric);
          return false;
        }
        return true;
      });

      return validMetrics;
    } catch (error) {
      console.error('Failed to load metrics:', error);
      return [];
    }
  }

  /**
   * Saves complete dataset (developers and metrics)
   */
  static async saveCompleteDataset(developers: Developer[], metrics: CodeMetric[], isDummyData = false): Promise<void> {
    await Promise.all([
      this.saveDevelopers(developers),
      this.saveMetrics(metrics),
      this.setDummyDataFlag(isDummyData)
    ]);
  }

  /**
   * Loads complete dataset (developers and metrics)
   */
  static async loadCompleteDataset(): Promise<{ developers: Developer[], metrics: CodeMetric[], isDummyData: boolean }> {
    const [developers, metrics, isDummyData] = await Promise.all([
      this.loadDevelopers(),
      this.loadMetrics(),
      this.isDummyData()
    ]);

    return { developers, metrics, isDummyData };
  }

  /**
   * Exports data to JSON string for file download
   */
  static exportToJSON(developers: Developer[], metrics: CodeMetric[]): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date(),
      developers,
      metrics
    };

    return JSON.stringify(exportData, this.dateReplacer, 2);
  }

  /**
   * Imports data from JSON string
   */
  static importFromJSON(jsonString: string): { developers: Developer[], metrics: CodeMetric[] } {
    try {
      const parsed = JSON.parse(jsonString, this.dateReviver) as unknown;
      
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON format: expected object');
      }

      const parsedObj = parsed as Record<string, unknown>;
      let developers: Developer[] = [];
      let metrics: CodeMetric[] = [];

      // Handle different import formats
      if (parsedObj.developers && Array.isArray(parsedObj.developers)) {
        developers = parsedObj.developers.filter((dev: unknown) => {
          if (!isDeveloper(dev)) {
            console.warn('Invalid developer in import data, skipping:', dev);
            return false;
          }
          return true;
        });
      }

      if (parsedObj.metrics && Array.isArray(parsedObj.metrics)) {
        metrics = parsedObj.metrics.filter((metric: unknown) => {
          // Convert timestamp string to Date if needed
          if (typeof (metric as CodeMetric).timestamp === 'string') {
            (metric as CodeMetric).timestamp = new Date((metric as CodeMetric).timestamp);
          }
          
          if (!isCodeMetric(metric)) {
            console.warn('Invalid metric in import data, skipping:', metric);
            return false;
          }
          return true;
        });
      }

      return { developers, metrics };
    } catch (error) {
      throw new Error(`Failed to import JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clears all stored data
   */
  static async clearAllData(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY_DEVELOPERS);
    localStorage.removeItem(this.STORAGE_KEY_METRICS);
    localStorage.removeItem(this.STORAGE_KEY_IS_DUMMY);
  }

  /**
   * Sets the dummy data flag
   */
  static async setDummyDataFlag(isDummy: boolean): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY_IS_DUMMY, JSON.stringify(isDummy));
  }

  /**
   * Checks if current data is dummy data
   */
  static async isDummyData(): Promise<boolean> {
    try {
      const flag = localStorage.getItem(this.STORAGE_KEY_IS_DUMMY);
      return flag ? JSON.parse(flag) : false;
    } catch {
      return false;
    }
  }

  /**
   * Gets storage usage information
   */
  static getStorageInfo(): { used: number, available: number, percentage: number } {
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cgt_')) {
          const value = localStorage.getItem(key);
          if (value) {
            used += value.length;
          }
        }
      }

      // Estimate available space (localStorage typically has 5-10MB limit)
      const estimated = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / estimated) * 100;

      return {
        used,
        available: estimated - used,
        percentage: Math.min(percentage, 100)
      };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Custom JSON replacer for handling Date objects
   */
  private static dateReplacer(key: string, value: unknown): unknown {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  /**
   * Custom JSON reviver for handling Date objects
   */
  private static dateReviver(key: string, value: unknown): unknown {
    if (typeof value === 'object' && value !== null && 
        '__type' in value && 'value' in value &&
        (value as { __type: string }).__type === 'Date') {
      return new Date((value as { value: string }).value);
    }
    return value;
  }
}

/**
 * Data validation utilities for imported snapshot data
 */
export class DataValidator {
  /**
   * Validates snapshot data structure and content
   */
  static validateSnapshotData(data: unknown): { isValid: boolean, errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!isSnapshotData(data)) {
      errors.push('Invalid snapshot data structure');
      return { isValid: false, errors, warnings };
    }

    // Validate repository name
    if (!data.repository || data.repository.trim().length === 0) {
      errors.push('Repository name is required and cannot be empty');
    }

    // Validate commits
    if (!Array.isArray(data.commits) || data.commits.length === 0) {
      errors.push('Commits array is required and cannot be empty');
    } else {
      data.commits.forEach((commit, index) => {
        const commitErrors = this.validateCommitData(commit, index);
        errors.push(...commitErrors.errors);
        warnings.push(...commitErrors.warnings);
      });
    }

    // Check for duplicate commit hashes
    const commitHashes = data.commits.map((c: { hash?: string }) => c.hash).filter(Boolean);
    const uniqueHashes = new Set(commitHashes);
    if (commitHashes.length !== uniqueHashes.size) {
      warnings.push('Duplicate commit hashes found in data');
    }

    // Check date ranges
    const dates = data.commits
      .map((c: { timestamp: string | Date }) => new Date(c.timestamp))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      const oldestDate = dates[0];
      const newestDate = dates[dates.length - 1];
      const daysDiff = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 365) {
        warnings.push(`Data spans ${Math.round(daysDiff)} days, which is more than a year`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates individual commit data
   */
  private static validateCommitData(commit: unknown, index: number): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const prefix = `Commit ${index + 1}:`;

    if (typeof commit !== 'object' || commit === null) {
      errors.push(`${prefix} must be an object`);
      return { errors, warnings };
    }

    const commitObj = commit as Record<string, unknown>;

    // Required fields
    if (!commitObj.hash || typeof commitObj.hash !== 'string') {
      errors.push(`${prefix} hash is required and must be a string`);
    } else if (commitObj.hash.length < 7) {
      warnings.push(`${prefix} hash seems too short (${commitObj.hash.length} characters)`);
    }

    if (!commitObj.author || typeof commitObj.author !== 'string') {
      errors.push(`${prefix} author is required and must be a string`);
    }

    if (!commitObj.email || typeof commitObj.email !== 'string') {
      errors.push(`${prefix} email is required and must be a string`);
    } else if (!this.isValidEmail(commitObj.email)) {
      warnings.push(`${prefix} email format appears invalid: ${commitObj.email}`);
    }

    // Timestamp validation
    if (!commitObj.timestamp) {
      errors.push(`${prefix} timestamp is required`);
    } else {
      const date = new Date(commitObj.timestamp as string | Date);
      if (isNaN(date.getTime())) {
        errors.push(`${prefix} timestamp is not a valid date: ${commitObj.timestamp}`);
      } else {
        const now = new Date();
        if (date > now) {
          warnings.push(`${prefix} timestamp is in the future: ${commitObj.timestamp}`);
        }
        
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);
        if (date < twoYearsAgo) {
          warnings.push(`${prefix} timestamp is more than 2 years old: ${commitObj.timestamp}`);
        }
      }
    }

    // Numeric validations
    if (typeof commitObj.linesAdded !== 'number' || commitObj.linesAdded < 0) {
      errors.push(`${prefix} linesAdded must be a non-negative number`);
    } else if (commitObj.linesAdded > 10000) {
      warnings.push(`${prefix} linesAdded is very high (${commitObj.linesAdded}), please verify`);
    }

    if (typeof commitObj.linesRemoved !== 'number' || commitObj.linesRemoved < 0) {
      errors.push(`${prefix} linesRemoved must be a non-negative number`);
    } else if (commitObj.linesRemoved > 10000) {
      warnings.push(`${prefix} linesRemoved is very high (${commitObj.linesRemoved}), please verify`);
    }

    // Files validation
    if (!Array.isArray(commitObj.filesModified)) {
      errors.push(`${prefix} filesModified must be an array`);
    } else {
      if (commitObj.filesModified.length === 0) {
        warnings.push(`${prefix} no files modified`);
      } else if (commitObj.filesModified.length > 100) {
        warnings.push(`${prefix} very high number of files modified (${commitObj.filesModified.length})`);
      }

      commitObj.filesModified.forEach((file: unknown, fileIndex: number) => {
        if (typeof file !== 'string') {
          errors.push(`${prefix} file ${fileIndex + 1} must be a string`);
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Simple email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}