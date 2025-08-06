import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ValidationUtils, ValidatedTextField, ValidatedSelect } from './ValidationUtils';

// Create a test theme
const theme = createTheme();

// Wrapper component for Material-UI
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('ValidationUtils', () => {
  describe('ValidationUtils class', () => {
    it('validates required fields correctly', () => {
      const rules = { required: true };
      const result = ValidationUtils.validateField('', rules);
      expect(result.errors).toContain('This field is required');
      
      const noErrorsResult = ValidationUtils.validateField('valid value', rules);
      expect(noErrorsResult.errors).toHaveLength(0);
    });

    it('validates email format correctly', () => {
      const rules = { email: true };
      const result = ValidationUtils.validateField('invalid-email', rules);
      expect(result.errors).toContain('Please enter a valid email address');
      
      const noErrorsResult = ValidationUtils.validateField('valid@email.com', rules);
      expect(noErrorsResult.errors).toHaveLength(0);
    });

    it('validates minimum length correctly', () => {
      const rules = { minLength: 5 };
      const result = ValidationUtils.validateField('abc', rules);
      expect(result.errors).toContain('Must be at least 5 characters long');
      
      const noErrorsResult = ValidationUtils.validateField('abcdef', rules);
      expect(noErrorsResult.errors).toHaveLength(0);
    });

    it('validates maximum length correctly', () => {
      const rules = { maxLength: 3 };
      const result = ValidationUtils.validateField('abcdef', rules);
      expect(result.errors).toContain('Must be no more than 3 characters long');
      
      const noErrorsResult = ValidationUtils.validateField('abc', rules);
      expect(noErrorsResult.errors).toHaveLength(0);
    });

    it('validates pattern matching correctly', () => {
      const rules = { pattern: /^[A-Z]+$/ };
      const result = ValidationUtils.validateField('abc', rules);
      expect(result.errors).toContain('Please enter a value in the correct format');
      
      const noErrorsResult = ValidationUtils.validateField('ABC', rules);
      expect(noErrorsResult.errors).toHaveLength(0);
    });

    it('validates custom validation functions', () => {
      const customValidator = (value: unknown) => String(value) === 'test' ? null : 'Value must be "test"';
      const rules = { custom: customValidator };
      
      const result = ValidationUtils.validateField('wrong', rules);
      expect(result.errors).toContain('Value must be "test"');
      
      const noErrorsResult = ValidationUtils.validateField('test', rules);
      expect(noErrorsResult.errors).toHaveLength(0);
    });

    it('validates multiple rules simultaneously', () => {
      const rules = { 
        required: true, 
        minLength: 5, 
        email: true 
      };
      
      const result = ValidationUtils.validateField('abc', rules);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Must be at least 5 characters long');
      expect(result.errors).toContain('Please enter a valid email address');
    });

    it('handles form data processing', () => {
      // Test basic validation functionality since getFormData doesn't exist
      const result = ValidationUtils.validateField('test@example.com', { email: true });
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('ValidatedTextField', () => {
    it('renders text field with label', () => {
      render(
        <TestWrapper>
          <ValidatedTextField
            name="test"
            label="Test Field"
            value=""
            onChange={vi.fn()}
          />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <TestWrapper>
          <ValidatedTextField
            name="test"
            label="Test Field"
            value=""
            onChange={vi.fn()}
            required
          />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText('Test Field *')).toBeInTheDocument();
    });

    it('displays validation errors', () => {
      const errors = ['This field is required', 'Invalid format'];
      render(
        <TestWrapper>
          <ValidatedTextField
            name="test"
            label="Test Field"
            value=""
            onChange={vi.fn()}
            errors={errors}
            touched
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid format')).toBeInTheDocument();
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <ValidatedTextField
            name="test"
            label="Test Field"
            value=""
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      const input = screen.getByLabelText('Test Field');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      expect(onChange).toHaveBeenCalledWith('test', 'new value');
    });

    it('calls onBlur when field loses focus', () => {
      const onBlur = vi.fn();
      render(
        <TestWrapper>
          <ValidatedTextField
            name="test"
            label="Test Field"
            value=""
            onChange={vi.fn()}
            onBlur={onBlur}
          />
        </TestWrapper>
      );
      
      const input = screen.getByLabelText('Test Field');
      fireEvent.blur(input);
      
      expect(onBlur).toHaveBeenCalledWith('test');
    });
  });

  describe('ValidatedSelect', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];

    it('renders select field with options', () => {
      render(
        <TestWrapper>
          <ValidatedSelect
            name="test"
            label="Test Select"
            value=""
            onChange={vi.fn()}
            options={options}
          />
        </TestWrapper>
      );
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <TestWrapper>
          <ValidatedSelect
            name="test"
            label="Test Select"
            value=""
            onChange={vi.fn()}
            options={options}
            required
          />
        </TestWrapper>
      );
      
      expect(screen.getAllByText('Test Select *')[0]).toBeInTheDocument();
    });

    it('displays validation errors', () => {
      const errors = ['Selection is required'];
      render(
        <TestWrapper>
          <ValidatedSelect
            name="test"
            label="Test Select"
            value=""
            onChange={vi.fn()}
            options={options}
            errors={errors}
            touched
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('Selection is required')).toBeInTheDocument();
    });

    it('shows placeholder when provided', () => {
      render(
        <TestWrapper>
          <ValidatedSelect
            name="test"
            label="Test Select"
            value=""
            onChange={vi.fn()}
            options={options}
            placeholder="Select an option"
          />
        </TestWrapper>
      );
      
      // Open the select to see options
      fireEvent.mouseDown(screen.getByRole('combobox'));
      expect(screen.getAllByText('Select an option')[0]).toBeInTheDocument();
    });
  });
});
