import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DummyDataIndicator from './DummyDataIndicator';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DummyDataIndicator', () => {
  const mockOnRefreshSampleData = vi.fn();
  const mockOnClearSampleData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isDummyData is false', () => {
    renderWithTheme(
      <DummyDataIndicator isDummyData={false} />
    );
    
    expect(screen.queryByText('Sample Data')).not.toBeInTheDocument();
  });

  it('should render compact indicator when isDummyData is true and compact is true', () => {
    renderWithTheme(
      <DummyDataIndicator isDummyData={true} compact />
    );
    
    expect(screen.getByText('Sample Data')).toBeInTheDocument();
  });

  it('should render full alert when isDummyData is true and compact is false', () => {
    renderWithTheme(
      <DummyDataIndicator isDummyData={true} />
    );
    
    expect(screen.getByText('Sample Data Mode')).toBeInTheDocument();
    expect(screen.getByText(/sample\/dummy data/i)).toBeInTheDocument();
  });

  it('should show controls when showControls is true', () => {
    renderWithTheme(
      <DummyDataIndicator 
        isDummyData={true} 
        showControls 
        onRefreshSampleData={mockOnRefreshSampleData}
        onClearSampleData={mockOnClearSampleData}
      />
    );
    
    expect(screen.getByLabelText(/generate new sample data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clear all sample data/i)).toBeInTheDocument();
  });

  it('should call onRefreshSampleData when refresh button is clicked', async () => {
    mockOnRefreshSampleData.mockResolvedValue(undefined);
    
    renderWithTheme(
      <DummyDataIndicator 
        isDummyData={true} 
        showControls 
        onRefreshSampleData={mockOnRefreshSampleData}
      />
    );
    
    const refreshButton = screen.getByLabelText(/generate new sample data/i);
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockOnRefreshSampleData).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClearSampleData when clear button is clicked', async () => {
    mockOnClearSampleData.mockResolvedValue(undefined);
    
    renderWithTheme(
      <DummyDataIndicator 
        isDummyData={true} 
        showControls 
        onClearSampleData={mockOnClearSampleData}
      />
    );
    
    const clearButton = screen.getByLabelText(/clear all sample data/i);
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(mockOnClearSampleData).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable buttons when isLoading is true', () => {
    renderWithTheme(
      <DummyDataIndicator 
        isDummyData={true} 
        showControls 
        onRefreshSampleData={mockOnRefreshSampleData}
        onClearSampleData={mockOnClearSampleData}
        isLoading={true}
      />
    );
    
    const refreshButton = screen.getByLabelText(/generate new sample data/i);
    const clearButton = screen.getByLabelText(/clear all sample data/i);
    
    expect(refreshButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it('should show different messages with and without controls', () => {
    const { rerender } = renderWithTheme(
      <DummyDataIndicator isDummyData={true} showControls={false} />
    );
    
    expect(screen.getByText(/import real git repository data/i)).toBeInTheDocument();
    
    rerender(
      <ThemeProvider theme={theme}>
        <DummyDataIndicator isDummyData={true} showControls={true} />
      </ThemeProvider>
    );
    
    expect(screen.getByText(/use the controls above/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes for compact mode', () => {
    renderWithTheme(
      <DummyDataIndicator isDummyData={true} compact />
    );
    
    // Check that the Tooltip wrapper exists with the title attribute
    const tooltipElement = screen.getByText('Sample Data').closest('[title]');
    expect(tooltipElement).toBeTruthy();
    if (tooltipElement) {
      expect(tooltipElement).toHaveAttribute('title', 
        'This application is currently displaying sample/dummy data for demonstration purposes'
      );
    }
  });
});
