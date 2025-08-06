import type { CodeMetric, MetricsSummary, TimeRange, SnapshotData, CommitData } from '../types/index.js';

/**
 * MetricsCalculator class for calculating code generation metrics and statistics
 */
export class MetricsCalculator {
  /**
   * Calculates the lines per file ratio for a set of metrics
   * Requirements: 2.1, 2.2
   */
  calculateLinesPerFileRatio(metrics: CodeMetric[]): number {
    if (!metrics || metrics.length === 0) {
      return 0;
    }

    const totalLines = metrics.reduce((sum, metric) => sum + metric.linesAdded, 0);
    const totalFiles = metrics.reduce((sum, metric) => sum + metric.filesModified, 0);

    if (totalFiles === 0) {
      return 0;
    }

    return Math.round((totalLines / totalFiles) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculates comprehensive summary statistics for a set of metrics
   * Requirements: 2.1, 2.2, 2.3
   */
  calculateSummary(metrics: CodeMetric[]): MetricsSummary {
    if (!metrics || metrics.length === 0) {
      const now = new Date();
      return {
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
        totalFiles: 0,
        linesPerFileRatio: 0,
        netLinesChanged: 0,
        timeRange: {
          start: now,
          end: now
        }
      };
    }

    // Calculate totals
    const totalLinesAdded = metrics.reduce((sum, metric) => sum + metric.linesAdded, 0);
    const totalLinesRemoved = metrics.reduce((sum, metric) => sum + metric.linesRemoved, 0);
    const totalFiles = metrics.reduce((sum, metric) => sum + metric.filesModified, 0);
    const netLinesChanged = totalLinesAdded - totalLinesRemoved;

    // Calculate lines per file ratio
    const linesPerFileRatio = this.calculateLinesPerFileRatio(metrics);

    // Determine time range
    const timestamps = metrics.map(m => new Date(m.timestamp)).sort((a, b) => a.getTime() - b.getTime());
    const timeRange = {
      start: timestamps[0],
      end: timestamps[timestamps.length - 1]
    };

    return {
      totalLinesAdded,
      totalLinesRemoved,
      totalFiles,
      linesPerFileRatio,
      netLinesChanged,
      timeRange
    };
  }

  /**
   * Aggregates metrics by time range, grouping metrics within the specified range
   * Requirements: 2.3
   */
  aggregateByTimeRange(metrics: CodeMetric[], range: TimeRange): CodeMetric[] {
    if (!metrics || metrics.length === 0) {
      return [];
    }

    const startTime = new Date(range.start).getTime();
    const endTime = new Date(range.end).getTime();

    return metrics.filter(metric => {
      const metricTime = new Date(metric.timestamp).getTime();
      return metricTime >= startTime && metricTime <= endTime;
    });
  }

  /**
   * Groups metrics by developer ID
   */
  groupMetricsByDeveloper(metrics: CodeMetric[]): Map<string, CodeMetric[]> {
    const grouped = new Map<string, CodeMetric[]>();

    metrics.forEach(metric => {
      const existing = grouped.get(metric.developerId) || [];
      existing.push(metric);
      grouped.set(metric.developerId, existing);
    });

    return grouped;
  }

  /**
   * Calculates daily aggregated metrics from a set of metrics
   */
  aggregateByDay(metrics: CodeMetric[]): CodeMetric[] {
    if (!metrics || metrics.length === 0) {
      return [];
    }

    // Group metrics by date (YYYY-MM-DD)
    const dailyGroups = new Map<string, CodeMetric[]>();

    metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const existing = dailyGroups.get(dateKey) || [];
      existing.push(metric);
      dailyGroups.set(dateKey, existing);
    });

    // Aggregate each day's metrics
    const aggregated: CodeMetric[] = [];
    let aggregatedId = 1;

    dailyGroups.forEach((dayMetrics, dateKey) => {
      const firstMetric = dayMetrics[0];
      const aggregatedMetric: CodeMetric = {
        id: `aggregated-${aggregatedId++}`,
        developerId: firstMetric.developerId,
        timestamp: new Date(dateKey + 'T12:00:00Z'), // Set to noon UTC
        linesAdded: dayMetrics.reduce((sum, m) => sum + m.linesAdded, 0),
        linesRemoved: dayMetrics.reduce((sum, m) => sum + m.linesRemoved, 0),
        filesModified: dayMetrics.reduce((sum, m) => sum + m.filesModified, 0),
        repository: firstMetric.repository
      };

      aggregated.push(aggregatedMetric);
    });

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Calculates weekly aggregated metrics from a set of metrics
   */
  aggregateByWeek(metrics: CodeMetric[]): CodeMetric[] {
    if (!metrics || metrics.length === 0) {
      return [];
    }

    // Group metrics by week (start of week)
    const weeklyGroups = new Map<string, CodeMetric[]>();

    metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      const startOfWeek = this.getStartOfWeek(date);
      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      const existing = weeklyGroups.get(weekKey) || [];
      existing.push(metric);
      weeklyGroups.set(weekKey, existing);
    });

