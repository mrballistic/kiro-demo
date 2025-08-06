import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  Stack,
  Container,
  Paper,
  useTheme,
  useMediaQuery,

} from '@mui/material';
import {
  Refresh as RefreshIcon,
  People as PeopleIcon,
  CloudUpload as ImportIcon,
  Code as CodeIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { dataRepository } from '../services/dataRepository';
import DeveloperDetail from './DeveloperDetail';
import DummyDataIndicator from './DummyDataIndicator';
import LoadingIndicator from './LoadingIndicator';
import ErrorDisplay from './ErrorDisplay';
import { useDummyData } from '../hooks/useDummyData';
import type { Developer } from '../types';

interface DeveloperListProps {
  onDeveloperSelect?: (developer: Developer) => void;
}

const DeveloperList: React.FC<DeveloperListProps> = ({ onDeveloperSelect }) => {
  const { state, dispatch } = useAppContext();
  const [isInitializing, setIsInitializing] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isDummyData, refreshDummyDataStatus } = useDummyData();

  useEffect(() => {
    const loadDevelopers = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // Initialize with dummy data if no data exists
        setIsInitializing(true);
        await dataRepository.initializeWithDummyData();
        setIsInitializing(false);

        // Load developers
        const developers = await dataRepository.getDevelopers();
        dispatch({ type: 'SET_DEVELOPERS', payload: developers });
      } catch (error) {
        console.error('Failed to load developers:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to load developers'
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsInitializing(false);
      }
    };

    // Only load if we don't have developers yet
    if (state.developers.length === 0 && !state.loading) {
      loadDevelopers();
    }
  }, [dispatch, state.developers.length, state.loading]);

  const handleDeveloperClick = (developer: Developer) => {
    dispatch({ type: 'SET_SELECTED_DEVELOPER', payload: developer });
    onDeveloperSelect?.(developer);
  };

    const handleRefresh = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const developers = await dataRepository.getDevelopers();
      dispatch({ type: 'SET_DEVELOPERS', payload: developers });
      
      // Refresh dummy data status after loading
      await refreshDummyDataStatus();
    } catch (error) {
      console.error('Failed to refresh developers:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to refresh developers'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  if (state.loading || isInitializing) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 2 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Typography variant="h4" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon />
              Developers
            </Typography>
          </Box>

          <LoadingIndicator 
            size="large"
            message={isInitializing ? 'Initializing with sample data...' : 'Loading developers...'}
            variant="circular"
            inline={false}
          />
        </Box>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 2 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Typography variant="h4" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon />
              Developers
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size={isMobile ? 'small' : 'medium'}
            >
              Refresh
            </Button>
          </Box>

          <ErrorDisplay
            error={state.error}
            onRetry={handleRefresh}
            severity="error"
            showRetry
            title="Error loading developers"
          />
        </Box>
      </Container>
    );
  }

  if (state.developers.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 2 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Typography variant="h4" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon />
              Developers
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size={isMobile ? 'small' : 'medium'}
            >
              Refresh
            </Button>
          </Box>

          <Paper sx={{ p: { xs: 3, sm: 4, md: 6 }, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: { xs: 64, sm: 80 }, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" component="h3" gutterBottom>
              No Developers Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              No developers are currently being tracked. Import git repository data
              to start tracking code generation metrics.
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<ImportIcon />}
              size="large"
              onClick={() => {
                // This will be implemented in a later task
                console.log('Import functionality will be implemented in task 12');
              }}
            >
              Import Data
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  // Show developer detail view if a developer is selected
  if (state.selectedDeveloper) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 2 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => dispatch({ type: 'SET_SELECTED_DEVELOPER', payload: null })}
                size={isMobile ? 'small' : 'medium'}
              >
                Back to List
              </Button>
              <Typography variant="h4" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Developer Details
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size={isMobile ? 'small' : 'medium'}
            >
              Refresh
            </Button>
          </Box>

          <DeveloperDetail developer={state.selectedDeveloper} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <Typography variant="h4" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            Developers ({state.developers.length})
            {isDummyData && (
              <DummyDataIndicator isDummyData={isDummyData} compact />
            )}
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size={isMobile ? 'small' : 'medium'}
          >
            Refresh
          </Button>
        </Box>

        <DummyDataIndicator isDummyData={isDummyData} />

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)'
          },
          gap: { xs: 2, sm: 3 }
        }}>
          {state.developers.map((developer) => {
            const isSelected = state.selectedDeveloper?.id === developer.id;
            const totalCommits = developer.metrics.length;
            const totalLinesAdded = developer.metrics.reduce((sum, metric) => sum + metric.linesAdded, 0);
            const totalFilesModified = developer.metrics.reduce((sum, metric) => sum + metric.filesModified, 0);

            return (
              <Card
                key={developer.id}
                sx={{
                  height: '100%',
                  position: 'relative',
                  border: isSelected ? 2 : 0,
                  borderColor: 'primary.main',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <CardActionArea
                  onClick={() => handleDeveloperClick(developer)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDeveloperClick(developer);
                    }
                  }}
                  aria-label={`Select developer ${developer.name}`}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {isSelected && (
                      <Chip
                        icon={<CheckIcon />}
                        label="Selected"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 1
                        }}
                      />
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          pr: isSelected ? 6 : 0
                        }}
                      >
                        {developer.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          wordBreak: 'break-word'
                        }}
                      >
                        {developer.email}
                      </Typography>
                    </Box>

                    <Stack
                      direction={isMobile ? 'column' : 'row'}
                      spacing={isMobile ? 1 : 2}
                      sx={{ mt: 2 }}
                    >
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flex: 1,
                        justifyContent: isMobile ? 'space-between' : 'flex-start'
                      }}>
                        <CodeIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="h6" component="span" sx={{ fontSize: '1rem' }}>
                            {totalCommits}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            Commits
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flex: 1,
                        justifyContent: isMobile ? 'space-between' : 'flex-start'
                      }}>
                        <AddIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="h6" component="span" sx={{ fontSize: '1rem' }}>
                            {totalLinesAdded.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            Lines Added
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flex: 1,
                        justifyContent: isMobile ? 'space-between' : 'flex-start'
                      }}>
                        <FileIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="h6" component="span" sx={{ fontSize: '1rem' }}>
                            {totalFilesModified.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            Files Modified
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Container>
  );
};

export default DeveloperList;