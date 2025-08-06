import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DataImport from './DataImport';
import { AppProvider } from '../context/AppContext';
import { dataRepository } from '../services/dataRepository';
import type { SnapshotData } from '../types';

// Mock the data repository
vi.mock('../services/dataRepository', () => ({
  dataRepository: {
    importSnapshot: vi.fn(),
    getDevelopers: vi.fn(),
  },
}));

const mockDataRepository = vi.mocked(dataRepository);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme();
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AppProvider>
          {children}
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Sample valid snapshot data (as it would appear in JSON)
const validSnapshotData = {
  repository: 'test-repo',
  commits: [
    {
      hash: 'abc123',
      author: 'John Doe',
      email: 'john@example.com',
      timestamp: '2024-01-15T10:30:00Z',
      linesAdded: 100,
      linesRemoved: 20,
      filesModified: ['src/file1.js', 'src/file2.js'],
    },
    {
      hash: 'def456',
      author: 'Jane Smith',
      email: 'jane@example.com',
      timestamp: '2024-01-16T14:20:00Z',
      linesAdded: 50,
      linesRemoved: 10,
      filesModified: ['src/file3.js'],
    },
  ],
};

// Helper function to create a mock file
const createMockFile = (content: string, filename = 'test.json', type = 'application/json') => {
  const blob = new Blob([content], { type });
  return new File([blob], filename, { type });
};

