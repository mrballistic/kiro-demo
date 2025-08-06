import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CloudUpload as ImportIcon,
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getTabValue = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/developers':
        return 1;
      case '/import':
        return 2;
      default:
        return 0;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography 
                variant="h1" 
                component="h1" 
                sx={{ 
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 700,
                  mb: 1,
                  color: 'white'
                }}
              >
                Code Generation Tracker
              </Typography>
              <Typography 
                variant="h6" 
                component="p" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  opacity: 0.9,
                  fontWeight: 300,
                  color: 'white'
                }}
              >
                Track and visualize developer code generation metrics
              </Typography>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Navigation */}
      <Paper 
        elevation={1} 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar - 1,
        }}
      >
        <Container maxWidth="xl">
          <Tabs
            value={getTabValue()}
            variant={isMobile ? 'fullWidth' : 'standard'}
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                minHeight: { xs: 48, sm: 64 },
              },
            }}
          >
            <Tab
              icon={<DashboardIcon />}
              label="Dashboard"
              component={Link}
              to="/"
              iconPosition={isMobile ? 'top' : 'start'}
            />
            <Tab
              icon={<PeopleIcon />}
              label="Developers"
              component={Link}
              to="/developers"
              iconPosition={isMobile ? 'top' : 'start'}
            />
            <Tab
              icon={<ImportIcon />}
              label="Import Data"
              component={Link}
              to="/import"
              iconPosition={isMobile ? 'top' : 'start'}
            />
          </Tabs>
        </Container>
      </Paper>

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, py: { xs: 2, sm: 3, md: 4 } }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Paper 
        component="footer" 
        elevation={0}
        sx={{ 
          mt: 'auto',
          py: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ opacity: 0.8 }}
          >
            &copy; 2024 Code Generation Tracker
          </Typography>
        </Container>
      </Paper>
    </Box>
  );
};

export default Layout;