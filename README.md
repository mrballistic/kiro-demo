# Code Generation Tracker

A React TypeScript application for tracking and visualizing developer code generation metrics over time.

## Features

- Track lines of code added, removed, and files modified per developer
- Calculate lines-per-file ratios and other metrics
- Visualize data with interactive charts using Chart.js
- Import git repository snapshot data
- Responsive web interface

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Charts**: Chart.js with react-chartjs-2
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint with TypeScript support

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

### Testing

Run tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

### Linting

Run ESLint:
```bash
npm run lint
```

## Project Structure

```
src/
├── components/     # React components
├── services/       # Business logic and data services
├── types/          # TypeScript type definitions
├── test/           # Test setup and utilities
├── assets/         # Static assets
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

## Development Status

This project is currently in development. The basic project structure and development environment have been set up according to the feature specification.