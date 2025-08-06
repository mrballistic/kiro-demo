import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DeveloperList from './DeveloperList';
import { AppProvider } from '../context/AppContext';
import { dataRepository } from '../services/dataRepository';
import type { Developer } from '../types';

// Mock the data repository
vi.mock('../services/dataRepository', () => ({
  dataRepository: {
    initializeWithDummyData: vi.fn(),
    getDevelopers: vi.fn(),
  },
}));

const mockDataRepository = vi.mocked(dataRepository);

// Mock developers data
const mockDevelopers: Developer[] = [
  {
    id: 'dev-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    metrics: [
      {
        id: 'metric-1',
        developerId: 'dev-1',
        timestamp: new Date('2024-01-15'),
        linesAdded: 150,
        linesRemoved: 25,
        filesModified: 3,
        commitHash: 'abc123',
        repository: 'test-repo'
      },
      {
        id: 'metric-2',
        developerId: 'dev-1',
        timestamp: new Date('2024-01-16'),
        linesAdded: 200,
        linesRemoved: 50,
        filesModified: 5,
        commitHash: 'def456',
        repository: 'test-repo'
      }
    ]
  },
  {
    id: 'dev-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    metrics: [
      {
        id: 'metric-3',
        developerId: 'dev-2',
        timestamp: new Date('2024-01-17'),
        linesAdded: 100,
        linesRemoved: 10,
        filesModified: 2,
        commitHash: 'ghi789',
        repository: 'test-repo'
      }
    ]
  }
];

