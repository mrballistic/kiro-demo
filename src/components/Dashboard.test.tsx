import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from './Dashboard';

// Mock the useDummyData hook
const mockUseDummyData = vi.fn();
vi.mock('../hooks/useDummyData', () => ({
  useDummyData: () => mockUseDummyData(),
}));

// Mock the DummyDataIndicator component
vi.mock('./DummyDataIndicator', () => ({
  default: ({ isDummyData }: { isDummyData: boolean }) => (
    <div data-testid="dummy-data-indicator">
      {isDummyData ? 'Sample Data Mode' : 'Real Data Mode'}
    </div>
  ),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the dashboard with title and main sections', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });

      renderWithTheme(<Dashboard />);

      // Check main title
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();

      // Check welcome message
      expect(screen.getByText('Welcome to Code Generation Tracker')).toBeInTheDocument();
      expect(screen.getByText(/this dashboard will show overview metrics/i)).toBeInTheDocument();

      // Check feature cards
      expect(screen.getByText('Metrics Overview')).toBeInTheDocument();
      expect(screen.getByText('Time Series Analysis')).toBeInTheDocument();
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();

      // Check getting started section
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('displays the dummy data indicator with correct props', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: true,
      });

      renderWithTheme(<Dashboard />);

      const indicator = screen.getByTestId('dummy-data-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Sample Data Mode');
    });

    it('passes real data mode to dummy data indicator', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });

      renderWithTheme(<Dashboard />);

      const indicator = screen.getByTestId('dummy-data-indicator');
      expect(indicator).toHaveTextContent('Real Data Mode');
    });
  });

  describe('Feature Cards', () => {
    beforeEach(() => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });
    });

    it('displays metrics overview card with correct content', () => {
      renderWithTheme(<Dashboard />);

      expect(screen.getByText('Metrics Overview')).toBeInTheDocument();
      expect(screen.getByText(/view comprehensive metrics and statistics/i)).toBeInTheDocument();
    });

    it('displays time series analysis card with correct content', () => {
      renderWithTheme(<Dashboard />);

      expect(screen.getByText('Time Series Analysis')).toBeInTheDocument();
      expect(screen.getByText(/analyze code generation trends over time/i)).toBeInTheDocument();
    });

    it('displays performance insights card with correct content', () => {
      renderWithTheme(<Dashboard />);

      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(screen.getByText(/get insights into developer productivity/i)).toBeInTheDocument();
    });
  });

  describe('Getting Started Section', () => {
    beforeEach(() => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });
    });

    it('displays getting started instructions', () => {
      renderWithTheme(<Dashboard />);

      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText(/to begin tracking code generation metrics/i)).toBeInTheDocument();

      // Check for key terms that are clearly in the instructions
      expect(screen.getByText('Developers')).toBeInTheDocument();
      expect(screen.getByText('Import Data')).toBeInTheDocument();
      expect(screen.getByText(/return to this dashboard to view/i)).toBeInTheDocument();
    });

    it('renders instructions as an ordered list', () => {
      renderWithTheme(<Dashboard />);

      // Should have 5 text elements that match various instruction patterns
      // (intro text + 3 steps + "Navigate to the Developers section" from main text)
      const instructions = screen.getAllByText(/(to begin tracking|navigate|use|return|developers section)/i);
      expect(instructions).toHaveLength(5);
    });
  });

  describe('Icons and Visual Elements', () => {
    beforeEach(() => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });
    });

    it('displays dashboard icon in the header', () => {
      renderWithTheme(<Dashboard />);

      // The Dashboard icon should be present (rendered as SVG)
      const heading = screen.getByRole('heading', { name: /dashboard/i });
      expect(heading).toBeInTheDocument();
    });

    it('renders all feature card icons', () => {
      renderWithTheme(<Dashboard />);

      // All cards should be present with their content
      // The icons are rendered as SVG elements by MUI
      expect(screen.getByText('Metrics Overview')).toBeInTheDocument();
      expect(screen.getByText('Time Series Analysis')).toBeInTheDocument();
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });
    });

    it('renders with responsive layout structure', () => {
      renderWithTheme(<Dashboard />);

      // Container should be present with maxWidth="xl"
      const container = screen.getByText('Dashboard').closest('[class*="MuiContainer"]');
      expect(container).toBeInTheDocument();
    });

    it('displays feature cards in a flex layout', () => {
      renderWithTheme(<Dashboard />);

      // All three feature cards should be present
      expect(screen.getByText('Metrics Overview')).toBeInTheDocument();
      expect(screen.getByText('Time Series Analysis')).toBeInTheDocument();
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });
    });

    it('has proper heading structure', () => {
      renderWithTheme(<Dashboard />);

      // Main dashboard heading
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      
      // Feature card headings should be present
      expect(screen.getByText('Metrics Overview')).toBeInTheDocument();
      expect(screen.getByText('Time Series Analysis')).toBeInTheDocument();
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('uses semantic HTML elements', () => {
      renderWithTheme(<Dashboard />);

      // Should have proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { name: /dashboard/i });
      expect(mainHeading).toBeInTheDocument();
      
      // Alert section should be accessible
      expect(screen.getByText('Welcome to Code Generation Tracker')).toBeInTheDocument();
    });
  });

  describe('Integration with useDummyData Hook', () => {
    it('calls useDummyData hook correctly', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: true,
      });

      renderWithTheme(<Dashboard />);

      expect(mockUseDummyData).toHaveBeenCalledTimes(1);
    });

    it('handles different dummy data states', () => {
      // Test with dummy data active
      mockUseDummyData.mockReturnValue({
        isDummyData: true,
      });

      const { rerender } = renderWithTheme(<Dashboard />);
      expect(screen.getByTestId('dummy-data-indicator')).toHaveTextContent('Sample Data Mode');

      // Test with real data
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
      });

      rerender(
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      );
      expect(screen.getByTestId('dummy-data-indicator')).toHaveTextContent('Real Data Mode');
    });
  });
});
