import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { CodeMetric } from '../types';
import styles from './MetricsChart.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface MetricsChartProps {
  metrics: CodeMetric[];
  title?: string;
  height?: number;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  metrics,
  title = 'Code Metrics Over Time',
  height = 400,
}) => {
  // Sort metrics by timestamp
  const sortedMetrics = [...metrics].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Prepare data for Chart.js
  const chartData = {
    labels: sortedMetrics.map(metric => new Date(metric.timestamp)),
    datasets: [
      {
        label: 'Lines Added',
        data: sortedMetrics.map(metric => metric.linesAdded),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Lines Removed',
        data: sortedMetrics.map(metric => metric.linesRemoved),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Lines of Code',
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true,
    },
  };

  if (metrics.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.emptyState} style={{ height }}>
          <p>No metrics data available to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartWrapper} style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default MetricsChart;