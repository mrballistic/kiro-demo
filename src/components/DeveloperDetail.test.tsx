import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeveloperDetail from './DeveloperDetail';
import { Developer } from '../types';

// Mock the MetricsChart component
vi.mock('./MetricsChart', () => ({
  default: vi.fn(({ metrics, title }) => (
    <div data-testid="metrics-chart" data-metrics-count={metrics.length} data-title={title}>
      Mocked MetricsChart
    </div>
  )),
}));

describe('DeveloperDetail', () => {
  const mockDeveloper: Developer = {
    id: 'dev-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    metrics: [
      {
        id: 'metric-1',
        developerId: 'dev-1',
        timestamp: new Date('2024-01-01'),
        linesAdded: 100,
        linesRemoved: 20,
        filesModified: 3,
      },
      {
        id: 'metric-2',
        developerId: 'dev-1',
        timestamp: new Date('2024-01-02'),
        linesAdded: 150,
        linesRemoved: 30,
        filesModified: 5,
      },
      {
        id: 'metric-3',
        developerId: 'dev-1',
        timestamp: new Date('2024-01-03'),
        linesAdded: 80,
        linesRemoved: 10,
        filesModified: 2,
      },
    ],
  };

  it('renders developer information', () => {
    render(<DeveloperDetail developer={mockDeveloper} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('displays summary statistics correctly', () => {
    render(<DeveloperDetail developer={mockDeveloper} />);
    
    // Total commits
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    
    // Total lines added (100 + 150 + 80 = 330)
    expect(screen.getByText('330')).toBeInTheDocument();
    expect(screen.getByText('Lines Added')).toBeInTheDocument();
    
    // Total lines removed (20 + 30 + 10 = 60)
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('Lines Removed')).toBeInTheDocument();
    
    // Total files modified (3 + 5 + 2 = 10)
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Files Modified')).toBeInTheDocument();
  });

  it('calculates and displays derived metrics', () => {
    render(<DeveloperDetail developer={mockDeveloper} />);
    
    // Net lines changed (330 - 60 = +270)
    expect(screen.getByText('+270')).toBeInTheDocument();
    expect(screen.getByText('Net Lines Changed')).toBeInTheDocument();
    
    // Lines per file ratio (330 / 10 = 33.00)
    expect(screen.getByText('33.00')).toBeInTheDocument();
    expect(screen.getByText('Lines per File Ratio')).toBeInTheDocument();
  });

  it('displays date range when metrics exist', () => {
    render(<DeveloperDetail developer={mockDeveloper} />);
    
    expect(screen.getByText(/Active from.*to/)).toBeInTheDocument();
  });

  it('renders metrics chart with correct props', () => {
    render(<DeveloperDetail developer={mockDeveloper} />);
    
    const chart = screen.getByTestId('metrics-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('data-metrics-count', '3');
    expect(chart).toHaveAttribute('data-title', "John Doe's Code Generation Metrics");
  });

  it('handles developer with no metrics', () => {
    const developerWithNoMetrics: Developer = {
      ...mockDeveloper,
      metrics: [],
    };

    render(<DeveloperDetail developer={developerWithNoMetrics} />);
    
    // Check for specific sections with 0 values
    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('Lines Added')).toBeInTheDocument();
    expect(screen.getByText('Lines Removed')).toBeInTheDocument();
    expect(screen.getByText('Files Modified')).toBeInTheDocument();
    expect(screen.getByText('0.00')).toBeInTheDocument(); // Lines per file ratio
    expect(screen.queryByText(/Active from.*to/)).not.toBeInTheDocument();
  });

  it('handles negative net lines changed', () => {
    const developerWithNegativeNet: Developer = {
      ...mockDeveloper,
      metrics: [
        {
          id: 'metric-1',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01'),
          linesAdded: 50,
          linesRemoved: 100,
          filesModified: 2,
        },
      ],
    };

    render(<DeveloperDetail developer={developerWithNegativeNet} />);
    
    expect(screen.getByText('-50')).toBeInTheDocument();
  });

  it('formats large numbers with locale string', () => {
    const developerWithLargeNumbers: Developer = {
      ...mockDeveloper,
      metrics: [
        {
          id: 'metric-1',
          developerId: 'dev-1',
          timestamp: new Date('2024-01-01'),
          linesAdded: 1500,
          linesRemoved: 200,
          filesModified: 100,
        },
      ],
    };

    render(<DeveloperDetail developer={developerWithLargeNumbers} />);
    
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('+1,300')).toBeInTheDocument();
  });
});