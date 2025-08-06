import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default loading message', () => {
    render(<LoadingSpinner />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Check for MUI CircularProgress component
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Processing data...';
    render(<LoadingSpinner message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders with empty message', () => {
    render(<LoadingSpinner message="" />);

    // For empty message, the text should be empty
    const text = screen.getByText('');
    expect(text).toBeInTheDocument();
    
    // Check that CircularProgress is present
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('has correct MUI component structure', () => {
    render(<LoadingSpinner message="Test message" />);

    // Check for Typography component with correct text
    const message = screen.getByText('Test message');
    expect(message).toBeInTheDocument();

    // Check for CircularProgress component
    const progress = document.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();

    // Check container is a Box (div)
    const container = message.closest('div');
    expect(container).toBeInTheDocument();
  });

  it('renders accessibility-friendly structure', () => {
    render(<LoadingSpinner message="Loading content" />);

    // The message should be accessible to screen readers
    const message = screen.getByText('Loading content');
    expect(message).toBeInTheDocument();

    // CircularProgress should have proper role
    const progress = document.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
    
    // Should have proper structure with Box container
    const container = message.closest('div');
    expect(container).toBeInTheDocument();
  });

  it('handles long messages gracefully', () => {
    const longMessage = 'This is a very long loading message that might wrap to multiple lines and should still display properly';
    render(<LoadingSpinner message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('handles special characters in message', () => {
    const specialMessage = 'Loading... 50% complete! @#$%^&*()';
    render(<LoadingSpinner message={specialMessage} />);

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it('has CircularProgress component with correct structure', () => {
    render(<LoadingSpinner />);

    // Check for CircularProgress component
    const progress = document.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
    
    // Check it's a CircularProgress by looking for SVG
    const svg = progress?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
