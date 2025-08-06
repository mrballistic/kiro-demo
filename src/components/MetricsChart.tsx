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
import { useTheme } from '@mui/material/styles';
import { Box, Paper, Typography } from '@mui/material';
import type { CodeMetric } from '../types';

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
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
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Lines Removed',
        data: sortedMetrics.map(metric => metric.linesRemoved),
        borderColor: theme.palette.error.main,
        backgroundColor: theme.palette.error.main + '20',
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
        labels: {
          color: theme.palette.text.primary,
        },
      },
      title: {
        display: true,
        text: title,
        color: theme.palette.text.primary,
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
          color: theme.palette.text.primary,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Lines of Code',
          color: theme.palette.text.primary,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
      <Paper
        sx={{
          p: 2,
          mb: 2,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography 
          variant="body2" 
          color="text.secondary" 
          fontStyle="italic"
        >
          No metrics data available to display
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ height, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

export default MetricsChart;