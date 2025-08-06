import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDummyData } from './useDummyData';
import { dataRepository } from '../services/dataRepository';

// Mock the dataRepository
vi.mock('../services/dataRepository', () => ({
  dataRepository: {
    isDummyData: vi.fn(),
    clearAllData: vi.fn(),
    initializeWithDummyData: vi.fn(),
  }
}));

const mockDataRepository = vi.mocked(dataRepository);

describe('useDummyData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    mockDataRepository.isDummyData.mockResolvedValue(false);
    
    const { result } = renderHook(() => useDummyData());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isDummyData).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should detect dummy data correctly', async () => {
    mockDataRepository.isDummyData.mockResolvedValue(true);
    
    const { result } = renderHook(() => useDummyData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isDummyData).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should handle error when checking dummy data status', async () => {
    const errorMessage = 'Failed to check status';
    mockDataRepository.isDummyData.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useDummyData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isDummyData).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should refresh dummy data status', async () => {
    mockDataRepository.isDummyData
      .mockResolvedValueOnce(false) // Initial call
      .mockResolvedValueOnce(true); // After refresh
    
    const { result } = renderHook(() => useDummyData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isDummyData).toBe(false);
    
    // Call refresh
    await result.current.refreshDummyDataStatus();
    
    await waitFor(() => {
      expect(result.current.isDummyData).toBe(true);
    });
    
    expect(mockDataRepository.isDummyData).toHaveBeenCalledTimes(2);
  });

  it('should generate new sample data', async () => {
    mockDataRepository.isDummyData.mockResolvedValue(true);
    mockDataRepository.clearAllData.mockResolvedValue(undefined);
    mockDataRepository.initializeWithDummyData.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useDummyData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Call generate new sample data
    await result.current.generateNewSampleData();
    
    expect(mockDataRepository.clearAllData).toHaveBeenCalledTimes(1);
    expect(mockDataRepository.initializeWithDummyData).toHaveBeenCalledTimes(1);
    expect(mockDataRepository.isDummyData).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should handle error when generating new sample data', async () => {
    const errorMessage = 'Failed to generate';
    mockDataRepository.isDummyData.mockResolvedValue(false);
    mockDataRepository.clearAllData.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useDummyData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Should throw error
    await expect(result.current.generateNewSampleData()).rejects.toThrow(errorMessage);
    
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('should clear sample data', async () => {
    mockDataRepository.isDummyData.mockResolvedValue(true);
    mockDataRepository.clearAllData.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useDummyData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isDummyData).toBe(true);
    
    // Call clear sample data
    await result.current.clearSampleData();
    
    await waitFor(() => {
      expect(result.current.isDummyData).toBe(false);
    });
    
    expect(mockDataRepository.clearAllData).toHaveBeenCalledTimes(1);
  });

  it('should handle error when clearing sample data', async () => {
    const errorMessage = 'Failed to clear';
    mockDataRepository.isDummyData.mockResolvedValue(true);
    mockDataRepository.clearAllData.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useDummyData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Should throw error
    await expect(result.current.clearSampleData()).rejects.toThrow(errorMessage);
    
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
  });
});
