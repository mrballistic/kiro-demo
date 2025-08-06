import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box sx={{ py: 4 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              
              <Typography variant="h4" component="h2" gutterBottom color="error">
                Something went wrong
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
                size="large"
                sx={{ mb: 3 }}
              >
                Try Again
              </Button>
              
              {this.state.error && (
                <Box sx={{ textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="error-details-content"
                      id="error-details-header"
                    >
                      <Typography variant="subtitle2">
                        Error Details (for developers)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Alert severity="error">
                        <AlertTitle>Error Information</AlertTitle>
                        <Box component="pre" sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace',
                          mt: 1,
                          p: 2,
                          backgroundColor: 'background.paper',
                          borderRadius: 1,
                          border: 1,
                          borderColor: 'divider'
                        }}>
                          {this.state.error.toString()}
                          {this.state.errorInfo?.componentStack}
                        </Box>
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;