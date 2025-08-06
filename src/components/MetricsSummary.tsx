import React from 'react';
import { 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import type { MetricsSummary as MetricsSummaryType, CodeMetric } from '../types/index.js';
import { metricsCalculator } from '../services/metricsCalculator.js';

interface MetricsSummaryProps {
  metrics: CodeMetric[];
  className?: string;
}

const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics, className }) => {
  const theme = useTheme();
  const summary: MetricsSummaryType = metricsCalculator.calculateSummary(metrics);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatRatio = (ratio: number): string => {
    return ratio.toFixed(2);
  };

  const formatDateRange = (start: Date, end: Date): string => {
    if (start.getTime() === end.getTime()) {
      return start.toLocaleDateString();
    }
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }} className={className}>
      <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
        Metrics Summary
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        }, 
        gap: 2 
      }}>
        <Card 
          sx={{ 
            borderLeft: 4, 
            borderLeftColor: theme.palette.success.main,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 }
          }}
        >
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total Lines Added
            </Typography>
            <Typography variant="h4" component="div" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
              {formatNumber(summary.totalLinesAdded)}
            </Typography>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            borderLeft: 4, 
            borderLeftColor: theme.palette.error.main,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 }
          }}
        >
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total Lines Removed
            </Typography>
            <Typography variant="h4" component="div" sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
              {formatNumber(summary.totalLinesRemoved)}
            </Typography>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            borderLeft: 4, 
            borderLeftColor: theme.palette.info.main,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 }
          }}
        >
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total Files Modified
            </Typography>
            <Typography variant="h4" component="div" sx={{ color: theme.palette.info.main, fontWeight: 700 }}>
              {formatNumber(summary.totalFiles)}
            </Typography>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            borderLeft: 4, 
            borderLeftColor: theme.palette.secondary.main,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 }
          }}
        >
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Lines per File Ratio
            </Typography>
            <Typography variant="h4" component="div" sx={{ color: theme.palette.secondary.main, fontWeight: 700 }}>
              {formatRatio(summary.linesPerFileRatio)}
            </Typography>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            borderLeft: 4, 
            borderLeftColor: summary.netLinesChanged >= 0 ? theme.palette.success.main : theme.palette.error.main,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 }
          }}
        >
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Net Lines Changed
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                color: summary.netLinesChanged >= 0 ? theme.palette.success.main : theme.palette.error.main, 
                fontWeight: 700 
              }}
            >
              {summary.netLinesChanged >= 0 ? '+' : ''}{formatNumber(summary.netLinesChanged)}
            </Typography>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            borderLeft: 4, 
            borderLeftColor: theme.palette.warning.main,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 },
            gridColumn: { xs: '1', md: 'span 2' }
          }}
        >
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Time Period
            </Typography>
            <Typography variant="h5" component="div" sx={{ color: theme.palette.warning.main, fontWeight: 700 }}>
              {formatDateRange(summary.timeRange.start, summary.timeRange.end)}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Paper>
  );
};

export default MetricsSummary;