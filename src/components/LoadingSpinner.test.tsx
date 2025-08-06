import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default loading message', () => {
    render(<LoadingSpinner />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Check for spinner by finding a div inside the container
    const container = screen.getByText('Loading...').parentElement;
    const spinnerDiv = container?.querySelector('div:first-child');
    expect(spinnerDiv).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Processing data...';
    render(<LoadingSpinner message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders with empty message', () => {
    render(<LoadingSpinner message="" />);

    // For empty message, just check that the paragraph element exists
    const paragraphs = screen.getAllByRole('generic', { hidden: true });
    expect(paragraphs.length).toBeGreaterThan(0);
    
    // Check that spinner container is present
    const container = document.querySelector('div[class*="loadingContainer"]');
    expect(container).toBeInTheDocument();
  });

  it('has correct CSS module classes', () => {
    render(<LoadingSpinner message="Test message" />);

    // Check for CSS module class patterns
    const message = screen.getByText('Test message');
    const messageClassList = Array.from(message.classList);
    expect(messageClassList.some(cls => cls.includes('message'))).toBe(true);
    expect(message.tagName).toBe('P');

    // Check container has loadingContainer class pattern
    const container = message.parentElement;
    const containerClassList = Array.from(container?.classList || []);
    expect(containerClassList.some(cls => cls.includes('loadingContainer'))).toBe(true);
  });

  it('renders accessibility-friendly structure', () => {
    render(<LoadingSpinner message="Loading content" />);

    // The message should be accessible to screen readers
    const message = screen.getByText('Loading content');
    expect(message).toBeInTheDocument();
    expect(message.tagName).toBe('P');

    // Container should have proper structure
    const container = message.parentElement;
    expect(container).toBeInTheDocument();
    
    // Should have two child divs: spinner and message
    expect(container?.children).toHaveLength(2);
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

  it('has spinner element with correct structure', () => {
    render(<LoadingSpinner />);

    // Find the container and check for spinner div
    const container = document.querySelector('div[class*="loadingContainer"]');
    expect(container).toBeInTheDocument();
    
    const spinner = container?.querySelector('div[class*="spinner"]');
    expect(spinner).toBeInTheDocument();
  });
});
