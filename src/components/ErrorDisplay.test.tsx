import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorDisplay } from './ErrorDisplay';

// Create a test theme
const theme = createTheme();

// Wrapper component for Material-UI
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('ErrorDisplay', () => {
  it('renders error message from string', () => {
    const errorMessage = 'Something went wrong';
    render(
      <TestWrapper>
        <ErrorDisplay error={errorMessage} />
      </TestWrapper>
    );
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders error message from Error object', () => {
    const error = new Error('Test error message');
    render(
      <TestWrapper>
        <ErrorDisplay error={error} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    const title = 'Custom Error Title';
    render(
      <TestWrapper>
        <ErrorDisplay error="Test error" title={title} />
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('shows retry button when showRetry is true', () => {
    const onRetry = vi.fn();
    render(
      <TestWrapper>
        <ErrorDisplay error="Test error" showRetry onRetry={onRetry} />
      </TestWrapper>
    );
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button when dismissible is true', () => {
    const onDismiss = vi.fn();
    render(
      <TestWrapper>
        <ErrorDisplay error="Test error" dismissible onDismiss={onDismiss} />
      </TestWrapper>
    );
    
    const dismissButton = screen.getByRole('button', { name: /close/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders with different severity levels', () => {
    const { rerender } = render(
      <TestWrapper>
        <ErrorDisplay error="Test error" severity="error" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    rerender(
      <TestWrapper>
        <ErrorDisplay error="Test warning" severity="warning" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    rerender(
      <TestWrapper>
        <ErrorDisplay error="Test info" severity="info" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows technical details when enabled', () => {
    const error = new Error('Test error');
    error.stack = 'Error stack trace';
    
    render(
      <TestWrapper>
        <ErrorDisplay error={error} showTechnicalDetails />
      </TestWrapper>
    );
    
    expect(screen.getByText(/Error stack trace/)).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(
      <TestWrapper>
        <ErrorDisplay error="Test error" compact />
      </TestWrapper>
    );
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders custom actions when provided', () => {
    const customAction = <button>Custom Action</button>;
    render(
      <TestWrapper>
        <ErrorDisplay error="Test error" actions={customAction} />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
  });

  it('normalizes ErrorInfo object correctly', () => {
    const errorInfo = {
      message: 'Test error message',
      details: 'Error details',
      code: 'ERR001',
      timestamp: new Date('2024-01-01'),
    };
    
    render(
      <TestWrapper>
        <ErrorDisplay error={errorInfo} showTechnicalDetails />
      </TestWrapper>
    );
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText(/Error details/)).toBeInTheDocument();
    expect(screen.getByText(/ERR001/)).toBeInTheDocument();
  });
});
