import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsSummary from './MetricsSummary';
import type { CodeMetric } from '../types/index.js';

// Mock data for testing
const mockMetrics: CodeMetric[] = [
  {
    id: 'metric-1',
    developerId: 'dev-1',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    linesAdded: 100,
    linesRemoved: 20,
    filesModified: 5,
    commitHash: 'abc123',
    repository: 'test-repo'
  },
  {
    id: 'metric-2',
    developerId: 'dev-1',
    timestamp: new Date('2024-01-02T10:00:00Z'),
    linesAdded: 150,
    linesRemoved: 30,
    filesModified: 3,
    commitHash: 'def456',
    repository: 'test-repo'
  },
  {
    id: 'metric-3',
    developerId: 'dev-1',
    timestamp: new Date('2024-01-03T10:00:00Z'),
    linesAdded: 75,
    linesRemoved: 10,
    filesModified: 2,
    commitHash: 'ghi789',
    repository: 'test-repo'
  }
];

const emptyMetrics: CodeMetric[] = [];

const singleMetric: CodeMetric[] = [
  {
    id: 'metric-single',
    developerId: 'dev-1',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    linesAdded: 50,
    linesRemoved: 10,
    filesModified: 2,
    commitHash: 'single123',
    repository: 'test-repo'
  }
];

