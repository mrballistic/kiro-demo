import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import App from '../App';
import userEvent from '@testing-library/user-event';

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
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const theme = createTheme();

const renderApp = (route = '/') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('End-to-End Application Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Complete Application Journey', () => {
    it('should complete full onboarding and data management journey', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // 1. User starts on dashboard - sees getting started
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText(/to begin tracking code generation metrics/i)).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
      expect(screen.getByText('Import Data')).toBeInTheDocument();
      
      // 2. User clicks on Developers tab from getting started
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      // Should see empty state
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
        expect(screen.getByText(/no developers found/i)).toBeInTheDocument();
      });
      
      // 3. User navigates to Import Data
      await user.click(screen.getByRole('tab', { name: /import data/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
        expect(screen.getByText('Sample Data Management')).toBeInTheDocument();
      });
      
      // 4. User generates sample data
      await user.click(screen.getByRole('button', { name: /generate sample data/i }));
      
      // Should see success notification
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // 5. User goes back to developers to see data
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
        expect(screen.queryByText(/no developers found/i)).not.toBeInTheDocument();
        expect(screen.getByText(/total developers/i)).toBeInTheDocument();
      });
      
      // 6. User clicks on a developer to see details
      const developerCards = screen.getAllByText(/dev-/i);
      await user.click(developerCards[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Developer Details')).toBeInTheDocument();
        expect(screen.getByText(/dev-\d+/)).toBeInTheDocument();
        expect(screen.getByText('Total Commits')).toBeInTheDocument();
        expect(screen.getByText('Lines Added')).toBeInTheDocument();
      });
      
      // 7. User goes back to list
      await user.click(screen.getByRole('button', { name: /back to list/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
      
      // 8. User checks dashboard to see populated data
      await user.click(screen.getByRole('tab', { name: /dashboard/i }));
      
      await waitFor(() => {
        expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
        expect(screen.getByText('Development Activity')).toBeInTheDocument();
        expect(screen.getByText('Total Commits')).toBeInTheDocument();
      });
      
      // 9. User cleans up data
      await user.click(screen.getByRole('tab', { name: /import data/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all data/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /clear all data/i }));
      
      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/all data cleared successfully/i)).toBeInTheDocument();
      });
      
      // 10. Verify dashboard is back to getting started
      await user.click(screen.getByRole('tab', { name: /dashboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
      });
    });

    it('should handle complex filtering and time range operations', async () => {
      const user = userEvent.setup();
      
      // Pre-populate with time-varied data
      const developers = [
        {
          id: '1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          startDate: '2024-01-01',
          endDate: '2024-02-28'
        },
        {
          id: '2',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          startDate: '2024-01-15',
          endDate: '2024-02-15'
        }
      ];
      
      const commits = [
        {
          id: '1',
          developerId: '1',
          timestamp: '2024-01-10T10:00:00Z',
          message: 'Initial commit',
          linesAdded: 100,
          linesRemoved: 0,
          filesChanged: 5,
          aiGenerated: true
        },
        {
          id: '2',
          developerId: '1',
          timestamp: '2024-02-10T10:00:00Z',
          message: 'Feature update',
          linesAdded: 150,
          linesRemoved: 25,
          filesChanged: 3,
          aiGenerated: false
        },
        {
          id: '3',
          developerId: '2',
          timestamp: '2024-01-20T10:00:00Z',
          message: 'Bug fix',
          linesAdded: 50,
          linesRemoved: 10,
          filesChanged: 2,
          aiGenerated: true
        }
      ];
      
      mockLocalStorage.setItem('kiro-metrics-data', JSON.stringify({
        developers,
        commits
      }));
      
      renderApp();
      
      // 1. Navigate to developers
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
      
      // 2. Test time range filtering
      const timeRangeSelect = screen.getByRole('combobox', { name: /time range/i });
      await user.click(timeRangeSelect);
      
      // Select January only
      await waitFor(async () => {
        const januaryOption = screen.getByRole('option', { name: /january/i });
        await user.click(januaryOption);
      });
      
      // Verify data is filtered by time
      await waitFor(() => {
        // Should still show both developers but with filtered metrics
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
      
      // 3. Navigate to dashboard to see filtered data
      await user.click(screen.getByRole('tab', { name: /dashboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Development Activity')).toBeInTheDocument();
        // Charts should reflect filtered timeframe
        expect(screen.getByText('Total Commits')).toBeInTheDocument();
      });
    });

    it('should handle error scenarios and recovery', async () => {
      const user = userEvent.setup();
      
      // Mock console.error to capture errors
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderApp();
      
      // 1. Start normal workflow
      await user.click(screen.getByRole('tab', { name: /import data/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
      });
      
      // 2. Generate data
      await user.click(screen.getByRole('button', { name: /generate sample data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // 3. Navigate to different sections to ensure error boundaries work
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('tab', { name: /dashboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Development Activity')).toBeInTheDocument();
      });
      
      // 4. Application should be stable - no error boundaries triggered
      expect(screen.queryByText(/oops! something went wrong/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/error occurred/i)).not.toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should maintain data persistence across browser sessions', async () => {
      const user = userEvent.setup();
      
      // 1. Generate data in first "session"
      renderApp();
      
      await user.click(screen.getByRole('tab', { name: /import data/i }));
      await user.click(screen.getByRole('button', { name: /generate sample data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // 2. Verify data is in localStorage
      const storedData = mockLocalStorage.getItem('kiro-metrics-data');
      expect(storedData).toBeTruthy();
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.developers).toHaveLength(10); // Default sample size
      expect(parsedData.commits.length).toBeGreaterThan(0);
      
      // 3. Simulate new "session" - re-render app
      renderApp();
      
      // 4. Navigate to dashboard - should show data immediately
      await waitFor(() => {
        expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
        expect(screen.getByText('Development Activity')).toBeInTheDocument();
      });
      
      // 5. Navigate to developers - data should be preserved
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
        expect(screen.getByText(/total developers/i)).toBeInTheDocument();
      });
    });

    it('should handle accessibility requirements throughout the application', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // 1. Check initial accessibility
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // 2. Navigate using keyboard
      const importTab = screen.getByRole('tab', { name: /import data/i });
      importTab.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
      });
      
      // 3. Check form accessibility
      const generateButton = screen.getByRole('button', { name: /generate sample data/i });
      expect(generateButton).toBeInTheDocument();
      
      // 4. Navigate to developers with keyboard
      const developersTab = screen.getByRole('tab', { name: /developers/i });
      developersTab.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
      
      // 5. Check accessibility throughout navigation
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle team management scenario', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // Manager wants to track team performance
      // 1. Setup data
      await user.click(screen.getByRole('tab', { name: /import data/i }));
      await user.click(screen.getByRole('button', { name: /generate sample data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // 2. View team overview
      await user.click(screen.getByRole('tab', { name: /dashboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Development Activity')).toBeInTheDocument();
        expect(screen.getByText('Total Commits')).toBeInTheDocument();
        expect(screen.getByText('Lines Added')).toBeInTheDocument();
      });
      
      // 3. Drill down into individual developers
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
      
      // 4. Select a developer for detailed review
      const developerCards = screen.getAllByText(/dev-/i);
      await user.click(developerCards[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Developer Details')).toBeInTheDocument();
        expect(screen.getByText('Total Commits')).toBeInTheDocument();
        expect(screen.getByText('Lines Added')).toBeInTheDocument();
        expect(screen.getByText('Lines Removed')).toBeInTheDocument();
      });
      
      // 5. Return to team view for comparison
      await user.click(screen.getByRole('button', { name: /back to list/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Developer Team Metrics')).toBeInTheDocument();
      });
    });

    it('should handle data cleanup scenario', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // Admin wants to clean up old data
      // 1. Generate test data
      await user.click(screen.getByRole('tab', { name: /import data/i }));
      await user.click(screen.getByRole('button', { name: /generate sample data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/sample data generated successfully/i)).toBeInTheDocument();
      });
      
      // 2. Verify data exists
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/total developers/i)).toBeInTheDocument();
      });
      
      // 3. Clear all data
      await user.click(screen.getByRole('tab', { name: /import data/i }));
      await user.click(screen.getByRole('button', { name: /clear all data/i }));
      
      // 4. Confirm action
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/all data cleared successfully/i)).toBeInTheDocument();
      });
      
      // 5. Verify data is gone
      await user.click(screen.getByRole('tab', { name: /developers/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/no developers found/i)).toBeInTheDocument();
      });
      
      // 6. Dashboard should show getting started
      await user.click(screen.getByRole('tab', { name: /dashboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
      });
    });
  });
});
