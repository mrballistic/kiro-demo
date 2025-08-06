import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Card,
  CardContent,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import DummyDataIndicator from './DummyDataIndicator';
import { useDummyData } from '../hooks/useDummyData';

const Dashboard: React.FC = () => {
  const { isDummyData } = useDummyData();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
        >
          <DashboardIcon />
          Dashboard
        </Typography>

        <DummyDataIndicator isDummyData={isDummyData} />

        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Welcome to Code Generation Tracker</AlertTitle>
          This dashboard will show overview metrics and charts. Navigate to the Developers section to view tracked developers and their code generation metrics.
        </Alert>

        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          mb: 4
        }}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Metrics Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View comprehensive metrics and statistics for all tracked developers
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <TimelineIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Time Series Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analyze code generation trends over time with interactive charts
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <AssessmentIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Performance Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get insights into developer productivity and code quality metrics
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Getting Started
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            To begin tracking code generation metrics:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Navigate to the <strong>Developers</strong> section to view currently tracked developers
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Use the <strong>Import Data</strong> section to import git repository snapshot data
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Return to this dashboard to view comprehensive analytics and insights
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;