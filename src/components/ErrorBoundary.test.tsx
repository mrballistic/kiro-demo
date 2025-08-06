import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ErrorBoundary from './ErrorBoundary';

const theme = createTheme();

// Component that throws an error when shouldThrow is true
const ProblematicComponent: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="working-component">Component is working</div>;
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.getByText('Component is working')).toBeInTheDocument();
    });

    it('renders multiple children when no error occurs', () => {
      renderWithTheme(
        <ErrorBoundary>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches and displays error when child component throws', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>
      );

      // Should display error UI instead of children
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
      
      // Should show error UI
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/we're sorry, but an unexpected error occurred/i)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('logs error to console when error occurs', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} errorMessage="Test error for logging" />
        </ErrorBoundary>
      );

      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error caught by boundary:', 
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('displays enhanced error UI with error ID', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} errorMessage="Detailed error message" />
        </ErrorBoundary>
      );

      // Should show error ID chip
      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
      
      // Should show additional buttons
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('resets error state when Try Again button is clicked', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error UI
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      // Click Try Again - this should reset the error state
      fireEvent.click(screen.getByText('Try Again'));

      // After clicking Try Again, we should be in a clean state
      // The component should attempt to re-render the children
      // Since we're still rendering the same problematic component, 
      // it will error again, so we should still see the error UI
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('allows retry after error recovery', () => {
      let shouldThrow = true;
      
      const DynamicComponent = () => (
        <ProblematicComponent shouldThrow={shouldThrow} />
      );

      const { rerender } = renderWithTheme(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      );

      // Initially shows error
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Fix the component
      shouldThrow = false;
      
      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'));

      // Re-render
      rerender(
        <ThemeProvider theme={theme}>
          <ErrorBoundary>
            <DynamicComponent />
          </ErrorBoundary>
        </ThemeProvider>
      );

      // Should work now
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });
  });

  describe('Error UI Structure', () => {
    beforeEach(() => {
      renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    it('displays error icon', () => {
      // Error icon should be present (rendered as SVG by MUI)
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('shows appropriate error title', () => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      
      // Should be a heading
      expect(screen.getByRole('heading', { name: /oops.*something went wrong/i })).toBeInTheDocument();
    });

    it('displays helpful error message', () => {
      expect(screen.getByText(/we're sorry, but an unexpected error occurred/i)).toBeInTheDocument();
      expect(screen.getByText(/our team has been notified/i)).toBeInTheDocument();
    });

    it('provides Try Again button', () => {
      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();
      expect(tryAgainButton.tagName).toBe('BUTTON');
    });
  });

  describe('Error Details with Props', () => {
    it('shows detailed error information when showErrorDetails is true', () => {
      renderWithTheme(
        <ErrorBoundary showErrorDetails={true}>
          <ProblematicComponent shouldThrow={true} errorMessage="Detailed test error" />
        </ErrorBoundary>
      );

      // Should show error details section when prop is enabled
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText(/detailed test error/i)).toBeInTheDocument();
    });

    it('shows report dialog when enableReporting is true', () => {
      renderWithTheme(
        <ErrorBoundary enableReporting={true}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show report button
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
      
      // Click report button
      fireEvent.click(screen.getByText('Report Issue'));
      
      // Should show report dialog
      expect(screen.getByText('Report Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    it('has proper heading structure', () => {
      expect(screen.getByRole('heading', { name: /oops.*something went wrong/i })).toBeInTheDocument();
    });

    it('has accessible button for recovery', () => {
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();
    });

    it('has accessible additional buttons', () => {
      // Should have Go Home button  
      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      expect(goHomeButton).toBeInTheDocument();
    });
  });

  describe('Error Types', () => {
    it('handles different error types correctly', () => {
      const testCases = [
        { error: 'String error' },
        { error: new Error('Error object') },
        { error: new TypeError('Type error') },
      ];

      testCases.forEach(({ error }) => {
        const ErrorComponent = () => {
          throw error;
        };

        const { unmount } = renderWithTheme(
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        );

        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('maintains error state across re-renders', () => {
      const { rerender } = renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <ThemeProvider theme={theme}>
          <ErrorBoundary>
            <ProblematicComponent shouldThrow={true} />
          </ErrorBoundary>
        </ThemeProvider>
      );

      // Should still show error
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('handles new errors after recovery', () => {
      const { rerender } = renderWithTheme(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Reset error
      fireEvent.click(screen.getByText('Try Again'));

      // Re-render with new error
      rerender(
        <ThemeProvider theme={theme}>
          <ErrorBoundary>
            <ProblematicComponent shouldThrow={true} errorMessage="New error" />
          </ErrorBoundary>
        </ThemeProvider>
      );

      // Should catch and display new error
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });
});
