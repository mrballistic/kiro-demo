import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Science as SampleIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface DummyDataIndicatorProps {
  /**
   * Whether dummy data is currently being used
   */
  isDummyData: boolean;
  /**
   * Whether the indicator should be compact (chip-style) or full alert
   */
  compact?: boolean;
  /**
   * Show management controls (refresh, clear buttons)
   */
  showControls?: boolean;
  /**
   * Callback when sample data is refreshed
   */
  onRefreshSampleData?: () => Promise<void>;
  /**
   * Callback when sample data is cleared
   */
  onClearSampleData?: () => Promise<void>;
  /**
   * Whether any async operation is in progress
   */
  isLoading?: boolean;
}

/**
 * Visual indicator component for dummy/sample data with optional management controls
 */
export const DummyDataIndicator: React.FC<DummyDataIndicatorProps> = ({
  isDummyData,
  compact = false,
  showControls = false,
  onRefreshSampleData,
  onClearSampleData,
  isLoading = false,
}) => {
  if (!isDummyData) {
    return null;
  }

  if (compact) {
    return (
      <Tooltip title="This application is currently displaying sample/dummy data for demonstration purposes">
        <Chip
          icon={<SampleIcon />}
          label="Sample Data"
          color="warning"
          variant="outlined"
          size="small"
          sx={{
            fontWeight: 500,
            '& .MuiChip-icon': {
              fontSize: '1rem',
            },
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Alert 
      severity="info" 
      sx={{ 
        mb: 2,
        '& .MuiAlert-icon': {
          fontSize: '1.5rem',
        },
      }}
      icon={<SampleIcon />}
      action={
        showControls && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Get information about sample data">
              <IconButton
                color="inherit"
                size="small"
                onClick={() => {
                  // Could open a dialog with more information
                  console.log('Sample data info clicked');
                }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {onRefreshSampleData && (
              <Tooltip title="Generate new sample data">
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={onRefreshSampleData}
                  disabled={isLoading}
                  sx={{ minWidth: 'auto' }}
                >
                  Refresh
                </Button>
              </Tooltip>
            )}
            
            {onClearSampleData && (
              <Tooltip title="Clear all sample data">
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={onClearSampleData}
                  disabled={isLoading}
                  sx={{ minWidth: 'auto' }}
                >
                  Clear
                </Button>
              </Tooltip>
            )}
          </Stack>
        )
      }
    >
      <AlertTitle sx={{ fontWeight: 600 }}>
        Sample Data Mode
      </AlertTitle>
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>
          This application is currently displaying <strong>sample/dummy data</strong> for demonstration purposes.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The metrics and developer information you see are simulated and not from real repositories.
          {showControls 
            ? ' Use the controls above to generate new sample data or import real data.'
            : ' Import real git repository data to see actual metrics.'
          }
        </Typography>
      </Box>
    </Alert>
  );
};

export default DummyDataIndicator;
