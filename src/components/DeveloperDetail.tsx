import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Code as CodeIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  InsertDriveFile as FileIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Developer } from '../types';
import MetricsChart from './MetricsChart';

interface DeveloperDetailProps {
  developer: Developer;
}

const DeveloperDetail: React.FC<DeveloperDetailProps> = ({ developer }) => {
  // Calculate summary statistics
  const totalCommits = developer.metrics.length;
  const totalLinesAdded = developer.metrics.reduce((sum, metric) => sum + metric.linesAdded, 0);
  const totalLinesRemoved = developer.metrics.reduce((sum, metric) => sum + metric.linesRemoved, 0);
  const totalFilesModified = developer.metrics.reduce((sum, metric) => sum + metric.filesModified, 0);
  const netLinesChanged = totalLinesAdded - totalLinesRemoved;
  const linesPerFileRatio = totalFilesModified > 0 ? (totalLinesAdded / totalFilesModified) : 0;

  // Get date range
  const sortedMetrics = [...developer.metrics].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const firstCommit = sortedMetrics.length > 0 ? sortedMetrics[0].timestamp : null;
  const lastCommit = sortedMetrics.length > 0 ? sortedMetrics[sortedMetrics.length - 1].timestamp : null;

  return (
    <Box>
      {/* Developer Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h2">
              {developer.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {developer.email}
            </Typography>
          </Box>
        </Box>

        {firstCommit && lastCommit && (
          <Typography variant="body2" color="text.secondary">
            Active from {new Date(firstCommit).toLocaleDateString()} to {new Date(lastCommit).toLocaleDateString()}
          </Typography>
        )}
      </Paper>

      {/* Summary Statistics */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <CodeIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="div" gutterBottom>
              {totalCommits}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Commits
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <AddIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" component="div" gutterBottom>
              {totalLinesAdded.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lines Added
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <RemoveIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" component="div" gutterBottom>
              {totalLinesRemoved.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lines Removed
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <FileIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" component="div" gutterBottom>
              {totalFilesModified.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Files Modified
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Additional Metrics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          Calculated Metrics
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Net Lines Changed
            </Typography>
            <Chip
              label={`${netLinesChanged >= 0 ? '+' : ''}${netLinesChanged.toLocaleString()}`}
              color={netLinesChanged >= 0 ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Lines per File Ratio
            </Typography>
            <Chip
              label={linesPerFileRatio.toFixed(2)}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Stack>
      </Paper>

      {/* Metrics Chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          Code Metrics Over Time
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <MetricsChart
          metrics={developer.metrics}
          title={`${developer.name}'s Code Generation Metrics`}
          height={400}
        />
      </Paper>
    </Box>
  );
};

export default DeveloperDetail;