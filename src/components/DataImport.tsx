import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { dataRepository } from '../services/dataRepository';
import type { SnapshotData } from '../types';
import { isSnapshotData } from '../types';

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    developersCount: number;
    metricsCount: number;
    repository: string;
    warnings?: string[];
  };
  errors?: string[];
}

interface ValidationError {
  field: string;
  message: string;
  line?: number;
}

const DataImport: React.FC = () => {
  const { dispatch } = useAppContext();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validateSnapshotData = useCallback((data: unknown): { isValid: boolean; errors: ValidationError[] } => {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
      errors.push({ field: 'root', message: 'Data must be a valid JSON object' });
      return { isValid: false, errors };
    }

    const snapshot = data as Record<string, unknown>;

    // Validate repository field
    if (!snapshot.repository || typeof snapshot.repository !== 'string') {
      errors.push({ field: 'repository', message: 'Repository field is required and must be a string' });
    }

    // Validate commits array
    if (!Array.isArray(snapshot.commits)) {
      errors.push({ field: 'commits', message: 'Commits field is required and must be an array' });
      return { isValid: false, errors };
    }

    // Validate each commit
    snapshot.commits.forEach((commit, index) => {
      if (!commit || typeof commit !== 'object') {
        errors.push({
          field: `commits[${index}]`,
          message: 'Each commit must be an object',
          line: index + 1
        });
        return;
      }

      const commitObj = commit as Record<string, unknown>;

      // Required fields validation
      const requiredFields = ['hash', 'author', 'email', 'timestamp', 'linesAdded', 'linesRemoved', 'filesModified'];

      requiredFields.forEach(field => {
        if (commitObj[field] === undefined || commitObj[field] === null) {
          errors.push({
            field: `commits[${index}].${field}`,
            message: `Field '${field}' is required`,
            line: index + 1
          });
        }
      });

      // Type validation
      if (commitObj.hash !== undefined && typeof commitObj.hash !== 'string') {
        errors.push({
          field: `commits[${index}].hash`,
          message: 'Hash must be a string',
          line: index + 1
        });
      }

      if (commitObj.author !== undefined && typeof commitObj.author !== 'string') {
        errors.push({
          field: `commits[${index}].author`,
          message: 'Author must be a string',
          line: index + 1
        });
      }

      if (commitObj.email !== undefined && typeof commitObj.email !== 'string') {
        errors.push({
          field: `commits[${index}].email`,
          message: 'Email must be a string',
          line: index + 1
        });
      }

      // Validate timestamp
      if (commitObj.timestamp !== undefined) {
        const timestamp = new Date(commitObj.timestamp as string);
        if (isNaN(timestamp.getTime())) {
          errors.push({
            field: `commits[${index}].timestamp`,
            message: 'Timestamp must be a valid date string',
            line: index + 1
          });
        }
      }

      // Validate numeric fields
      if (commitObj.linesAdded !== undefined && (typeof commitObj.linesAdded !== 'number' || commitObj.linesAdded < 0)) {
        errors.push({
          field: `commits[${index}].linesAdded`,
          message: 'Lines added must be a non-negative number',
          line: index + 1
        });
      }

      if (commitObj.linesRemoved !== undefined && (typeof commitObj.linesRemoved !== 'number' || commitObj.linesRemoved < 0)) {
        errors.push({
          field: `commits[${index}].linesRemoved`,
          message: 'Lines removed must be a non-negative number',
          line: index + 1
        });
      }

      // Validate filesModified array
      if (commitObj.filesModified !== undefined) {
        if (!Array.isArray(commitObj.filesModified)) {
          errors.push({
            field: `commits[${index}].filesModified`,
            message: 'Files modified must be an array',
            line: index + 1
          });
        } else {
          const filesArray = commitObj.filesModified as unknown[];
          filesArray.forEach((file, fileIndex) => {
            if (typeof file !== 'string') {
              errors.push({
                field: `commits[${index}].filesModified[${fileIndex}]`,
                message: 'Each file path must be a string',
                line: index + 1
              });
            }
          });
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }, []);

  const processFile = useCallback(async (file: File): Promise<void> => {
    setImporting(true);
    setImportResult(null);
    setValidationErrors([]);

    try {
      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      // Parse JSON
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      // Validate data structure
      const validation = validateSnapshotData(parsedData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setImportResult({
          success: false,
          message: `Validation failed with ${validation.errors.length} error(s)`,
          errors: validation.errors.map(err => `${err.field}: ${err.message}`)
        });
        return;
      }

      // Additional type check using the type guard
      if (!isSnapshotData(parsedData)) {
        throw new Error('Data does not match expected snapshot format');
      }

      // Import the data
      await dataRepository.importSnapshot(parsedData as SnapshotData);

      // Refresh developers list in context
      const updatedDevelopers = await dataRepository.getDevelopers();
      dispatch({ type: 'SET_DEVELOPERS', payload: updatedDevelopers });

      // Show success result
      setImportResult({
        success: true,
        message: 'Data imported successfully!',
        details: {
          developersCount: new Set(parsedData.commits.map(c => `${c.author}-${c.email}`)).size,
          metricsCount: parsedData.commits.length,
          repository: parsedData.repository,
        }
      });

    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during import',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setImporting(false);
    }
  }, [dispatch, validateSnapshotData]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        processFile(file);
      } else {
        setImportResult({
          success: false,
          message: 'Please select a JSON file',
          errors: ['Only JSON files are supported']
        });
      }
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const resetImport = useCallback(() => {
    setImportResult(null);
    setValidationErrors([]);
    setShowDetails(false);
  }, []);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Import Data
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Import git repository snapshot data to populate the application with code generation metrics.
        The data should be in JSON format containing repository information and commit details.
      </Typography>

      {/* File Upload Area */}
      <Paper
        elevation={dragOver ? 4 : 1}
        sx={{
          p: 4,
          mb: 3,
          border: dragOver ? '2px dashed' : '2px dashed transparent',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          backgroundColor: dragOver ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          cursor: importing ? 'not-allowed' : 'pointer',
          opacity: importing ? 0.6 : 1,
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

          <Typography variant="h6" gutterBottom>
            {dragOver ? 'Drop your JSON file here' : 'Upload Snapshot Data'}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Drag and drop a JSON file here, or click to select a file
          </Typography>

          <Button
            variant="contained"
            component="label"
            disabled={importing}
            startIcon={<UploadIcon />}
            sx={{ mt: 1 }}
          >
            Select File
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Button>
        </Box>
      </Paper>

      {/* Progress Indicator */}
      {importing && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Importing data...
          </Typography>
          <LinearProgress />
        </Paper>
      )}

      {/* Import Results */}
      {importResult && (
        <Alert
          severity={importResult.success ? 'success' : 'error'}
          sx={{ mb: 3 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={resetImport}
              aria-label="reset import"
            >
              <RefreshIcon />
            </IconButton>
          }
        >
          <AlertTitle>
            {importResult.success ? 'Import Successful' : 'Import Failed'}
          </AlertTitle>
          {importResult.message}

          {/* Success Details */}
          {importResult.success && importResult.details && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  size="small"
                  icon={<SuccessIcon />}
                  label={`${importResult.details.developersCount} developers`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<SuccessIcon />}
                  label={`${importResult.details.metricsCount} commits`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={importResult.details.repository}
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6" color="error">
                Validation Errors ({validationErrors.length})
              </Typography>
              <IconButton
                onClick={() => setShowDetails(!showDetails)}
                sx={{ ml: 'auto' }}
              >
                {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={showDetails}>
              <List dense>
                {validationErrors.slice(0, 10).map((error, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={error.message}
                        secondary={
                          <span>
                            <Typography component="span" variant="caption" color="text.secondary">
                              Field: {error.field}
                            </Typography>
                            {error.line && (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                Line: {error.line}
                              </Typography>
                            )}
                          </span>
                        }
                      />
                    </ListItem>
                    {index < Math.min(validationErrors.length, 10) - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {validationErrors.length > 10 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          ... and {validationErrors.length - 10} more errors
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Expected Data Format */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Expected Data Format
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          The JSON file should contain snapshot data with the following structure:
        </Typography>

        <Box
          component="pre"
          sx={{
            backgroundColor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}
        >
          {`{
  "repository": "project-name",
  "commits": [
    {
      "hash": "abc123def456",
      "author": "John Doe",
      "email": "john.doe@example.com",
      "timestamp": "2024-01-15T10:30:00Z",
      "linesAdded": 150,
      "linesRemoved": 25,
      "filesModified": ["src/file1.js", "src/file2.js"]
    }
  ]
}`}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          All fields are required. The timestamp should be in ISO 8601 format, and numeric values should be non-negative.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DataImport;