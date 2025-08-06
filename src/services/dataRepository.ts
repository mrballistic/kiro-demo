import type { 
  DataRepository, 
  Developer, 
  CodeMetric, 
  SnapshotData, 
  DateRange
} from '../types/index.js';
import { StorageUtils, DataValidator } from './storageUtils.js';
import { dummyDataGenerator } from './dummyDataGenerator.js';

/**
 * JSON file-based implementation of the DataRepository interface
 * Handles data persistence, retrieval, and import operations with comprehensive error handling
 */
export class JSONDataRepository implements DataRepository {
  private developersCache: Developer[] | null = null;
  private metricsCache: CodeMetric[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  /**
   * Gets all developers from storage
   */
  async getDevelopers(): Promise<Developer[]> {
    try {
      await this.ensureCacheValid();
      // Return deep copies to prevent external modifications
      return (this.developersCache || []).map(dev => ({
        ...dev,
        metrics: dev.metrics.map(metric => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to get developers:', error);
      throw new Error(`Unable to retrieve developers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a specific developer by ID
   */
  async getDeveloper(id: string): Promise<Developer | null> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Developer ID must be a non-empty string');
      }

      const developers = await this.getDevelopers();
      const developer = developers.find(dev => dev.id === id);
      
      if (!developer) {
        return null;
      }

      // Return a deep copy to prevent external modifications
      return {
        ...developer,
        metrics: [...developer.metrics]
      };
    } catch (error) {
      console.error(`Failed to get developer ${id}:`, error);
      if (error instanceof Error && error.message.includes('Developer ID must be')) {
        throw error; // Re-throw validation errors
      }
      throw new Error(`Unable to retrieve developer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets metrics for a specific developer, optionally filtered by date range
   */
  async getMetrics(developerId: string, dateRange?: DateRange): Promise<CodeMetric[]> {
    try {
      if (!developerId || typeof developerId !== 'string') {
        throw new Error('Developer ID must be a non-empty string');
      }

      await this.ensureCacheValid();
      
      // Get all metrics for the developer
      let metrics = (this.metricsCache || []).filter(metric => metric.developerId === developerId);

      // Apply date range filter if provided
      if (dateRange) {
        this.validateDateRange(dateRange);
        
        const startTime = dateRange.start.getTime();
        const endTime = dateRange.end.getTime();
        
        metrics = metrics.filter(metric => {
          const metricTime = metric.timestamp.getTime();
          return metricTime >= startTime && metricTime <= endTime;
        });
      }

      // Sort by timestamp (oldest first)
      metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Return deep copies to prevent external modifications
      return metrics.map(metric => ({
        ...metric,
        timestamp: new Date(metric.timestamp)
      }));
    } catch (error) {
      console.error(`Failed to get metrics for developer ${developerId}:`, error);
      if (error instanceof Error && (
        error.message.includes('Developer ID must be') ||
        error.message.includes('Invalid date range')
      )) {
        throw error; // Re-throw validation errors
      }
      throw new Error(`Unable to retrieve metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Imports snapshot data and converts it to developers and metrics
   */
  async importSnapshot(data: SnapshotData): Promise<void> {
    try {
      // Validate the snapshot data
      const validation = DataValidator.validateSnapshotData(data);
      
      if (!validation.isValid) {
        const errorMessage = `Invalid snapshot data: ${validation.errors.join(', ')}`;
        throw new Error(errorMessage);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Snapshot data warnings:', validation.warnings);
      }

      // Transform snapshot data to internal format
      const { developers, metrics } = this.transformSnapshotData(data);

      // Merge with existing data
      await this.mergeImportedData(developers, metrics);

      // Clear cache to force reload
      this.invalidateCache();

      console.log(`Successfully imported ${metrics.length} metrics for ${developers.length} developers from repository: ${data.repository}`);
    } catch (error) {
      console.error('Failed to import snapshot data:', error);
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initializes the repository with dummy data if no data exists
   */
  async initializeWithDummyData(): Promise<void> {
    try {
      const existingData = await StorageUtils.loadCompleteDataset();
      
      // Only initialize if no data exists
      if (existingData.developers.length === 0 && existingData.metrics.length === 0) {
        console.log('No existing data found, initializing with dummy data...');
        
        const { developers, allMetrics } = dummyDataGenerator.generateCompleteDataset();
        await StorageUtils.saveCompleteDataset(developers, allMetrics, true);
        
        // Update cache
        this.developersCache = developers;
        this.metricsCache = allMetrics;
        this.cacheTimestamp = Date.now();
        
        console.log(`Initialized with ${developers.length} developers and ${allMetrics.length} metrics`);
      }
    } catch (error) {
      console.error('Failed to initialize with dummy data:', error);
      throw new Error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clears all data from storage
   */
  async clearAllData(): Promise<void> {
    try {
      await StorageUtils.clearAllData();
      this.invalidateCache();
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error(`Clear operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if current data is dummy data
   */
  async isDummyData(): Promise<boolean> {
    try {
      return await StorageUtils.isDummyData();
    } catch (error) {
      console.error('Failed to check dummy data status:', error);
      return false;
    }
  }

  /**
   * Gets storage usage information
   */
  getStorageInfo(): { used: number, available: number, percentage: number } {
    return StorageUtils.getStorageInfo();
  }

  /**
   * Exports all data to JSON format
   */
  async exportData(): Promise<string> {
    try {
      await this.ensureCacheValid();
      return StorageUtils.exportToJSON(
        this.developersCache || [],
        this.metricsCache || []
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensures cache is valid and loads data if needed
   */
  private async ensureCacheValid(): Promise<void> {
    const now = Date.now();
    
    if (!this.developersCache || !this.metricsCache || 
        (now - this.cacheTimestamp) > this.CACHE_TTL) {
      
      await this.loadDataToCache();
    }
  }

  /**
   * Loads data from storage to cache
   */
  private async loadDataToCache(): Promise<void> {
    try {
      const data = await StorageUtils.loadCompleteDataset();
      this.developersCache = data.developers;
      this.metricsCache = data.metrics;
      this.cacheTimestamp = Date.now();
    } catch (error) {
      console.error('Failed to load data to cache:', error);
      // Initialize empty cache on error
      this.developersCache = [];
      this.metricsCache = [];
      this.cacheTimestamp = Date.now();
      throw error;
    }
  }

  /**
   * Invalidates the cache
   */
  private invalidateCache(): void {
    this.developersCache = null;
    this.metricsCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Transforms snapshot data to internal developer and metrics format
   */
  private transformSnapshotData(snapshot: SnapshotData): { developers: Developer[], metrics: CodeMetric[] } {
    const developersMap = new Map<string, Developer>();
    const metrics: CodeMetric[] = [];

    snapshot.commits.forEach((commit, index) => {
      // Create or get developer
      const developerKey = `${commit.author}-${commit.email}`;
      let developer = developersMap.get(developerKey);
      
      if (!developer) {
        developer = {
          id: `dev-${this.generateShortId()}`,
          name: commit.author,
          email: commit.email,
          metrics: []
        };
        developersMap.set(developerKey, developer);
      }

      // Create metric
      const metric: CodeMetric = {
        id: `metric-${this.generateShortId()}-${index}`,
        developerId: developer.id,
        timestamp: new Date(commit.timestamp),
        linesAdded: commit.linesAdded,
        linesRemoved: commit.linesRemoved,
        filesModified: commit.filesModified.length,
        commitHash: commit.hash,
        repository: snapshot.repository
      };

      metrics.push(metric);
      developer.metrics.push(metric);
    });

    return {
      developers: Array.from(developersMap.values()),
      metrics
    };
  }

  /**
   * Merges imported data with existing data
   */
  private async mergeImportedData(newDevelopers: Developer[], newMetrics: CodeMetric[]): Promise<void> {
    const existingData = await StorageUtils.loadCompleteDataset();
    const existingDevelopers = existingData.developers;
    const existingMetrics = existingData.metrics;

    // Merge developers (avoid duplicates by email)
    const developersMap = new Map<string, Developer>();
    
    // Add existing developers
    existingDevelopers.forEach(dev => {
      developersMap.set(dev.email, dev);
    });

    // Add or update with new developers
    newDevelopers.forEach(newDev => {
      const existing = developersMap.get(newDev.email);
      if (existing) {
        // Update existing developer's metrics
        existing.metrics = [...existing.metrics, ...newDev.metrics];
      } else {
        developersMap.set(newDev.email, newDev);
      }
    });

    // Merge metrics (avoid duplicates by commit hash, timestamp, and developer email)
    const metricsSet = new Set<string>();
    const mergedMetrics: CodeMetric[] = [];

    // Create a map to get developer email by ID for both existing and new developers
    const developerEmailMap = new Map<string, string>();
    
    // Add existing developers to email map
    existingDevelopers.forEach(dev => {
      developerEmailMap.set(dev.id, dev.email);
    });
    
    // Add new developers to email map
    newDevelopers.forEach(dev => {
      developerEmailMap.set(dev.id, dev.email);
    });

    // Add existing metrics
    existingMetrics.forEach(metric => {
      const developerEmail = developerEmailMap.get(metric.developerId) || 'unknown';
      const key = `${developerEmail}-${metric.commitHash || 'no-hash'}-${metric.timestamp.getTime()}-${metric.linesAdded}-${metric.linesRemoved}`;
      if (!metricsSet.has(key)) {
        metricsSet.add(key);
        mergedMetrics.push(metric);
      }
    });

    // Add new metrics
    newMetrics.forEach(metric => {
      const developerEmail = developerEmailMap.get(metric.developerId) || 'unknown';
      const key = `${developerEmail}-${metric.commitHash || 'no-hash'}-${metric.timestamp.getTime()}-${metric.linesAdded}-${metric.linesRemoved}`;
      if (!metricsSet.has(key)) {
        metricsSet.add(key);
        mergedMetrics.push(metric);
      }
    });

    // Update developer metrics references
    const finalDevelopers = Array.from(developersMap.values()).map(dev => ({
      ...dev,
      metrics: mergedMetrics.filter(metric => metric.developerId === dev.id)
    }));

    // Save merged data
    await StorageUtils.saveCompleteDataset(finalDevelopers, mergedMetrics, false);
  }

  /**
   * Validates date range parameters
   */
  private validateDateRange(dateRange: DateRange): void {
    if (!dateRange.start || !dateRange.end) {
      throw new Error('Invalid date range: start and end dates are required');
    }

    if (!(dateRange.start instanceof Date) || !(dateRange.end instanceof Date)) {
      throw new Error('Invalid date range: start and end must be Date objects');
    }

    if (isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
      throw new Error('Invalid date range: start and end must be valid dates');
    }

    if (dateRange.start.getTime() > dateRange.end.getTime()) {
      throw new Error('Invalid date range: start date must be before end date');
    }
  }

  /**
   * Generates a short unique ID
   */
  private generateShortId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export a singleton instance for easy use
export const dataRepository = new JSONDataRepository();