import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Stack,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Science as SampleIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Assessment as MetricsIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useDummyData } from '../hooks/useDummyData';
import { dataRepository } from '../services/dataRepository';
import DummyDataIndicator from './DummyDataIndicator';

interface SampleDataManagerProps {
  /**
   * Callback when data changes (refresh parent components)
   */
  onDataChange?: () => void;
}

/**
 * Component for managing sample/dummy data with full controls and information
 */
export const SampleDataManager: React.FC<SampleDataManagerProps> = ({
  onDataChange,
}) => {
  const {
    isDummyData,
    isLoading: dummyDataLoading,
    error: dummyDataError,
    generateNewSampleData,
    clearSampleData,
    refreshDummyDataStatus,
  } = useDummyData();

  const [isOperating, setIsOperating] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    available: number;
    percentage: number;
  } | null>(null);

  React.useEffect(() => {
    // Get storage information
    try {
      const info = dataRepository.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  }, [isDummyData]);

  const handleRefreshSampleData = async () => {
    try {
      setIsOperating(true);
      await generateNewSampleData();
      await refreshDummyDataStatus();
      onDataChange?.();
      
      setSnackbar({
        open: true,
        message: 'New sample data generated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to refresh sample data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate new sample data. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsOperating(false);
    }
  };

  const handleClearSampleData = async () => {
    try {
      setIsOperating(true);
      setShowClearDialog(false);
      await clearSampleData();
      onDataChange?.();
      
      setSnackbar({
        open: true,
        message: 'Sample data cleared successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to clear sample data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to clear sample data. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsOperating(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isLoading = dummyDataLoading || isOperating;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 2 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
        >
          <SampleIcon />
          Sample Data Management
        </Typography>

        {dummyDataError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {dummyDataError}
          </Alert>
        )}

        <DummyDataIndicator
          isDummyData={isDummyData}
          showControls
          onRefreshSampleData={handleRefreshSampleData}
          onClearSampleData={async () => setShowClearDialog(true)}
          isLoading={isLoading}
        />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6">
                    Sample Data Status
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Mode:
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {isDummyData ? 'Sample Data Active' : 'Real Data'}
                    </Typography>
                  </Box>

                  {storageInfo && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Storage Usage:
                      </Typography>
                      <Typography variant="body1">
                        {storageInfo.used.toLocaleString()} bytes ({storageInfo.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<InfoIcon />}
                    onClick={() => setShowInfoDialog(true)}
                    fullWidth
                  >
                    Learn More About Sample Data
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SampleIcon color="primary" />
                  <Typography variant="h6">
                    Sample Data Controls
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                    onClick={handleRefreshSampleData}
                    disabled={isLoading}
                    fullWidth
                  >
                    {isLoading ? 'Generating...' : 'Generate New Sample Data'}
                  </Button>

                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ClearIcon />}
                    onClick={() => setShowClearDialog(true)}
                    disabled={isLoading || !isDummyData}
                    fullWidth
                  >
                    Clear Sample Data
                  </Button>

                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {isDummyData 
                      ? 'Controls are available while sample data is active'
                      : 'Import real data or generate sample data to use controls'
                    }
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Information Dialog */}
        <Dialog 
          open={showInfoDialog} 
          onClose={() => setShowInfoDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            About Sample Data
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setShowInfoDialog(false)}
              sx={{ ml: 'auto' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" paragraph>
              The Code Generation Tracker includes sample data functionality to demonstrate
              its features without requiring real git repository data.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Sample Data Includes:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="5-8 Fictional Developers"
                  secondary="Each with unique coding patterns and activity levels"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TimelineIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="3-6 Months of History"
                  secondary="Realistic commit patterns excluding weekends"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><MetricsIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Varied Activity Patterns"
                  secondary="High-activity, moderate, low, and sporadic contributors"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><StorageIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Local Storage"
                  secondary="All sample data is stored locally in your browser"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Working with Sample Data:
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li><strong>Generate New:</strong> Creates fresh sample data with different developers and patterns</li>
                <li><strong>Clear Data:</strong> Removes all sample data to start fresh</li>
                <li><strong>Import Real Data:</strong> Replace sample data with actual git repository snapshots</li>
                <li><strong>Visual Indicators:</strong> Sample data mode is clearly marked throughout the application</li>
              </ul>
            </Typography>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Important Note
                </Typography>
              </Box>
              <Typography variant="body2">
                Sample data is for demonstration purposes only. Metrics and patterns
                are simulated and do not reflect real developer productivity or code quality.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInfoDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clear Confirmation Dialog */}
        <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Clear Sample Data?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to clear all sample data? This action cannot be undone.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You can generate new sample data or import real data afterwards.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowClearDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleClearSampleData}
              color="warning"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <ClearIcon />}
            >
              {isLoading ? 'Clearing...' : 'Clear Data'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default SampleDataManager;
