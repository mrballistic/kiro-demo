import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { ValidationUtils, ValidatedSelect } from './ValidationUtils';
import type { TimeRange, TimeRangePreset, TimeRangeOption } from '../types';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  className?: string;
}

// Helper functions for date calculations
const getLastWeek = (): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { start, end };
};

const getLastMonth = (): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  start.setMonth(end.getMonth() - 1);
  return { start, end };
};

const getLastQuarter = (): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  start.setMonth(end.getMonth() - 3);
  return { start, end };
};

const getAllTime = (): { start: Date; end: Date } => {
  // Return a very wide range for "all time"
  const start = new Date('2020-01-01');
  const end = new Date();
  return { start, end };
};

// Predefined time range options
const timeRangeOptions: TimeRangeOption[] = [
  {
    label: 'Last Week',
    value: 'last-week',
    getDates: getLastWeek,
  },
  {
    label: 'Last Month',
    value: 'last-month',
    getDates: getLastMonth,
  },
  {
    label: 'Last Quarter',
    value: 'last-quarter',
    getDates: getLastQuarter,
  },
  {
    label: 'All Time',
    value: 'all-time',
    getDates: getAllTime,
  },
  {
    label: 'Custom Range',
    value: 'custom',
    getDates: () => ({ start: new Date(), end: new Date() }), // Placeholder
  },
];

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  className,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<TimeRangePreset>('all-time');
  const [customStartDate, setCustomStartDate] = useState<string>(
    selectedRange.start.toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    selectedRange.end.toISOString().split('T')[0]
  );

  // Determine current preset based on selected range
  const getCurrentPreset = useCallback((): TimeRangePreset => {
    for (const option of timeRangeOptions) {
      if (option.value === 'custom') continue;
      const dates = option.getDates();
      const startMatch = Math.abs(dates.start.getTime() - selectedRange.start.getTime()) < 24 * 60 * 60 * 1000; // Within 1 day
      const endMatch = Math.abs(dates.end.getTime() - selectedRange.end.getTime()) < 24 * 60 * 60 * 1000;
      if (startMatch && endMatch) {
        return option.value;
      }
    }
    return 'custom';
  }, [selectedRange]);

  // Update preset when selectedRange changes
  React.useEffect(() => {
    const currentPreset = getCurrentPreset();
    setSelectedPreset(currentPreset);
    if (currentPreset === 'custom') {
      setCustomStartDate(selectedRange.start.toISOString().split('T')[0]);
      setCustomEndDate(selectedRange.end.toISOString().split('T')[0]);
    }
  }, [selectedRange, getCurrentPreset]);

  const handlePresetChange = (preset: TimeRangePreset) => {
    setSelectedPreset(preset);
    
    if (preset !== 'custom') {
      const option = timeRangeOptions.find(opt => opt.value === preset);
      if (option) {
        const dates = option.getDates();
        onRangeChange(dates);
      }
    }
  };

  const handleCustomDateChange = () => {
    if (selectedPreset === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      // Validate dates
      if (start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        onRangeChange({ start, end });
      }
    }
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Paper className={className} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <DateRangeIcon color="primary" />
        <Typography variant="h6">Time Range Filter</Typography>
      </Box>

      <Stack spacing={2}>
        {/* Preset Selection */}
        <ValidatedSelect
          name="timeRange"
          label="Time Range"
          value={selectedPreset}
          onChange={(_, value) => handlePresetChange(value as TimeRangePreset)}
          options={timeRangeOptions.map(option => ({
            value: option.value,
            label: option.label
          }))}
          fullWidth
          size="small"
          required
        />

        {/* Custom Date Range Inputs */}
        {selectedPreset === 'custom' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" />
              Custom Date Range
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
              />
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleCustomDateChange}
                sx={{ minWidth: 'fit-content' }}
              >
                Apply
              </Button>
            </Stack>
          </Box>
        )}

        {/* Current Range Display */}
        <Box sx={{ 
          p: 1.5, 
          bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200'
        }}>
          <Typography variant="body2" color="text.secondary">
            Current Range: {formatDateForDisplay(selectedRange.start)} - {formatDateForDisplay(selectedRange.end)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default TimeRangeSelector;