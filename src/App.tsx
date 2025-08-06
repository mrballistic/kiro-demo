import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Placeholder components for routes that will be implemented in later tasks
const DevelopersPage: React.FC = () => (
  <div>
    <h2>Developers</h2>
    <p>Developer list and details will be implemented in upcoming tasks.</p>
  </div>
);

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
  );
}

export default App;