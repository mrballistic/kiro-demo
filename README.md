# 📊 Code Generation Tracker

> A comprehensive React application for tracking and visualizing developer code generation metrics from Git repositories.

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Material-UI](https://img.shields.io/badge/Material--UI-7.3.1-0081CB?logo=mui)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4.0-FF6384?logo=chart.js)
![Vite](https://img.shields.io/badge/Vite-7.0.4-646CFF?logo=vite)

## 🎯 Overview

Code Generation Tracker is a modern web application that analyzes Git repository data to provide insights into developer productivity and code generation patterns. It features interactive charts, comprehensive metrics, and a beautiful dark/light theme-aware interface.

## ✨ Features

### 🔍 **Core Analytics**
- **Developer Metrics**: Track individual developer performance and contributions
- **Time-Series Analysis**: Visualize code generation trends over time
- **Lines of Code Tracking**: Monitor lines added, removed, and net changes
- **File Modification Patterns**: Analyze which files and areas see the most activity
- **Custom Time Ranges**: Filter data by week, month, quarter, or custom date ranges

### 📈 **Interactive Visualizations**
- **Dynamic Charts**: Beautiful Chart.js visualizations with theme support
- **Metrics Dashboard**: Comprehensive overview with key performance indicators
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Live data updates when importing new repository snapshots

### 🛠️ **Data Management**
- **Git Integration**: Includes `gitslurp.py` for extracting repository data
- **JSON Import/Export**: Easy data import with validation and error handling
- **Sample Data**: Built-in dummy data for testing and demonstration
- **Data Validation**: Comprehensive validation with user-friendly error messages

### 🎨 **User Experience**
- **Dark/Light Theme**: Automatic system theme detection with manual override
- **Material-UI Components**: Modern, accessible interface components
- **Loading States**: Smooth loading indicators and progress feedback
- **Error Boundaries**: Graceful error handling with recovery options
- **Responsive Layout**: Mobile-first design that works on all screen sizes

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Git** (for repository analysis)
- **Python 3** (for the included Git analysis tool)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd kiro-demo
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173` to see the application in action! 🎉

### 📊 Getting Repository Data

Use the included `gitslurp.py` tool to extract data from any Git repository:

```bash
# Analyze a repository and save to JSON
python gitslurp.py /path/to/git/repo

# Limit to recent commits
python gitslurp.py /path/to/git/repo --limit=50

# Send directly to the app (when running)
python gitslurp.py /path/to/git/repo --api=http://localhost:5173/api/import
```

The tool generates a `git_analysis.json` file that you can import through the app's interface.

## 🏗️ Architecture

### 🗂️ **Project Structure**
```
src/
├── components/         # React components
│   ├── Dashboard.tsx      # Main dashboard view
│   ├── DeveloperList.tsx  # Developer selection interface
│   ├── DeveloperDetail.tsx # Individual developer metrics
│   ├── MetricsChart.tsx   # Interactive chart component
│   ├── MetricsSummary.tsx # Summary statistics cards
│   ├── DataImport.tsx     # Data import interface
│   └── TimeRangeSelector.tsx # Date filtering component
├── services/          # Business logic and data management
│   ├── dataRepository.ts     # Data storage and retrieval
│   ├── metricsCalculator.ts  # Metrics computation engine
│   ├── dummyDataGenerator.ts # Sample data generation
│   └── storageUtils.ts       # Local storage utilities
├── types/             # TypeScript type definitions
├── context/           # React context providers
├── theme/             # Material-UI theme configuration
└── test/              # Test utilities and setup
```

### 🔧 **Technology Stack**
- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI 7 with custom theming
- **Charts**: Chart.js with React wrapper
- **Build Tool**: Vite for fast development and building
- **Testing**: Vitest + React Testing Library
- **Styling**: CSS Modules + Material-UI `sx` props
- **State Management**: React Context + useReducer
- **Routing**: React Router DOM

## 🧪 Testing

The project includes comprehensive testing coverage:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

### 🎯 **Test Coverage**
- ✅ **Unit Tests**: All utility functions and business logic
- ✅ **Component Tests**: Every React component with user interactions
- ✅ **Integration Tests**: Data flow and component interactions
- ✅ **Type Safety**: Full TypeScript coverage with strict mode

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready application |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check code quality with ESLint |

## 🎨 Theme Support

The application includes a sophisticated theming system:

- **🌙 Dark Mode**: Full dark theme support with high contrast
- **☀️ Light Mode**: Clean, accessible light theme
- **🔄 Auto-Detection**: Respects system preferences
- **🎨 Theme-Aware Components**: All charts and components adapt automatically

## 📊 Data Format

The application expects Git repository data in this JSON format:

```json
{
  "repository": "project-name",
  "commits": [
    {
      "hash": "abc123def456",
      "author": "Developer Name",
      "email": "developer@example.com",
      "timestamp": "2024-01-15T10:30:00Z",
      "linesAdded": 150,
      "linesRemoved": 25,
      "filesModified": ["src/file1.js", "src/file2.js"]
    }
  ]
}
```

## 🛣️ Development Status

### ✅ **Completed Tasks**
- [x] 🏗️ Project setup and development environment
- [x] 📝 Core data models and TypeScript interfaces
- [x] 🎲 Dummy data generator and storage utilities
- [x] 🧮 Metrics calculation engine
- [x] 🗄️ Data repository implementation
- [x] ⚛️ React application shell with routing
- [x] 👥 Developer list and detail components
- [x] 📊 Chart.js integration for visualizations
- [x] 📈 Metrics summary components
- [x] 📅 Time range filtering functionality
- [x] 📤 Data import with validation
- [x] 🎯 Dummy data indicators and sample management
- [x] 🛡️ Comprehensive error handling
- [x] 🧪 Complete test suite (15/17 tasks complete)
- [x] 🎨 UI polish and responsive design

### 🚧 **Remaining Work**
- [ ] 🔗 Final integration and application assembly (Task 17/17)

## 🤝 Contributing

This project follows modern React and TypeScript best practices:

1. **Code Style**: ESLint configuration with React hooks rules
2. **Type Safety**: Strict TypeScript with comprehensive type coverage
3. **Testing**: Test-driven development with high coverage requirements
4. **Performance**: Optimized bundle size and runtime performance
5. **Accessibility**: WCAG-compliant components and interactions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI**: For the excellent React component library
- **Chart.js**: For powerful and flexible charting capabilities
- **Vite**: For the lightning-fast development experience
- **React Testing Library**: For encouraging good testing practices

---

<div align="center">

**[🚀 View Live Demo](#) | [📖 Documentation](#) | [🐛 Report Bug](#) | [💡 Request Feature](#)**

Made with ❤️ and TypeScript

</div>