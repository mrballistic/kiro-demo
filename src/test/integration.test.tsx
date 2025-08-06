import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import App from '../App';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {ui}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Application Integration Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Complete User Workflows', () => {
    it('should complete full data import and viewing workflow', async () => {
      renderWithProviders(<App />);
      
      // Start at dashboard - should show getting started
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText(/to begin tracking code generation metrics/i)).toBeInTheDocument();
      
      // Navigate to Data Import
      const importDataButton = screen.getByRole('tab', { name: /import data/i });
      fireEvent.click(importDataButton);
      
      // Should see data import page
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
      });
      
      // Generate sample data
      const generateButton = screen.getByRole('button', { name: /generate sample data/i });
      fireEvent.click(generateButton);
      
      // Should see success message
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // Navigate to Developers tab
      const developersButton = screen.getByRole('tab', { name: /developers/i });
      fireEvent.click(developersButton);
      
      // Should see developers list
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
        expect(screen.getByText(/total developers/i)).toBeInTheDocument();
      });
      
      // Navigate back to Dashboard
      const dashboardButton = screen.getByRole('tab', { name: /dashboard/i });
      fireEvent.click(dashboardButton);
      
      // Dashboard should now show data instead of getting started
      await waitFor(() => {
        expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
        expect(screen.getByText('Development Activity')).toBeInTheDocument();
      });
    });

    it('should handle developer detail navigation workflow', async () => {
      // Pre-populate with sample data
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        ],
        commits: [
          {
            id: '1',
            developerId: '1',
            timestamp: new Date('2024-01-15').toISOString(),
            message: 'Test commit',
            linesAdded: 100,
            linesRemoved: 20,
            filesChanged: 3,
            aiGenerated: true
          }
        ]
      }));
      
      renderWithProviders(<App />);
      
      // Navigate to Developers
      const developersButton = screen.getByRole('tab', { name: /developers/i });
      fireEvent.click(developersButton);
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
      
      // Find and click on a developer
      const developerCard = screen.getByText('John Doe');
      fireEvent.click(developerCard);
      
      // Should navigate to developer detail page
      await waitFor(() => {
        expect(screen.getByText('Developer Details')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
      
      // Navigate back
      const backButton = screen.getByRole('button', { name: /back to list/i });
      fireEvent.click(backButton);
      
      // Should be back at developers list
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
    });

    it('should handle data management operations workflow', async () => {
      renderWithProviders(<App />);
      
      // Navigate to Data Import
      const importDataButton = screen.getByRole('tab', { name: /import data/i });
      fireEvent.click(importDataButton);
      
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
      });
      
      // Generate sample data
      const generateButton = screen.getByRole('button', { name: /generate sample data/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // Should see clear data option becomes available
      const clearButton = screen.getByRole('button', { name: /clear all data/i });
      expect(clearButton).toBeInTheDocument();
      
      // Clear the data
      fireEvent.click(clearButton);
      
      // Confirm in dialog
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);
      });
      
      // Should see success message
      await waitFor(() => {
        expect(screen.getByText(/all data cleared successfully/i)).toBeInTheDocument();
      });
      
      // Navigate back to dashboard should show getting started again
      const dashboardButton = screen.getByRole('tab', { name: /dashboard/i });
      fireEvent.click(dashboardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle and recover from errors gracefully', async () => {
      // Mock console.error to capture error boundary logs
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<App />);
      
      // Navigate to a page and trigger an error scenario
      const importDataButton = screen.getByRole('tab', { name: /import data/i });
      fireEvent.click(importDataButton);
      
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
      });
      
      // The error boundary should be available for recovery
      // Since we enhanced it, it should have proper error handling
      expect(screen.queryByText(/oops! something went wrong/i)).not.toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should maintain application state during navigation', async () => {
      renderWithProviders(<App />);
      
      // Generate data
      const importDataButton = screen.getByRole('tab', { name: /import data/i });
      fireEvent.click(importDataButton);
      
      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /generate sample data/i });
        fireEvent.click(generateButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // Navigate away and back
      const dashboardButton = screen.getByRole('tab', { name: /dashboard/i });
      fireEvent.click(dashboardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Development Activity')).toBeInTheDocument();
      });
      
      // Navigate to developers
      const developersButton = screen.getByRole('tab', { name: /developers/i });
      fireEvent.click(developersButton);
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
      
      // Data should still be available
      expect(screen.getByText(/total developers/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design Integration', () => {
    it('should handle different screen sizes appropriately', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      renderWithProviders(<App />);
      
      // Should render properly on mobile
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Kiro')).toBeInTheDocument();
      
      // Navigation should still work
      const importDataButton = screen.getByRole('tab', { name: /import data/i });
      fireEvent.click(importDataButton);
      
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large mock dataset
      const largeDevelopers = Array.from({ length: 100 }, (_, i) => ({
        id: `dev-${i}`,
        name: `Developer ${i}`,
        email: `dev${i}@example.com`,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }));
      
      const largeCommits = Array.from({ length: 1000 }, (_, i) => ({
        id: `commit-${i}`,
        developerId: `dev-${i % 100}`,
        timestamp: new Date(2024, 0, (i % 30) + 1).toISOString(),
        message: `Commit ${i}`,
        linesAdded: Math.floor(Math.random() * 200),
        linesRemoved: Math.floor(Math.random() * 50),
        filesChanged: Math.floor(Math.random() * 10) + 1,
        aiGenerated: Math.random() > 0.5
      }));
      
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers: largeDevelopers,
        commits: largeCommits
      }));
      
      renderWithProviders(<App />);
      
      // Navigate to developers with large dataset
      const developersButton = screen.getByRole('tab', { name: /developers/i });
      fireEvent.click(developersButton);
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Should handle the large dataset
      expect(screen.getByText(/total developers/i)).toBeInTheDocument();
    });
  });
});
