import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SampleDataManager from './SampleDataManager';

// Mock the useDummyData hook
const mockUseDummyData = vi.fn();
vi.mock('../hooks/useDummyData', () => ({
  useDummyData: () => mockUseDummyData(),
}));

// Mock the dataRepository
const mockDataRepository = {
  getStorageInfo: vi.fn(),
};
vi.mock('../services/dataRepository', () => ({
  dataRepository: mockDataRepository,
}));

// Mock the DummyDataIndicator component
vi.mock('./DummyDataIndicator', () => ({
  default: ({ isDummyData, showControls }: { isDummyData: boolean; showControls: boolean }) => (
    <div data-testid="dummy-data-indicator">
      {isDummyData ? 'Sample Data Active' : 'Real Data'} - Controls: {showControls ? 'Yes' : 'No'}
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

const mockOnDataChange = vi.fn();

describe('SampleDataManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock returns for useDummyData
    mockUseDummyData.mockReturnValue({
      isDummyData: true,
      isLoading: false,
      error: null,
      generateNewSampleData: vi.fn().mockResolvedValue(undefined),
      clearSampleData: vi.fn().mockResolvedValue(undefined),
      refreshDummyDataStatus: vi.fn().mockResolvedValue(undefined),
    });

    // Default mock for storage info
    mockDataRepository.getStorageInfo.mockReturnValue({
      used: 1024000,
      available: 5000000,
      percentage: 20.48,
    });
  });

  describe('Component Rendering', () => {
    it('renders the component with title and main sections', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Sample Data Management')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /sample data management/i })).toBeInTheDocument();
    });

    it('displays the dummy data indicator with correct props', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const indicator = screen.getByTestId('dummy-data-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Sample Data Active - Controls: Yes');
    });

    it('renders sample data status section', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Sample Data Status')).toBeInTheDocument();
      expect(screen.getByText('Current Mode:')).toBeInTheDocument();
      expect(screen.getByText('Sample Data Active')).toBeInTheDocument();
    });

    it('renders sample data controls section', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Sample Data Controls')).toBeInTheDocument();
      expect(screen.getByText('Generate New Sample Data')).toBeInTheDocument();
      expect(screen.getByText('Clear Sample Data')).toBeInTheDocument();
    });
  });

  describe('Storage Information', () => {
    it('displays storage usage information when available', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Storage Usage:')).toBeInTheDocument();
      expect(screen.getByText('1,024,000 bytes (20.5%)')).toBeInTheDocument();
    });

    it('handles missing storage information gracefully', () => {
      mockDataRepository.getStorageInfo.mockReturnValue(null);

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Sample Data Status')).toBeInTheDocument();
      expect(screen.queryByText('Storage Usage:')).not.toBeInTheDocument();
    });

    it('handles storage info error gracefully', () => {
      mockDataRepository.getStorageInfo.mockImplementation(() => {
        throw new Error('Storage access failed');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Sample Data Status')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get storage info:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Data State Display', () => {
    it('shows correct mode when dummy data is active', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: vi.fn(),
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Sample Data Active')).toBeInTheDocument();
    });

    it('shows correct mode when real data is active', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
        isLoading: false,
        error: null,
        generateNewSampleData: vi.fn(),
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Real Data')).toBeInTheDocument();
    });
  });

  describe('Sample Data Controls', () => {
    it('enables controls when sample data is active', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const generateButton = screen.getByText('Generate New Sample Data');
      const clearButton = screen.getByText('Clear Sample Data');

      expect(generateButton).toBeEnabled();
      expect(clearButton).toBeEnabled();
    });

    it('disables clear button when no dummy data exists', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: false,
        isLoading: false,
        error: null,
        generateNewSampleData: vi.fn(),
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const clearButton = screen.getByText('Clear Sample Data');
      expect(clearButton).toBeDisabled();
    });

    it('disables controls when loading', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: true,
        error: null,
        generateNewSampleData: vi.fn(),
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const generateButton = screen.getByText('Generating...');
      const clearButton = screen.getByText('Clear Sample Data');

      expect(generateButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Generate New Sample Data', () => {
    it('calls generateNewSampleData when button is clicked', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(undefined);
      const mockRefresh = vi.fn().mockResolvedValue(undefined);

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: mockGenerate,
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: mockRefresh,
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const generateButton = screen.getByText('Generate New Sample Data');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledTimes(1);
        expect(mockRefresh).toHaveBeenCalledTimes(1);
        expect(mockOnDataChange).toHaveBeenCalledTimes(1);
      });
    });

    it('shows success message after successful generation', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(undefined);

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: mockGenerate,
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn().mockResolvedValue(undefined),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const generateButton = screen.getByText('Generate New Sample Data');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('New sample data generated successfully!')).toBeInTheDocument();
      });
    });

    it('shows error message when generation fails', async () => {
      const mockGenerate = vi.fn().mockRejectedValue(new Error('Generation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: mockGenerate,
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const generateButton = screen.getByText('Generate New Sample Data');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to generate new sample data. Please try again.')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Clear Sample Data', () => {
    it('shows confirmation dialog when clear button is clicked', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const clearButton = screen.getByText('Clear Sample Data');
      fireEvent.click(clearButton);

      expect(screen.getByText('Clear Sample Data?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to clear all sample data? This action cannot be undone.')).toBeInTheDocument();
    });

    it('cancels clear operation when cancel is clicked', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const clearButton = screen.getByText('Clear Sample Data');
      fireEvent.click(clearButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Clear Sample Data?')).not.toBeInTheDocument();
    });

    it('clears data when confirmed', async () => {
      const mockClear = vi.fn().mockResolvedValue(undefined);

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: vi.fn(),
        clearSampleData: mockClear,
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      // Open dialog
      const clearButton = screen.getByText('Clear Sample Data');
      fireEvent.click(clearButton);

      // Confirm
      const confirmButton = screen.getByText('Clear Data');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockClear).toHaveBeenCalledTimes(1);
        expect(mockOnDataChange).toHaveBeenCalledTimes(1);
      });
    });

    it('shows success message after successful clear', async () => {
      const mockClear = vi.fn().mockResolvedValue(undefined);

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: vi.fn(),
        clearSampleData: mockClear,
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText('Clear Sample Data'));
      fireEvent.click(screen.getByText('Clear Data'));

      await waitFor(() => {
        expect(screen.getByText('Sample data cleared successfully!')).toBeInTheDocument();
      });
    });

    it('shows error message when clear fails', async () => {
      const mockClear = vi.fn().mockRejectedValue(new Error('Clear failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: vi.fn(),
        clearSampleData: mockClear,
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText('Clear Sample Data'));
      fireEvent.click(screen.getByText('Clear Data'));

      await waitFor(() => {
        expect(screen.getByText('Failed to clear sample data. Please try again.')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Information Dialog', () => {
    it('opens information dialog when Learn More button is clicked', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const learnMoreButton = screen.getByText('Learn More About Sample Data');
      fireEvent.click(learnMoreButton);

      expect(screen.getByText('About Sample Data')).toBeInTheDocument();
      expect(screen.getByText(/code generation tracker includes sample data functionality/i)).toBeInTheDocument();
    });

    it('closes information dialog when close button is clicked', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      // Open dialog
      const learnMoreButton = screen.getByText('Learn More About Sample Data');
      fireEvent.click(learnMoreButton);

      // Close dialog
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('About Sample Data')).not.toBeInTheDocument();
    });

    it('displays comprehensive information about sample data', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const learnMoreButton = screen.getByText('Learn More About Sample Data');
      fireEvent.click(learnMoreButton);

      expect(screen.getByText('Sample Data Includes:')).toBeInTheDocument();
      expect(screen.getByText('5-8 Fictional Developers')).toBeInTheDocument();
      expect(screen.getByText('3-6 Months of History')).toBeInTheDocument();
      expect(screen.getByText('Varied Activity Patterns')).toBeInTheDocument();
      expect(screen.getByText('Local Storage')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays error when dummy data hook has an error', () => {
      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: 'Failed to load dummy data',
        generateNewSampleData: vi.fn(),
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn(),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByText('Failed to load dummy data')).toBeInTheDocument();
    });
  });

  describe('Snackbar Notifications', () => {
    it('closes snackbar when close button is clicked', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(undefined);

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: mockGenerate,
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn().mockResolvedValue(undefined),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      // Trigger success message
      const generateButton = screen.getByText('Generate New Sample Data');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('New sample data generated successfully!')).toBeInTheDocument();
      });

      // Find and click close button on snackbar
      const alert = screen.getByText('New sample data generated successfully!').closest('[role="alert"]');
      const closeButton = alert?.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('New sample data generated successfully!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByRole('heading', { name: /sample data management/i })).toBeInTheDocument();
      expect(screen.getByText('Sample Data Status')).toBeInTheDocument();
      expect(screen.getByText('Sample Data Controls')).toBeInTheDocument();
    });

    it('has accessible buttons', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      expect(screen.getByRole('button', { name: /generate new sample data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear sample data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /learn more about sample data/i })).toBeInTheDocument();
    });

    it('has accessible dialogs', () => {
      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      // Open clear confirmation dialog
      fireEvent.click(screen.getByText('Clear Sample Data'));
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Clear Sample Data?')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('calls onDataChange callback when provided', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(undefined);

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: mockGenerate,
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn().mockResolvedValue(undefined),
      });

      renderWithTheme(<SampleDataManager onDataChange={mockOnDataChange} />);

      const generateButton = screen.getByText('Generate New Sample Data');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnDataChange).toHaveBeenCalledTimes(1);
      });
    });

    it('works without onDataChange callback', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(undefined);

      mockUseDummyData.mockReturnValue({
        isDummyData: true,
        isLoading: false,
        error: null,
        generateNewSampleData: mockGenerate,
        clearSampleData: vi.fn(),
        refreshDummyDataStatus: vi.fn().mockResolvedValue(undefined),
      });

      renderWithTheme(<SampleDataManager />);

      const generateButton = screen.getByText('Generate New Sample Data');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledTimes(1);
      });
    });
  });
});
