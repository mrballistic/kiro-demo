import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LoadingIndicator } from './LoadingIndicator';

// Create a test theme
const theme = createTheme();

// Wrapper component for Material-UI
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('LoadingIndicator', () => {
  it('renders circular loading indicator by default', () => {
    render(
      <TestWrapper>
        <LoadingIndicator />
      </TestWrapper>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders loading message when provided', () => {
    const message = 'Loading data...';
    render(
      <TestWrapper>
        <LoadingIndicator message={message} />
      </TestWrapper>
    );
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders linear progress when variant is linear', () => {
    render(
      <TestWrapper>
        <LoadingIndicator variant="linear" />
      </TestWrapper>
    );
    
    // Linear progress should still have a progressbar role
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows progress value when provided', () => {
    render(
      <TestWrapper>
        <LoadingIndicator variant="linear" progress={50} />
      </TestWrapper>
    );
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <TestWrapper>
        <LoadingIndicator size="small" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    rerender(
      <TestWrapper>
        <LoadingIndicator size="large" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders inline loading indicator', () => {
    render(
      <TestWrapper>
        <LoadingIndicator inline message="Loading..." />
      </TestWrapper>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies fade in animation when enabled', () => {
    render(
      <TestWrapper>
        <LoadingIndicator fadeIn />
      </TestWrapper>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with custom color', () => {
    render(
      <TestWrapper>
        <LoadingIndicator color="secondary" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
