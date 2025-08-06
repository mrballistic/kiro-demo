import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Code Generation Tracker</h1>
          <p className={styles.subtitle}>
            Track and visualize developer code generation metrics
          </p>
        </div>
      </header>

      <nav className={styles.navigation}>
        <div className={styles.navContent}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/developers" 
            className={`${styles.navLink} ${location.pathname === '/developers' ? styles.active : ''}`}
          >
            Developers
          </Link>
          <Link 
            to="/import" 
            className={`${styles.navLink} ${location.pathname === '/import' ? styles.active : ''}`}
          >
            Import Data
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 Code Generation Tracker</p>
      </footer>
    </div>
  );
};

export default Layout;