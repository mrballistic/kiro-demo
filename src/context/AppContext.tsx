import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Developer, CodeMetric } from '../types';

interface AppState {
  developers: Developer[];
  selectedDeveloper: Developer | null;
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEVELOPERS'; payload: Developer[] }
  | { type: 'SET_SELECTED_DEVELOPER'; payload: Developer | null }
  | { type: 'ADD_DEVELOPER'; payload: Developer }
  | { type: 'UPDATE_DEVELOPER_METRICS'; payload: { developerId: string; metrics: CodeMetric[] } };

const initialState: AppState = {
  developers: [],
  selectedDeveloper: null,
  loading: false,
  error: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_DEVELOPERS':
      return { ...state, developers: action.payload };
    case 'SET_SELECTED_DEVELOPER':
      return { ...state, selectedDeveloper: action.payload };
    case 'ADD_DEVELOPER':
      return { ...state, developers: [...state.developers, action.payload] };
    case 'UPDATE_DEVELOPER_METRICS':
      return {
        ...state,
        developers: state.developers.map(dev =>
          dev.id === action.payload.developerId
            ? { ...dev, metrics: action.payload.metrics }
            : dev
        ),
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;