    // Aggregate each week's metrics
    const aggregated: CodeMetric[] = [];
    let aggregatedId = 1;

    weeklyGroups.forEach((weekMetrics, weekKey) => {
      const firstMetric = weekMetrics[0];
      const aggregatedMetric: CodeMetric = {
        id: `weekly-${aggregatedId++}`,
        developerId: firstMetric.developerId,
        timestamp: new Date(weekKey + 'T12:00:00Z'),
        linesAdded: weekMetrics.reduce((sum, m) => sum + m.linesAdded, 0),
        linesRemoved: weekMetrics.reduce((sum, m) => sum + m.linesRemoved, 0),
        filesModified: weekMetrics.reduce((sum, m) => sum + m.filesModified, 0),
        repository: firstMetric.repository
      };

      aggregated.push(aggregatedMetric);
    });

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Calculates moving averages for metrics over a specified window
   */
  calculateMovingAverage(metrics: CodeMetric[], windowDays: number): CodeMetric[] {
    if (!metrics || metrics.length === 0 || windowDays <= 0) {
      return [];
    }

    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const result: CodeMetric[] = [];
    const windowMs = windowDays * 24 * 60 * 60 * 1000;

    for (let i = 0; i < sortedMetrics.length; i++) {
      const currentMetric = sortedMetrics[i];
      const currentTime = new Date(currentMetric.timestamp).getTime();
      const windowStart = currentTime - windowMs;

      // Find all metrics within the window
      const windowMetrics = sortedMetrics.filter(m => {
        const metricTime = new Date(m.timestamp).getTime();
        return metricTime >= windowStart && metricTime <= currentTime;
      });

      if (windowMetrics.length > 0) {
        const avgLinesAdded = windowMetrics.reduce((sum, m) => sum + m.linesAdded, 0) / windowMetrics.length;
        const avgLinesRemoved = windowMetrics.reduce((sum, m) => sum + m.linesRemoved, 0) / windowMetrics.length;
        const avgFilesModified = windowMetrics.reduce((sum, m) => sum + m.filesModified, 0) / windowMetrics.length;

        result.push({
          id: `ma-${i + 1}`,
          developerId: currentMetric.developerId,
          timestamp: currentMetric.timestamp,
          linesAdded: Math.round(avgLinesAdded),
          linesRemoved: Math.round(avgLinesRemoved),
          filesModified: Math.round(avgFilesModified),
          repository: currentMetric.repository
        });
      }
    }

    return result;
  }

