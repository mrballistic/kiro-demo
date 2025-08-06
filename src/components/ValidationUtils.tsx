import React from 'react';
import {
  TextField,
  FormHelperText,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
  email?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldState {
  value: unknown;
  errors: string[];
  touched: boolean;
  dirty: boolean;
}

/**
 * Validation utility class for form validation
 */
export class ValidationUtils {
  /**
   * Validates a single value against a set of rules
   */
  static validateField(value: unknown, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push('This field is required');
      return { isValid: false, errors };
    }

    // Skip other validations if value is empty and not required
    if (!value && !rules.required) {
      return { isValid: true, errors: [] };
    }

    const stringValue = String(value);

    // Email validation
    if (rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(stringValue)) {
        errors.push('Please enter a valid email address');
      }
    }

    // URL validation
    if (rules.url) {
      try {
        new URL(stringValue);
      } catch {
        errors.push('Please enter a valid URL');
      }
    }

    // Number validation
    if (rules.number) {
      const numberValue = Number(value);
      if (isNaN(numberValue)) {
        errors.push('Please enter a valid number');
      } else {
        // Min/Max validation for numbers
        if (rules.min !== undefined && numberValue < rules.min) {
          errors.push(`Value must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && numberValue > rules.max) {
          errors.push(`Value must be at most ${rules.max}`);
        }
      }
    }

    // String length validation
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && stringValue.length < rules.minLength) {
        errors.push(`Must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength !== undefined && stringValue.length > rules.maxLength) {
        errors.push(`Must be no more than ${rules.maxLength} characters long`);
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors.push('Please enter a value in the correct format');
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates multiple fields at once
   */
  static validateForm(fields: Record<string, { value: unknown; rules: ValidationRule }>): {
    isValid: boolean;
    fieldErrors: Record<string, string[]>;
  } {
    const fieldErrors: Record<string, string[]> = {};
    let isValid = true;

    for (const [fieldName, { value, rules }] of Object.entries(fields)) {
      const result = this.validateField(value, rules);
      fieldErrors[fieldName] = result.errors;
      if (!result.isValid) {
        isValid = false;
      }
    }

    return { isValid, fieldErrors };
  }
}

interface ValidatedTextFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  rules?: ValidationRule;
  errors?: string[];
  touched?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  required?: boolean;
  autoFocus?: boolean;
  helperText?: string;
}

/**
 * Enhanced TextField component with built-in validation
 */
export const ValidatedTextField: React.FC<ValidatedTextFieldProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  rules,
  errors = [],
  touched = false,
  disabled = false,
  multiline = false,
  rows,
  type = 'text',
  placeholder,
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  required,
  autoFocus = false,
  helperText,
}) => {
  const hasErrors = errors.length > 0 && touched;
  const showRequired = required || rules?.required;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, event.target.value);
  };

  const handleBlur = () => {
    onBlur?.(name);
  };

  return (
    <TextField
      name={name}
      label={showRequired ? `${label} *` : label}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={hasErrors}
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      type={type}
      placeholder={placeholder}
      fullWidth={fullWidth}
      variant={variant}
      size={size}
      autoFocus={autoFocus}
      helperText={
        hasErrors ? (
          <Box>
            {errors.map((error, index) => (
              <Typography key={index} variant="caption" color="error" display="block">
                {error}
              </Typography>
            ))}
          </Box>
        ) : (
          helperText
        )
      }
    />
  );
};

interface ValidatedSelectProps {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  options: { value: string; label: string }[];
  rules?: ValidationRule;
  errors?: string[];
  touched?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  required?: boolean;
  placeholder?: string;
}

/**
 * Enhanced Select component with built-in validation
 */
export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  rules,
  errors = [],
  touched = false,
  disabled = false,
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  required,
  placeholder,
}) => {
  const hasErrors = errors.length > 0 && touched;
  const showRequired = required || rules?.required;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (event: any) => {
    onChange(name, String(event.target.value));
  };

  const handleBlur = () => {
    onBlur?.(name);
  };

  return (
    <FormControl fullWidth={fullWidth} error={hasErrors} variant={variant} size={size}>
      <InputLabel>{showRequired ? `${label} *` : label}</InputLabel>
      <Select
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        label={showRequired ? `${label} *` : label}
        disabled={disabled}
        displayEmpty={!!placeholder}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {hasErrors && (
        <FormHelperText>
          {errors.map((error, index) => (
            <Typography key={index} variant="caption" color="error" display="block">
              {error}
            </Typography>
          ))}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default ValidationUtils;
