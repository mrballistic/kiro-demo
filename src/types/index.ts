// Core data models
export interface Developer {
  id: string;
  name: string;
  email: string;
  metrics: CodeMetric[];
}

export interface CodeMetric {
  id: string;
  developerId: string;
  timestamp: Date;
  linesAdded: number;
  linesRemoved: number;
  filesModified: number;
  commitHash?: string;
  repository?: string;
}

export interface MetricsSummary {
  totalLinesAdded: number;
  totalLinesRemoved: number;
  totalFiles: number;
  linesPerFileRatio: number;
  netLinesChanged: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Data access interfaces
export interface DataRepository {
  getDevelopers(): Promise<Developer[]>;
  getDeveloper(id: string): Promise<Developer | null>;
  getMetrics(developerId: string, dateRange?: DateRange): Promise<CodeMetric[]>;
  importSnapshot(data: SnapshotData): Promise<void>;
}

export interface SnapshotData {
  repository: string;
  commits: CommitData[];
}

export interface CommitData {
  hash: string;
  author: string;
  email: string;
  timestamp: Date;
  linesAdded: number;
  linesRemoved: number;
  filesModified: string[];
}

// Business logic interfaces
export interface MetricsCalculator {
  calculateLinesPerFileRatio(metrics: CodeMetric[]): number;
  calculateSummary(metrics: CodeMetric[]): MetricsSummary;
  aggregateByTimeRange(metrics: CodeMetric[], range: TimeRange): CodeMetric[];
}

export interface DataTransformer {
  transformSnapshotToMetrics(snapshot: SnapshotData): CodeMetric[];
  groupMetricsByDeveloper(metrics: CodeMetric[]): Map<string, CodeMetric[]>;
}

// Utility types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

// Chart.js integration types
export interface ChartDataPoint {
  x: string | Date;
  y: number;
}

export interface MetricsChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[] | ChartDataPoint[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: {
    x?: {
      type: string;
      time?: {
        unit: string;
      };
    };
    y?: {
      beginAtZero: boolean;
    };
  };
  plugins?: {
    legend?: {
      display: boolean;
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
}

// Type validation functions
export function isDeveloper(obj: any): obj is Developer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    Array.isArray(obj.metrics) &&
    obj.metrics.every((metric: any) => isCodeMetric(metric))
  );
}

export function isCodeMetric(obj: any): obj is CodeMetric {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.developerId === 'string' &&
    (obj.timestamp instanceof Date || (typeof obj.timestamp === 'string' && !isNaN(Date.parse(obj.timestamp)))) &&
    typeof obj.linesAdded === 'number' &&
    typeof obj.linesRemoved === 'number' &&
    typeof obj.filesModified === 'number' &&
    (obj.commitHash === undefined || typeof obj.commitHash === 'string') &&
    (obj.repository === undefined || typeof obj.repository === 'string')
  );
}

export function isMetricsSummary(obj: any): obj is MetricsSummary {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.totalLinesAdded === 'number' &&
    typeof obj.totalLinesRemoved === 'number' &&
    typeof obj.totalFiles === 'number' &&
    typeof obj.linesPerFileRatio === 'number' &&
    typeof obj.netLinesChanged === 'number' &&
    typeof obj.timeRange === 'object' &&
    obj.timeRange !== null &&
    (obj.timeRange.start instanceof Date || (typeof obj.timeRange.start === 'string' && !isNaN(Date.parse(obj.timeRange.start)))) &&
    (obj.timeRange.end instanceof Date || (typeof obj.timeRange.end === 'string' && !isNaN(Date.parse(obj.timeRange.end))))
  );
}

export function isSnapshotData(obj: any): obj is SnapshotData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.repository === 'string' &&
    Array.isArray(obj.commits) &&
    obj.commits.every((commit: any) => isCommitData(commit))
  );
}

export function isCommitData(obj: any): obj is CommitData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.hash === 'string' &&
    typeof obj.author === 'string' &&
    typeof obj.email === 'string' &&
    (obj.timestamp instanceof Date || (typeof obj.timestamp === 'string' && !isNaN(Date.parse(obj.timestamp)))) &&
    typeof obj.linesAdded === 'number' &&
    typeof obj.linesRemoved === 'number' &&
    Array.isArray(obj.filesModified) &&
    obj.filesModified.every((file: any) => typeof file === 'string')
  );
}

export function isDateRange(obj: any): obj is DateRange {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj.start !== undefined &&
    obj.end !== undefined &&
    (obj.start instanceof Date || (typeof obj.start === 'string' && !isNaN(Date.parse(obj.start)))) &&
    (obj.end instanceof Date || (typeof obj.end === 'string' && !isNaN(Date.parse(obj.end))))
  );
}