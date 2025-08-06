import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  AlertTitle,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableReporting?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  showReportDialog: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      showReportDialog: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Log to error tracking service (if configured)
    if (import.meta.env.PROD) {
      // Here you would integrate with error tracking services like Sentry, LogRocket, etc.
      console.error('Production error logged:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined,
      showReportDialog: false,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleShowReport = () => {
    this.setState({ showReportDialog: true });
  };

  handleCloseReport = () => {
    this.setState({ showReportDialog: false });
  };

  handleCopyErrorDetails = async () => {
    const errorDetails = this.formatErrorDetails();
    try {
      await navigator.clipboard.writeText(errorDetails);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  formatErrorDetails = (): string => {
    const { error, errorInfo, errorId } = this.state;
    return [
      `Error ID: ${errorId}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error: ${error?.toString()}`,
      `Stack: ${error?.stack}`,
      `Component Stack: ${errorInfo?.componentStack}`,
      `User Agent: ${navigator.userAgent}`,
      `URL: ${window.location.href}`,
    ].join('\n\n');
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <>
          <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                
                <Typography variant="h4" component="h2" gutterBottom color="error">
                  Oops! Something went wrong
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                  We're sorry, but an unexpected error occurred. Our team has been notified and we're working to fix it.
                </Typography>

                {this.state.errorId && (
                  <Box sx={{ mb: 3 }}>
                    <Chip 
                      label={`Error ID: ${this.state.errorId}`}
                      size="small"
                      variant="outlined"
                      color="error"
                    />
                  </Box>
                )}

                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent="center"
                  sx={{ mb: 3 }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleReset}
                    size="large"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={this.handleGoHome}
                    size="large"
                  >
                    Go Home
                  </Button>

                  {this.props.enableReporting && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<BugReportIcon />}
                      onClick={this.handleShowReport}
                      size="large"
                    >
                      Report Issue
                    </Button>
                  )}
                </Stack>

                {this.props.showErrorDetails && this.state.error && (
                  <Box sx={{ textAlign: 'left', mt: 4 }}>
                    <Alert severity="error" sx={{ textAlign: 'left' }}>
                      <AlertTitle>Error Details</AlertTitle>
                      <Box 
                        component="pre" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          mt: 1,
                          p: 2,
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        {this.state.error.toString()}
                      </Box>
                    </Alert>
                  </Box>
                )}
              </Paper>
            </Box>
          </Container>

          {/* Error Report Dialog */}
          <Dialog 
            open={this.state.showReportDialog} 
            onClose={this.handleCloseReport}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Report Error</Typography>
                <IconButton onClick={this.handleCloseReport}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                The following error details will help us fix this issue:
              </Typography>
              <Box
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  p: 2,
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                  color: theme => theme.palette.text.primary,
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                  border: 1,
                  borderColor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
                }}
              >
                {this.formatErrorDetails()}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<CopyIcon />}
                onClick={this.handleCopyErrorDetails}
              >
                Copy Details
              </Button>
              <Button onClick={this.handleCloseReport}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;