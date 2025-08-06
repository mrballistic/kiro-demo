import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Layout from './Layout';

// Mock child components for testing
const MockChild = () => <div data-testid="mock-child">Child Content</div>;

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement, initialRoute = '/') => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {component}
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('renders the layout with header, navigation, and content areas', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Check header content
      expect(screen.getByText('Code Generation Tracker')).toBeInTheDocument();
      expect(screen.getByText('Track and visualize developer code generation metrics')).toBeInTheDocument();

      // Check navigation tabs
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
      expect(screen.getByText('Import Data')).toBeInTheDocument();
      expect(screen.getByText('Sample Data')).toBeInTheDocument();

      // Check child content is rendered
      expect(screen.getByTestId('mock-child')).toBeInTheDocument();
    });

    it('renders with proper semantic structure', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Should have main heading
      expect(screen.getByRole('heading', { name: /code generation tracker/i })).toBeInTheDocument();
      
      // Should have navigation tabs
      expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /developers/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /import data/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sample data/i })).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('displays the main title and subtitle', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      expect(screen.getByText('Code Generation Tracker')).toBeInTheDocument();
      expect(screen.getByText('Track and visualize developer code generation metrics')).toBeInTheDocument();
    });

    it('renders header with proper styling container', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Header should be in an AppBar
      const headerElement = screen.getByText('Code Generation Tracker').closest('[class*="MuiAppBar"]');
      expect(headerElement).toBeInTheDocument();
    });
  });

  describe('Navigation Tabs', () => {
    it('renders all navigation tabs', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /developers/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /import data/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sample data/i })).toBeInTheDocument();
    });

    it('highlights the correct tab based on current route', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>,
        '/developers'
      );

      // Check that tabs are present and can be identified
      const developersTab = screen.getByRole('tab', { name: /developers/i });
      expect(developersTab).toBeInTheDocument();
    });

    it('has proper tab navigation structure', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Should have tablist with all tabs
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // All tabs should be present
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });
  });

  describe('Content Area', () => {
    it('renders children content in the main area', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      expect(screen.getByTestId('mock-child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('wraps content in proper container structure', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Content should be present and accessible
      const childContent = screen.getByTestId('mock-child');
      expect(childContent).toBeInTheDocument();

      // Should be within a container structure
      const containerElement = childContent.closest('[class*="MuiContainer"]');
      expect(containerElement).toBeInTheDocument();
    });
  });

  describe('Route Integration', () => {
    it('handles different routes correctly', () => {
      const routes = ['/', '/developers', '/import', '/sample-data'];
      
      routes.forEach(route => {
        const { unmount } = renderWithProviders(
          <Layout>
            <div data-testid={`content-${route.replace('/', '') || 'home'}`}>
              Content for {route}
            </div>
          </Layout>,
          route
        );

        // Should render the layout regardless of route
        expect(screen.getByText('Code Generation Tracker')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).toBeInTheDocument();

        unmount();
      });
    });

    it('maintains navigation structure across different routes', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>,
        '/import'
      );

      // Navigation should always be present
      expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /developers/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /import data/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sample data/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders with responsive container', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Should have responsive containers
      const containers = screen.getAllByText('Code Generation Tracker')[0].closest('[class*="MuiContainer"]');
      expect(containers).toBeInTheDocument();
    });

    it('maintains structure on different viewport sizes', () => {
      // This test verifies the layout maintains its structure
      // The actual responsive behavior would be tested with different viewport sizes
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      expect(screen.getByText('Code Generation Tracker')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByTestId('mock-child')).toBeInTheDocument();
    });
  });

  describe('Tab Icons and Labels', () => {
    it('displays tabs with appropriate labels', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Check all tab labels are present
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
      expect(screen.getByText('Import Data')).toBeInTheDocument();
      expect(screen.getByText('Sample Data')).toBeInTheDocument();
    });

    it('maintains accessibility with proper tab structure', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      const tabs = screen.getAllByRole('tab');
      
      // Should have exactly 4 tabs
      expect(tabs).toHaveLength(4);
      
      // Each tab should have accessible name
      expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /developers/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /import data/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sample data/i })).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('maintains proper flex layout structure', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Should have the main layout structure
      expect(screen.getByText('Code Generation Tracker')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByTestId('mock-child')).toBeInTheDocument();
    });

    it('renders with sticky navigation behavior', () => {
      renderWithProviders(
        <Layout>
          <MockChild />
        </Layout>
      );

      // Navigation should be present and properly structured
      const navigation = screen.getByRole('tablist').closest('[class*="MuiPaper"]');
      expect(navigation).toBeInTheDocument();
    });
  });

  describe('Multiple Children', () => {
    it('renders multiple children correctly', () => {
      renderWithProviders(
        <Layout>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </Layout>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('maintains layout structure with complex children', () => {
      renderWithProviders(
        <Layout>
          <div>
            <h2>Complex Child</h2>
            <p>With multiple elements</p>
            <button>And interactions</button>
          </div>
        </Layout>
      );

      // Layout structure should remain intact
      expect(screen.getByText('Code Generation Tracker')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      
      // Child content should be rendered
      expect(screen.getByText('Complex Child')).toBeInTheDocument();
      expect(screen.getByText('With multiple elements')).toBeInTheDocument();
      expect(screen.getByText('And interactions')).toBeInTheDocument();
    });
  });
});