describe('DataImport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataRepository.getDevelopers.mockResolvedValue([]);
    mockDataRepository.importSnapshot.mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the import interface correctly', () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    expect(screen.getByText('Import Data')).toBeInTheDocument();
    expect(screen.getByText('Upload Snapshot Data')).toBeInTheDocument();
    expect(screen.getByText('Select File')).toBeInTheDocument();
    expect(screen.getByText('Expected Data Format')).toBeInTheDocument();
  });

  it('shows drag and drop interface', () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    expect(screen.getByText(/Drag and drop a JSON file here/)).toBeInTheDocument();
  });

  it('handles successful file import', async () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile(JSON.stringify(validSnapshotData));

    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Wait for import to complete
    await waitFor(() => {
      expect(screen.getByText('Import Successful')).toBeInTheDocument();
    });

    expect(screen.getByText('Data imported successfully!')).toBeInTheDocument();
    expect(screen.getByText('2 developers')).toBeInTheDocument();
    expect(screen.getByText('2 commits')).toBeInTheDocument();
    expect(screen.getByText('test-repo')).toBeInTheDocument();

    expect(mockDataRepository.importSnapshot).toHaveBeenCalledWith(validSnapshotData);
    expect(mockDataRepository.getDevelopers).toHaveBeenCalled();
  });

  it('handles invalid JSON file', async () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile('invalid json content');

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Import Failed')).toBeInTheDocument();
    });

    expect(screen.getByText(/Invalid JSON format/)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const invalidData = {
      repository: 'test-repo',
      commits: [
        {
          // Missing required fields
          hash: 'abc123',
          author: 'John Doe',
          // email missing
          // timestamp missing
          linesAdded: 100,
          linesRemoved: 20,
          filesModified: ['file1.js'],
        },
      ],
    };

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile(JSON.stringify(invalidData));

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Import Failed')).toBeInTheDocument();
    });

    expect(screen.getByText(/Validation failed/)).toBeInTheDocument();
  });

  it('validates data types', async () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const invalidData = {
      repository: 'test-repo',
      commits: [
        {
          hash: 'abc123',
          author: 'John Doe',
          email: 'john@example.com',
          timestamp: '2024-01-15T10:30:00Z',
          linesAdded: 'not-a-number', // Invalid type
          linesRemoved: -5, // Negative number
          filesModified: 'not-an-array', // Invalid type
        },
      ],
    };

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile(JSON.stringify(invalidData));

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Import Failed')).toBeInTheDocument();
    });

    expect(screen.getByText(/Validation failed/)).toBeInTheDocument();
  });

  it('shows validation errors with details', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const invalidData = {
      repository: 'test-repo',
      commits: [
        {
          hash: 'abc123',
          author: 'John Doe',
          // Missing email and timestamp
          linesAdded: 100,
          linesRemoved: 20,
          filesModified: ['file1.js'],
        },
      ],
    };

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile(JSON.stringify(invalidData));

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Validation Errors/)).toBeInTheDocument();
    });

    // Click to expand error details - look for the unnamed button (expand/collapse)
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons.find(button => 
      button.getAttribute('aria-label') === null && 
      !button.textContent?.includes('Select File') &&
      !button.getAttribute('aria-label')?.includes('reset')
    );
    expect(expandButton).toBeDefined();
    await user.click(expandButton!);

    expect(screen.getByText(/Field 'email' is required/)).toBeInTheDocument();
    expect(screen.getByText(/Field 'timestamp' is required/)).toBeInTheDocument();
  });

  it('handles import service errors', async () => {
    mockDataRepository.importSnapshot.mockRejectedValue(new Error('Database connection failed'));
    
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile(JSON.stringify(validSnapshotData));

    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Import Failed')).toBeInTheDocument();
    });

    expect(screen.getByText(/Database connection failed/)).toBeInTheDocument();
  });

  it('shows progress indicator during import', async () => {
    // Mock a delayed import
    mockDataRepository.importSnapshot.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile(JSON.stringify(validSnapshotData));

    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Should show progress indicator
    expect(screen.getByText('Importing data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Import Successful')).toBeInTheDocument();
    });
  });

  it('allows resetting import results', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile(JSON.stringify(validSnapshotData));

    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Import Successful')).toBeInTheDocument();
    });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset import/i });
    await user.click(resetButton);

    // Success message should be gone
    expect(screen.queryByText('Import Successful')).not.toBeInTheDocument();
  });

  it('handles drag and drop functionality', async () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const dropZone = screen.getByText(/Drag and drop a JSON file here/).closest('div');
    expect(dropZone).toBeInTheDocument();

    // Simulate drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [createMockFile(JSON.stringify(validSnapshotData))],
      },
    });

    expect(screen.getByText('Drop your JSON file here')).toBeInTheDocument();

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [createMockFile(JSON.stringify(validSnapshotData))],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Import Successful')).toBeInTheDocument();
    });
  });

  it('rejects non-JSON files in drag and drop', async () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    const dropZone = screen.getByText(/Drag and drop a JSON file here/).closest('div');
    const textFile = createMockFile('some text', 'test.txt', 'text/plain');

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [textFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Import Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Please select a JSON file')).toBeInTheDocument();
  });

  it('displays expected data format correctly', () => {
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    expect(screen.getByText('Expected Data Format')).toBeInTheDocument();
    expect(screen.getByText(/The JSON file should contain snapshot data/)).toBeInTheDocument();
    
    // Check if the code example is displayed
    const codeExample = screen.getByText(/"repository": "project-name"/);
    expect(codeExample).toBeInTheDocument();
  });

  it('limits validation error display to 10 items', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <DataImport />
      </TestWrapper>
    );

    // Create data with many validation errors
    const invalidData = {
      repository: 'test-repo',
      commits: Array.from({ length: 15 }, (_, i) => ({
        hash: `hash${i}`,
        // Missing all other required fields to generate multiple errors per commit
      })),
    };

    const fileInput = screen.getByRole('button', { name: /select file/i }).querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile(JSON.stringify(invalidData));

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Validation Errors/)).toBeInTheDocument();
    });

    // Click to expand error details - look for the unnamed button (expand/collapse)
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons.find(button => 
      button.getAttribute('aria-label') === null && 
      !button.textContent?.includes('Select File') &&
      !button.getAttribute('aria-label')?.includes('reset')
    );
    expect(expandButton).toBeDefined();
    await user.click(expandButton!);

    // Should show "... and X more errors" message
    expect(screen.getByText(/... and \d+ more errors/)).toBeInTheDocument();
  });
});