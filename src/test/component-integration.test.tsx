import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import { AppProvider } from '../context/AppContext';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import DeveloperList from '../components/DeveloperList';
import DataImport from '../components/DataImport';

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

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvider>
          {ui}
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Component Integration Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Layout and Navigation Integration', () => {
    it('should navigate between different pages correctly', async () => {
      renderWithProviders(
        <Layout>
          <div data-testid="page-content">Test Content</div>
        </Layout>
      );
      
      // Check that layout renders
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      
      // Check navigation tabs are present
      expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /developers/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /import data/i })).toBeInTheDocument();
    });

    it('should handle tab navigation correctly', async () => {
      renderWithProviders(
        <Layout>
          <div data-testid="page-content">Test Content</div>
        </Layout>
      );
      
      // Navigate to developers tab
      const developersTab = screen.getByRole('tab', { name: /developers/i });
      fireEvent.click(developersTab);
      
      await waitFor(() => {
        // The URL should have changed (though we can't easily test this in MemoryRouter)
        expect(developersTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Dashboard Integration', () => {
    it('should display getting started when no data exists', () => {
      renderWithProviders(<Dashboard />);
      
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText(/to begin tracking code generation metrics/i)).toBeInTheDocument();
    });

    it('should show dashboard content when data exists', () => {
      // Pre-populate with data
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers: [
          { id: '1', name: 'Test Dev', email: 'test@example.com', startDate: '2024-01-01', endDate: '2024-01-31' }
        ],
        commits: [
          {
            id: '1',
            developerId: '1',
            timestamp: '2024-01-15T10:00:00Z',
            message: 'Test commit',
            linesAdded: 100,
            linesRemoved: 20,
            filesChanged: 3,
            aiGenerated: true
          }
        ]
      }));
      
      renderWithProviders(<Dashboard />);
      
      expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
      expect(screen.getByText('Development Activity')).toBeInTheDocument();
    });
  });

  describe('Developer List Integration', () => {
    it('should display empty state when no developers exist', () => {
      renderWithProviders(<DeveloperList />);
      
      expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      expect(screen.getByText(/no developers found/i)).toBeInTheDocument();
    });

    it('should display developers when data exists', () => {
      // Pre-populate with data
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers: [
          { id: '1', name: 'Alice Smith', email: 'alice@example.com', startDate: '2024-01-01', endDate: '2024-01-31' },
          { id: '2', name: 'Bob Johnson', email: 'bob@example.com', startDate: '2024-01-01', endDate: '2024-01-31' }
        ],
        commits: [
          {
            id: '1',
            developerId: '1',
            timestamp: '2024-01-15T10:00:00Z',
            message: 'Test commit',
            linesAdded: 100,
            linesRemoved: 20,
            filesChanged: 3,
            aiGenerated: true
          }
        ]
      }));
      
      renderWithProviders(<DeveloperList />);
      
      expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText(/total developers/i)).toBeInTheDocument();
    });

    it('should handle developer selection', async () => {
      // Pre-populate with data
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers: [
          { id: '1', name: 'Alice Smith', email: 'alice@example.com', startDate: '2024-01-01', endDate: '2024-01-31' }
        ],
        commits: [
          {
            id: '1',
            developerId: '1',
            timestamp: '2024-01-15T10:00:00Z',
            message: 'Test commit',
            linesAdded: 100,
            linesRemoved: 20,
            filesChanged: 3,
            aiGenerated: true
          }
        ]
      }));
      
      renderWithProviders(<DeveloperList />);
      
      // Click on developer
      const developerCard = screen.getByText('Alice Smith');
      fireEvent.click(developerCard);
      
      // Should navigate to developer detail page (URL will change)
      await waitFor(() => {
        expect(screen.getByText('Developer Details')).toBeInTheDocument();
      });
    });
  });

  describe('Data Import Integration', () => {
    it('should display data import interface', () => {
      renderWithProviders(<DataImport />);
      
      expect(screen.getByText('Data Import')).toBeInTheDocument();
      expect(screen.getByText('Sample Data Management')).toBeInTheDocument();
    });

    it('should handle sample data generation', async () => {
      renderWithProviders(<DataImport />);
      
      const generateButton = screen.getByRole('button', { name: /generate sample data/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle data clearing', async () => {
      // Pre-populate with data
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers: [{ id: '1', name: 'Test Dev', email: 'test@example.com' }],
        commits: []
      }));
      
      renderWithProviders(<DataImport />);
      
      const clearButton = screen.getByRole('button', { name: /clear all data/i });
      fireEvent.click(clearButton);
      
      // Confirm in dialog
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/all data cleared successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should handle complete data flow from generation to display', async () => {
      // Start with empty data
      renderWithProviders(<DataImport />);
      
      // Generate sample data
      const generateButton = screen.getByRole('button', { name: /generate sample data/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // Check that data was stored
      const storedData = mockLocalStorage.getItem('kiro-metrics-data');
      expect(storedData).toBeTruthy();
      
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.developers).toHaveLength(10); // Default sample size
      expect(parsedData.commits.length).toBeGreaterThan(0);
    });

    it('should handle data persistence across component renders', () => {
      // Set up initial data
      const testData = {
        developers: [
          { id: '1', name: 'Persistent Dev', email: 'persistent@example.com', startDate: '2024-01-01', endDate: '2024-01-31' }
        ],
        commits: [
          {
            id: '1',
            developerId: '1',
            timestamp: '2024-01-15T10:00:00Z',
            message: 'Persistent commit',
            linesAdded: 50,
            linesRemoved: 10,
            filesChanged: 2,
            aiGenerated: true
          }
        ]
      };
      
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify(testData));
      
      // Render dashboard - should show data
      const { rerender } = renderWithProviders(<Dashboard />);
      expect(screen.getByText('Development Activity')).toBeInTheDocument();
      
      // Re-render with DeveloperList - should still have data
      rerender(
        <MemoryRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppProvider>
              <DeveloperList />
            </AppProvider>
          </ThemeProvider>
        </MemoryRouter>
      );
      
      expect(screen.getByText('Persistent Dev')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed data gracefully', () => {
      // Set malformed data
      mockLocalStorage.setItem('kiro-metrics-data', 'invalid json');
      
      renderWithProviders(<Dashboard />);
      
      // Should fall back to getting started state
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('should handle missing data fields gracefully', () => {
      // Set incomplete data
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers: [{ id: '1', name: 'Incomplete Dev' }], // Missing required fields
        commits: []
      }));
      
      renderWithProviders(<DeveloperList />);
      
      // Should still render without crashing
      expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
    });
  });
});