  /**
   * Gets the start of the week (Monday) for a given date
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }
}

/**
 * DataTransformer class for converting snapshot data to metrics
 */
export class DataTransformer {
  /**
   * Transforms snapshot data into CodeMetric objects
   * Requirements: 3.2
   */
  transformSnapshotToMetrics(snapshot: SnapshotData): CodeMetric[] {
    if (!snapshot || !snapshot.commits || snapshot.commits.length === 0) {
      return [];
    }

    const metrics: CodeMetric[] = [];
    const developerMap = new Map<string, string>(); // email -> developerId mapping
    let developerIdCounter = 1;

    snapshot.commits.forEach((commit, index) => {
      // Generate or get developer ID
      let developerId = developerMap.get(commit.email);
      if (!developerId) {
        developerId = `dev-${String(developerIdCounter).padStart(3, '0')}`;
        developerMap.set(commit.email, developerId);
        developerIdCounter++;
      }

      const metric: CodeMetric = {
        id: `metric-${String(index + 1).padStart(4, '0')}`,
        developerId,
        timestamp: new Date(commit.timestamp),
        linesAdded: commit.linesAdded,
        linesRemoved: commit.linesRemoved,
        filesModified: commit.filesModified.length,
        commitHash: commit.hash,
        repository: snapshot.repository
      };

      metrics.push(metric);
    });

    return metrics;
  }

  /**
   * Groups metrics by developer ID
   */
  groupMetricsByDeveloper(metrics: CodeMetric[]): Map<string, CodeMetric[]> {
    const grouped = new Map<string, CodeMetric[]>();

    metrics.forEach(metric => {
      const existing = grouped.get(metric.developerId) || [];
      existing.push(metric);
      grouped.set(metric.developerId, existing);
    });

    return grouped;
  }

  /**
   * Extracts unique developers from snapshot data
   */
  extractDevelopersFromSnapshot(snapshot: SnapshotData): Array<{ id: string, name: string, email: string }> {
    if (!snapshot || !snapshot.commits) {
      return [];
    }

    const developerMap = new Map<string, { name: string, email: string }>();
    let developerIdCounter = 1;

    snapshot.commits.forEach(commit => {
      if (!developerMap.has(commit.email)) {
        developerMap.set(commit.email, {
          name: commit.author,
          email: commit.email
        });
      }
    });

    const developers: Array<{ id: string, name: string, email: string }> = [];
    developerMap.forEach((dev, email) => {
      developers.push({
        id: `dev-${String(developerIdCounter).padStart(3, '0')}`,
        name: dev.name,
        email: dev.email
      });
      developerIdCounter++;
    });

    return developers;
  }

  /**
   * Validates and cleans commit data during transformation
   */
  validateAndCleanCommitData(commits: CommitData[]): CommitData[] {
    return commits.filter(commit => {
      // Basic validation
      if (!commit.hash || !commit.author || !commit.email) {
        console.warn('Skipping commit with missing required fields:', commit);
        return false;
      }

      // Validate numeric fields
      if (typeof commit.linesAdded !== 'number' || commit.linesAdded < 0) {
        console.warn('Skipping commit with invalid linesAdded:', commit);
        return false;
      }

      if (typeof commit.linesRemoved !== 'number' || commit.linesRemoved < 0) {
        console.warn('Skipping commit with invalid linesRemoved:', commit);
        return false;
      }

      // Validate timestamp
      const timestamp = new Date(commit.timestamp);
      if (isNaN(timestamp.getTime())) {
        console.warn('Skipping commit with invalid timestamp:', commit);
        return false;
      }

      // Validate files array
      if (!Array.isArray(commit.filesModified)) {
        console.warn('Skipping commit with invalid filesModified:', commit);
        return false;
      }

      return true;
    }).map(commit => ({
      ...commit,
      timestamp: new Date(commit.timestamp), // Ensure timestamp is Date object
      filesModified: commit.filesModified.filter(file => typeof file === 'string' && file.trim().length > 0)
    }));
  }
}

// Export singleton instances for easy use
export const metricsCalculator = new MetricsCalculator();
export const dataTransformer = new DataTransformer();