describe('MetricsSummary', () => {
  describe('Component Rendering', () => {
    it('renders the component with title', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      expect(screen.getByText('Metrics Summary')).toBeInTheDocument();
    });

    it('renders all summary items', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      expect(screen.getByText('Total Lines Added')).toBeInTheDocument();
      expect(screen.getByText('Total Lines Removed')).toBeInTheDocument();
      expect(screen.getByText('Total Files Modified')).toBeInTheDocument();
      expect(screen.getByText('Lines per File Ratio')).toBeInTheDocument();
      expect(screen.getByText('Net Lines Changed')).toBeInTheDocument();
      expect(screen.getByText('Time Period')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<MetricsSummary metrics={mockMetrics} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Metrics Calculations', () => {
    it('displays correct total lines added', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      // 100 + 150 + 75 = 325
      expect(screen.getByText('325')).toBeInTheDocument();
    });

    it('displays correct total lines removed', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      // 20 + 30 + 10 = 60
      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('displays correct total files modified', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      // 5 + 3 + 2 = 10
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays correct lines per file ratio', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      // 325 lines / 10 files = 32.50
      expect(screen.getByText('32.50')).toBeInTheDocument();
    });

    it('displays correct net lines changed (positive)', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      // 325 - 60 = +265
      expect(screen.getByText('+265')).toBeInTheDocument();
    });

    it('displays correct net lines changed (negative)', () => {
      const negativeMetrics: CodeMetric[] = [
        {
          id: 'metric-negative',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 50,
          linesRemoved: 100,
          filesModified: 2,
          commitHash: 'neg123',
          repository: 'test-repo'
        }
      ];

      render(<MetricsSummary metrics={negativeMetrics} />);
      
      // 50 - 100 = -50
      expect(screen.getByText('-50')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    it('formats large numbers with commas', () => {
      const largeMetrics: CodeMetric[] = [
        {
          id: 'metric-large',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 12345,
          linesRemoved: 6789,
          filesModified: 1000,
          commitHash: 'large123',
          repository: 'test-repo'
        }
      ];

      render(<MetricsSummary metrics={largeMetrics} />);
      
      expect(screen.getByText('12,345')).toBeInTheDocument();
      expect(screen.getByText('6,789')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('formats ratio to 2 decimal places', () => {
      const ratioMetrics: CodeMetric[] = [
        {
          id: 'metric-ratio',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 0,
          filesModified: 3,
          commitHash: 'ratio123',
          repository: 'test-repo'
        }
      ];

      render(<MetricsSummary metrics={ratioMetrics} />);
      
      // 100 / 3 = 33.33...
      expect(screen.getByText('33.33')).toBeInTheDocument();
    });
  });

  describe('Date Range Display', () => {
    it('displays date range for multiple metrics', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      // Should show range from first to last metric
      expect(screen.getByText('1/1/2024 - 1/3/2024')).toBeInTheDocument();
    });

    it('displays single date for single metric', () => {
      render(<MetricsSummary metrics={singleMetric} />);
      
      // Should show single date when start and end are the same
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    it('handles empty metrics array', () => {
      render(<MetricsSummary metrics={emptyMetrics} />);
      
      expect(screen.getAllByText('0')).toHaveLength(3); // Three zeros for lines added, removed, and files
      expect(screen.getByText('0.00')).toBeInTheDocument(); // Ratio
      expect(screen.getByText('+0')).toBeInTheDocument(); // Net lines changed
    });

    it('displays current date for empty metrics time range', () => {
      render(<MetricsSummary metrics={emptyMetrics} />);
      
      const today = new Date().toLocaleDateString();
      expect(screen.getByText(today)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero files modified (division by zero)', () => {
      const zeroFilesMetrics: CodeMetric[] = [
        {
          id: 'metric-zero-files',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 20,
          filesModified: 0,
          commitHash: 'zero123',
          repository: 'test-repo'
        }
      ];

      render(<MetricsSummary metrics={zeroFilesMetrics} />);
      
      // Should show 0.00 for ratio when no files modified
      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('handles metrics with same timestamp', () => {
      const sameTimeMetrics: CodeMetric[] = [
        {
          id: 'metric-same-1',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 50,
          linesRemoved: 10,
          filesModified: 2,
          commitHash: 'same1',
          repository: 'test-repo'
        },
        {
          id: 'metric-same-2',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 30,
          linesRemoved: 5,
          filesModified: 1,
          commitHash: 'same2',
          repository: 'test-repo'
        }
      ];

      render(<MetricsSummary metrics={sameTimeMetrics} />);
      
      // Should display single date when all metrics have same timestamp
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    });
  });

  describe('Requirements Validation', () => {
    it('meets requirement 2.1: calculates and displays lines per file ratio', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      expect(screen.getByText('Lines per File Ratio')).toBeInTheDocument();
      expect(screen.getByText('32.50')).toBeInTheDocument();
    });

    it('meets requirement 2.2: displays ratio as decimal rounded to two decimal places', () => {
      const precisionMetrics: CodeMetric[] = [
        {
          id: 'metric-precision',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 0,
          filesModified: 7,
          commitHash: 'precision123',
          repository: 'test-repo'
        }
      ];

      render(<MetricsSummary metrics={precisionMetrics} />);
      
      // 100 / 7 = 14.285714... should be displayed as 14.29
      expect(screen.getByText('14.29')).toBeInTheDocument();
    });

    it('meets requirement 2.3: displays summary statistics for time periods', () => {
      render(<MetricsSummary metrics={mockMetrics} />);
      
      // Should display all summary statistics
      expect(screen.getByText('Total Lines Added')).toBeInTheDocument();
      expect(screen.getByText('Total Lines Removed')).toBeInTheDocument();
      expect(screen.getByText('Total Files Modified')).toBeInTheDocument();
      expect(screen.getByText('Net Lines Changed')).toBeInTheDocument();
      expect(screen.getByText('Time Period')).toBeInTheDocument();
    });

    it('meets requirement 2.4: handles zero files case appropriately', () => {
      const zeroFilesMetrics: CodeMetric[] = [
        {
          id: 'metric-zero',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          linesAdded: 100,
          linesRemoved: 20,
          filesModified: 0,
          commitHash: 'zero123',
          repository: 'test-repo'
        }
      ];

      render(<MetricsSummary metrics={zeroFilesMetrics} />);
      
      // Should display 0.00 instead of "N/A" or error
      expect(screen.getByText('0.00')).toBeInTheDocument();
    });
  });
});