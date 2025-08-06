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

// Time range preset options
export type TimeRangePreset = 'last-week' | 'last-month' | 'last-quarter' | 'all-time' | 'custom';

export interface TimeRangeOption {
  label: string;
  value: TimeRangePreset;
  getDates: () => { start: Date; end: Date };
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
export function isDeveloper(obj: unknown): obj is Developer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).name === 'string' &&
    typeof (obj as Record<string, unknown>).email === 'string' &&
    Array.isArray((obj as Record<string, unknown>).metrics) &&
    ((obj as Record<string, unknown>).metrics as unknown[]).every((metric: unknown) => isCodeMetric(metric))
  );
}

export function isCodeMetric(obj: unknown): obj is CodeMetric {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const metric = obj as Record<string, unknown>;
  return (
    typeof metric.id === 'string' &&
    typeof metric.developerId === 'string' &&
    (metric.timestamp instanceof Date || (typeof metric.timestamp === 'string' && !isNaN(Date.parse(metric.timestamp)))) &&
    typeof metric.linesAdded === 'number' &&
    typeof metric.linesRemoved === 'number' &&
    typeof metric.filesModified === 'number' &&
    (metric.commitHash === undefined || typeof metric.commitHash === 'string') &&
    (metric.repository === undefined || typeof metric.repository === 'string')
  );
}

export function isMetricsSummary(obj: unknown): obj is MetricsSummary {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const summary = obj as Record<string, unknown>;
  return (
    typeof summary.totalLinesAdded === 'number' &&
    typeof summary.totalLinesRemoved === 'number' &&
    typeof summary.totalFiles === 'number' &&
    typeof summary.linesPerFileRatio === 'number' &&
    typeof summary.netLinesChanged === 'number' &&
    typeof summary.timeRange === 'object' &&
    summary.timeRange !== null &&
    ((summary.timeRange as Record<string, unknown>).start instanceof Date || 
     (typeof (summary.timeRange as Record<string, unknown>).start === 'string' && 
      !isNaN(Date.parse((summary.timeRange as Record<string, unknown>).start as string)))) &&
    ((summary.timeRange as Record<string, unknown>).end instanceof Date || 
     (typeof (summary.timeRange as Record<string, unknown>).end === 'string' && 
      !isNaN(Date.parse((summary.timeRange as Record<string, unknown>).end as string))))
  );
}

export function isSnapshotData(obj: unknown): obj is SnapshotData {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const snapshot = obj as Record<string, unknown>;
  return (
    typeof snapshot.repository === 'string' &&
    Array.isArray(snapshot.commits) &&
    (snapshot.commits as unknown[]).every((commit: unknown) => isCommitData(commit))
  );
}

export function isCommitData(obj: unknown): obj is CommitData {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const commit = obj as Record<string, unknown>;
  return (
    typeof commit.hash === 'string' &&
    typeof commit.author === 'string' &&
    typeof commit.email === 'string' &&
    (commit.timestamp instanceof Date || (typeof commit.timestamp === 'string' && !isNaN(Date.parse(commit.timestamp)))) &&
    typeof commit.linesAdded === 'number' &&
    typeof commit.linesRemoved === 'number' &&
    Array.isArray(commit.filesModified) &&
    (commit.filesModified as unknown[]).every((file: unknown) => typeof file === 'string')
  );
}

export function isDateRange(obj: unknown): obj is DateRange {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const range = obj as Record<string, unknown>;
  return (
    range.start !== undefined &&
    range.end !== undefined &&
    (range.start instanceof Date || (typeof range.start === 'string' && !isNaN(Date.parse(range.start)))) &&
    (range.end instanceof Date || (typeof range.end === 'string' && !isNaN(Date.parse(range.end))))
  );
}