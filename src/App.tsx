import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './theme/ThemeProvider';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DeveloperList from './components/DeveloperList';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Placeholder component for import page that will be implemented in later tasks
const DevelopersPage: React.FC = () => <DeveloperList />;

const ImportPage: React.FC = () => (
  <div>
    <h2>Import Data</h2>
    <p>Data import functionality will be implemented in upcoming tasks.</p>
  </div>
);

const NotFound: React.FC = () => (
  <div>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/developers" element={<DevelopersPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
        </AppProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;