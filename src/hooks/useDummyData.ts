import { useState, useEffect } from 'react';
import { dataRepository } from '../services/dataRepository';

/**
 * Hook to detect and manage dummy data state
 */
export const useDummyData = () => {
  const [isDummyData, setIsDummyData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDummyDataStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const isDummy = await dataRepository.isDummyData();
        setIsDummyData(isDummy);
      } catch (err) {
        console.error('Failed to check dummy data status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check data status');
        setIsDummyData(false); // Default to false on error
      } finally {
        setIsLoading(false);
      }
    };

    checkDummyDataStatus();
  }, []);

  const refreshDummyDataStatus = async () => {
    try {
      setError(null);
      const isDummy = await dataRepository.isDummyData();
      setIsDummyData(isDummy);
    } catch (err) {
      console.error('Failed to refresh dummy data status:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data status');
    }
  };

  const generateNewSampleData = async () => {
    try {
      setError(null);
      // Clear existing data first
      await dataRepository.clearAllData();
      // Initialize with new dummy data
      await dataRepository.initializeWithDummyData();
      // Update status
      await refreshDummyDataStatus();
    } catch (err) {
      console.error('Failed to generate new sample data:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate sample data');
      throw err;
    }
  };

  const clearSampleData = async () => {
    try {
      setError(null);
      await dataRepository.clearAllData();
      setIsDummyData(false);
    } catch (err) {
      console.error('Failed to clear sample data:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear sample data');
      throw err;
    }
  };

  return {
    isDummyData,
    isLoading,
    error,
    refreshDummyDataStatus,
    generateNewSampleData,
    clearSampleData
  };
};
