import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MetricsChart from './MetricsChart';
import { CodeMetric } from '../types';

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Mocked Line Chart
    </div>
  )),
}));

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  TimeScale: {},
}));

vi.mock('chartjs-adapter-date-fns', () => ({}));

describe('MetricsChart', () => {
  const mockMetrics: CodeMetric[] = [
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
  ];

  it('renders chart with metrics data', () => {
    render(<MetricsChart metrics={mockMetrics} />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveTextContent('Mocked Line Chart');
  });

  it('displays empty state when no metrics provided', () => {
    render(<MetricsChart metrics={[]} />);
    
    expect(screen.getByText('No metrics data available to display')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('uses custom title when provided', () => {
    const customTitle = 'Custom Chart Title';
    render(<MetricsChart metrics={mockMetrics} title={customTitle} />);
    
    const chart = screen.getByTestId('line-chart');
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}');
    expect(chartOptions.plugins.title.text).toBe(customTitle);
  });

  it('sorts metrics by timestamp', () => {
    const unsortedMetrics: CodeMetric[] = [
      {
        id: 'metric-3',
        developerId: 'dev-1',
        timestamp: new Date('2024-01-03'),
        linesAdded: 80,
        linesRemoved: 10,
        filesModified: 2,
      },
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
    ];

    render(<MetricsChart metrics={unsortedMetrics} />);
    
    const chart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
    
    // Check that data is sorted by timestamp
    expect(chartData.datasets[0].data).toEqual([100, 150, 80]); // Lines added in chronological order
    expect(chartData.datasets[1].data).toEqual([20, 30, 10]); // Lines removed in chronological order
  });

  it('configures chart with proper datasets', () => {
    render(<MetricsChart metrics={mockMetrics} />);
    
    const chart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
    
    expect(chartData.datasets).toHaveLength(2);
    expect(chartData.datasets[0].label).toBe('Lines Added');
    expect(chartData.datasets[1].label).toBe('Lines Removed');
    expect(chartData.datasets[0].data).toEqual([100, 150, 80]);
    expect(chartData.datasets[1].data).toEqual([20, 30, 10]);
  });

  it('configures chart options correctly', () => {
    render(<MetricsChart metrics={mockMetrics} />);
    
    const chart = screen.getByTestId('line-chart');
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}');
    
    expect(chartOptions.responsive).toBe(true);
    expect(chartOptions.maintainAspectRatio).toBe(false);
    expect(chartOptions.plugins.title.display).toBe(true);
    expect(chartOptions.plugins.title.text).toBe('Code Metrics Over Time');
    expect(chartOptions.scales.x.type).toBe('time');
    expect(chartOptions.scales.y.beginAtZero).toBe(true);
  });

  it('applies custom height', () => {
    const customHeight = 600;
    render(<MetricsChart metrics={mockMetrics} height={customHeight} />);
    
    const chartWrapper = screen.getByTestId('line-chart').parentElement;
    expect(chartWrapper).toHaveStyle({ height: `${customHeight}px` });
  });
});