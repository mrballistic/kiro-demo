import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Fade,
  Stack,
} from '@mui/material';

interface LoadingIndicatorProps {
  /**
   * The type of loading indicator to display
   */
  variant?: 'circular' | 'linear' | 'skeleton';
  /**
   * Size of the loading indicator
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Progress value (0-100) for determinate progress
   */
  progress?: number;
  /**
   * Whether to show the loading indicator inline or centered
   */
  inline?: boolean;
  /**
   * Minimum height for centered loading indicators
   */
  minHeight?: number | string;
  /**
   * Whether to fade in the loading indicator
   */
  fadeIn?: boolean;
  /**
   * Custom color for the progress indicator
   */
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

/**
 * Comprehensive loading indicator component with multiple variants and customization options
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  variant = 'circular',
  size = 'medium',
  message,
  progress,
  inline = false,
  minHeight = 200,
  fadeIn = true,
  color = 'primary',
}) => {
  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { circularSize: 24, typography: 'body2' as const };
      case 'large':
        return { circularSize: 56, typography: 'h6' as const };
      default:
        return { circularSize: 40, typography: 'body1' as const };
    }
  };

  const { circularSize, typography } = getSizeValues();

  const renderProgressIndicator = () => {
    switch (variant) {
      case 'linear':
        return (
          <LinearProgress
            variant={progress !== undefined ? 'determinate' : 'indeterminate'}
            value={progress}
            color={color}
            sx={{ width: '100%', borderRadius: 1 }}
          />
        );
      case 'circular':
      default:
        return (
          <CircularProgress
            variant={progress !== undefined ? 'determinate' : 'indeterminate'}
            value={progress}
            size={circularSize}
            color={color}
          />
        );
    }
  };

  const content = (
    <Stack
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{
        ...(inline
          ? { display: 'inline-flex', flexDirection: 'row', gap: 1 }
          : { minHeight, textAlign: 'center' }),
      }}
    >
      {renderProgressIndicator()}
      {message && (
        <Typography
          variant={typography}
          color="text.secondary"
          sx={{
            ...(inline && { fontSize: '0.875rem' }),
          }}
        >
          {message}
          {progress !== undefined && ` (${Math.round(progress)}%)`}
        </Typography>
      )}
    </Stack>
  );

  if (fadeIn) {
    return (
      <Fade in timeout={300}>
        <Box>{content}</Box>
      </Fade>
    );
  }

  return <Box>{content}</Box>;
};

export default LoadingIndicator;