// Helper function to render component with context
const renderWithContext = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('DeveloperList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataRepository.initializeWithDummyData.mockResolvedValue(undefined);
    mockDataRepository.getDevelopers.mockResolvedValue(mockDevelopers);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when initializing', async () => {
      // Make the initialization take longer
      mockDataRepository.initializeWithDummyData.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithContext(<DeveloperList />);

      expect(screen.getByText('Initializing with sample data...')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Developers' })).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Initializing with sample data...')).not.toBeInTheDocument();
      });
    });

    it('should show loading state when component is loading', async () => {
      // Test that loading state is properly displayed
      // This test verifies the loading UI renders correctly
      mockDataRepository.initializeWithDummyData.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithContext(<DeveloperList />);

      // Should show loading state
      expect(screen.getByText('Initializing with sample data...')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Developers' })).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Initializing with sample data...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when initialization fails', async () => {
      const errorMessage = 'Failed to initialize data';
      mockDataRepository.initializeWithDummyData.mockRejectedValue(new Error(errorMessage));

      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('Error loading developers')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should show error message when getDevelopers fails', async () => {
      const errorMessage = 'Failed to fetch developers';
      mockDataRepository.getDevelopers.mockRejectedValue(new Error(errorMessage));

      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('Error loading developers')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should allow retry when error occurs', async () => {
      // First call fails, second succeeds
      mockDataRepository.getDevelopers
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockDevelopers);

      renderWithContext(<DeveloperList />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Error loading developers')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Click retry button
      fireEvent.click(screen.getByText('Try Again'));

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no developers exist', async () => {
      // Override the mock to return empty array
      mockDataRepository.initializeWithDummyData.mockResolvedValue(undefined);
      mockDataRepository.getDevelopers.mockResolvedValue([]);

      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('No Developers Found')).toBeInTheDocument();
        expect(screen.getByText(/No developers are currently being tracked/)).toBeInTheDocument();
        expect(screen.getByText('Import Data')).toBeInTheDocument();
      });
    });

    it('should log message when import button is clicked in empty state', async () => {
      mockDataRepository.getDevelopers.mockResolvedValue([]);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('Import Data')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Import Data'));
      expect(consoleSpy).toHaveBeenCalledWith('Import functionality will be implemented in task 12');

      consoleSpy.mockRestore();
    });
  });

  describe('Developer List Display', () => {
    it('should display all developers with correct information', async () => {
      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        // Check header shows correct count
        expect(screen.getByText('Developers (2)')).toBeInTheDocument();

        // Check first developer
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();

        // Check second developer
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      });
    });

    it('should display correct statistics for each developer', async () => {
      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        // John Doe has 2 commits, 350 lines added (150+200), 8 files modified (3+5)
        const johnCard = screen.getByLabelText('Select developer John Doe');
        expect(johnCard).toHaveTextContent('2'); // commits
        expect(johnCard).toHaveTextContent('350'); // lines added
        expect(johnCard).toHaveTextContent('8'); // files modified

        // Jane Smith has 1 commit, 100 lines added, 2 files modified
        const janeCard = screen.getByLabelText('Select developer Jane Smith');
        expect(janeCard).toHaveTextContent('1'); // commits
        expect(janeCard).toHaveTextContent('100'); // lines added
        expect(janeCard).toHaveTextContent('2'); // files modified
      });
    });

    it('should format large numbers with locale string', async () => {
      const developerWithLargeNumbers: Developer = {
        id: 'dev-large',
        name: 'Big Coder',
        email: 'big@example.com',
        metrics: [
          {
            id: 'metric-large',
            developerId: 'dev-large',
            timestamp: new Date('2024-01-15'),
            linesAdded: 1234567,
            linesRemoved: 123456,
            filesModified: 9876,
            commitHash: 'large123',
            repository: 'big-repo'
          }
        ]
      };

      mockDataRepository.getDevelopers.mockResolvedValue([developerWithLargeNumbers]);

      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('1,234,567')).toBeInTheDocument(); // lines added
        expect(screen.getByText('9,876')).toBeInTheDocument(); // files modified
      });
    });
  });

  describe('Developer Selection', () => {
    it('should handle developer selection via click', async () => {
      const onDeveloperSelect = vi.fn();
      renderWithContext(<DeveloperList onDeveloperSelect={onDeveloperSelect} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByLabelText('Select developer John Doe');
      fireEvent.click(johnCard);

      expect(onDeveloperSelect).toHaveBeenCalledWith(mockDevelopers[0]);
    });

    it('should handle developer selection via keyboard', async () => {
      const onDeveloperSelect = vi.fn();
      renderWithContext(<DeveloperList onDeveloperSelect={onDeveloperSelect} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByLabelText('Select developer John Doe');
      
      // Test Enter key
      fireEvent.keyDown(johnCard, { key: 'Enter' });
      expect(onDeveloperSelect).toHaveBeenCalledWith(mockDevelopers[0]);

      // Test Space key
      fireEvent.keyDown(johnCard, { key: ' ' });
      expect(onDeveloperSelect).toHaveBeenCalledTimes(2);
      expect(onDeveloperSelect).toHaveBeenLastCalledWith(mockDevelopers[0]);
    });

    it('should not trigger selection on other keys', async () => {
      const onDeveloperSelect = vi.fn();
      renderWithContext(<DeveloperList onDeveloperSelect={onDeveloperSelect} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByLabelText('Select developer John Doe');
      
      // Test other keys don't trigger selection
      fireEvent.keyDown(johnCard, { key: 'Tab' });
      fireEvent.keyDown(johnCard, { key: 'Escape' });
      fireEvent.keyDown(johnCard, { key: 'ArrowDown' });

      expect(onDeveloperSelect).not.toHaveBeenCalled();
    });

    it('should show selected indicator for selected developer', async () => {
      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByLabelText('Select developer John Doe');
      fireEvent.click(johnCard);

      await waitFor(() => {
        expect(screen.getByText('Selected')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button that reloads developers', async () => {
      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      // Clear the mock to track new calls
      mockDataRepository.getDevelopers.mockClear();

      fireEvent.click(screen.getByText('Refresh'));

      expect(mockDataRepository.getDevelopers).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh errors gracefully', async () => {
      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Make refresh fail
      mockDataRepository.getDevelopers.mockRejectedValueOnce(new Error('Refresh failed'));

      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(screen.getByText('Error loading developers')).toBeInTheDocument();
        expect(screen.getByText('Refresh failed')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check developer cards have proper accessibility
      const johnCard = screen.getByLabelText('Select developer John Doe');
      expect(johnCard).toBeInTheDocument();

      const janeCard = screen.getByLabelText('Select developer Jane Smith');
      expect(janeCard).toBeInTheDocument();

      // Check refresh button exists
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByLabelText('Select developer John Doe');
      
      // Should be focusable
      johnCard.focus();
      expect(document.activeElement).toBe(johnCard);
    });
  });

  describe('Component Integration', () => {
    it('should initialize data repository on mount', async () => {
      renderWithContext(<DeveloperList />);

      expect(mockDataRepository.initializeWithDummyData).toHaveBeenCalledTimes(1);
      
      await waitFor(() => {
        expect(mockDataRepository.getDevelopers).toHaveBeenCalledTimes(1);
      });
    });

    it('should not reload developers if already loaded', async () => {
      // First render
      const { rerender } = renderWithContext(<DeveloperList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Clear mocks to track new calls
      mockDataRepository.initializeWithDummyData.mockClear();
      mockDataRepository.getDevelopers.mockClear();

      // Re-render component
      rerender(
        <AppProvider>
          <DeveloperList />
        </AppProvider>
      );

      // Should not call data repository again since developers are already loaded
      expect(mockDataRepository.initializeWithDummyData).not.toHaveBeenCalled();
      expect(mockDataRepository.getDevelopers).not.toHaveBeenCalled();
    });
  });
});