import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

export interface ErrorInfo {
  message: string;
  details?: string;
  code?: string;
  timestamp?: Date;
  context?: Record<string, unknown>;
  stack?: string;
}

interface ErrorDisplayProps {
  /**
   * Error information to display
   */
  error: ErrorInfo | Error | string;
  /**
   * Severity level of the error
   */
  severity?: 'error' | 'warning' | 'info';
  /**
   * Whether the error can be dismissed
   */
  dismissible?: boolean;
  /**
   * Whether to show retry button
   */
  showRetry?: boolean;
  /**
   * Callback when retry is clicked
   */
  onRetry?: () => void;
  /**
   * Callback when error is dismissed
   */
  onDismiss?: () => void;
  /**
   * Whether to show technical details in an expandable section
   */
  showTechnicalDetails?: boolean;
  /**
   * Custom title for the error
   */
  title?: string;
  /**
   * Whether to show in compact mode
   */
  compact?: boolean;
  /**
   * Additional actions to show
   */
  actions?: React.ReactNode;
}

/**
 * Comprehensive error display component with technical details and user-friendly messaging
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  severity = 'error',
  dismissible = false,
  showRetry = false,
  onRetry,
  onDismiss,
  showTechnicalDetails = true,
  title,
  compact = false,
  actions,
}) => {

  // Normalize error to ErrorInfo structure
  const normalizeError = (err: ErrorInfo | Error | string): ErrorInfo => {
    if (typeof err === 'string') {
      return { message: err, timestamp: new Date() };
    }
    if (err instanceof Error) {
      return {
        message: err.message,
        details: err.name,
        stack: err.stack,
        timestamp: new Date(),
      };
    }
    return {
      ...err,
      timestamp: err.timestamp || new Date(),
    };
  };

  const errorInfo = normalizeError(error);

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (severity) {
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatTechnicalDetails = () => {
    const details = [];
    
    if (errorInfo.code) {
      details.push(`Error Code: ${errorInfo.code}`);
    }
    
    if (errorInfo.details) {
      details.push(`Details: ${errorInfo.details}`);
    }
    
    if (errorInfo.timestamp) {
      details.push(`Timestamp: ${errorInfo.timestamp.toISOString()}`);
    }
    
    if (errorInfo.context) {
      details.push(`Context: ${JSON.stringify(errorInfo.context, null, 2)}`);
    }
    
    if (errorInfo.stack) {
      details.push(`Stack Trace:\n${errorInfo.stack}`);
    }
    
    return details.join('\n\n');
  };

  if (compact) {
    return (
      <Alert
        severity={severity}
        icon={getIcon()}
        onClose={dismissible ? onDismiss : undefined}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            {showRetry && onRetry && (
              <Button size="small" onClick={onRetry} startIcon={<RefreshIcon />}>
                Retry
              </Button>
            )}
            {actions}
          </Stack>
        }
      >
        {errorInfo.message}
      </Alert>
    );
  }

  return (
    <Alert
      severity={severity}
      icon={getIcon()}
      action={
        dismissible ? (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onDismiss}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        ) : undefined
      }
    >
      <AlertTitle>{getTitle()}</AlertTitle>
      
      <Typography variant="body2" paragraph>
        {errorInfo.message}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
        {showRetry && onRetry && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
        {actions}
      </Stack>

      {showTechnicalDetails && (errorInfo.details || errorInfo.code || errorInfo.stack) && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="technical-details-content"
            id="technical-details-header"
          >
            <Typography variant="subtitle2">
              Technical Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  p: 2,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {formatTechnicalDetails()}
              </Box>
              <Button
                size="small"
                startIcon={<CopyIcon />}
                onClick={() => copyToClipboard(formatTechnicalDetails())}
                sx={{ alignSelf: 'flex-start' }}
              >
                Copy Details
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Alert>
  );
};

export default ErrorDisplay;
