import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { PersonaId, UseCase, MonitoringAlert, UseCaseStatus, ApprovalStatus, EnvironmentFilter } from '@/data/types';
import { personas } from '@/data/personas';
import { useCases as initialUseCases, monitoringAlerts as initialAlerts } from '@/data/mockData';

// ─── Persist persona to localStorage ───
function loadPersistedPersona(): PersonaId {
  try {
    const stored = localStorage.getItem('shell-ai-persona');
    if (stored && personas.some(p => p.id === stored)) return stored as PersonaId;
  } catch { /* noop */ }
  return 'ide-gm';
}

function loadPersistedEnvFilter(): EnvironmentFilter {
  try {
    const stored = localStorage.getItem('shell-ai-env-filter');
    if (stored && ['all', 'Development', 'Staging', 'Production'].includes(stored)) return stored as EnvironmentFilter;
  } catch { /* noop */ }
  return 'all';
}

export interface AppState {
  isAuthenticated: boolean;
  currentPersona: PersonaId;
  environmentFilter: EnvironmentFilter;
  darkMode: boolean;
  useCases: UseCase[];
  alerts: MonitoringAlert[];
  notifications: number;
  toasts: { id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }[];
  lastUpdated: string; // ISO timestamp for data freshness
}

type Action =
  | { type: 'SET_PERSONA'; payload: PersonaId }
  | { type: 'SET_ENVIRONMENT_FILTER'; payload: EnvironmentFilter }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USE_CASE'; payload: UseCase }
  | { type: 'ADD_USE_CASE'; payload: UseCase }
  | { type: 'ACKNOWLEDGE_ALERT'; payload: string }
  | { type: 'ADD_TOAST'; payload: AppState['toasts'][0] }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'UPDATE_APPROVAL'; payload: { useCaseId: string; step: number; status: ApprovalStatus; comments?: string; approvedBy?: string } }
  | { type: 'SET_USE_CASE_STATUS'; payload: { useCaseId: string; status: UseCaseStatus } };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PERSONA':
      localStorage.setItem('shell-ai-persona', action.payload);
      return { ...state, currentPersona: action.payload };
    case 'SET_ENVIRONMENT_FILTER':
      localStorage.setItem('shell-ai-env-filter', action.payload);
      return { ...state, environmentFilter: action.payload };
    case 'LOGIN':
      return { ...state, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'UPDATE_USE_CASE':
      return { ...state, useCases: state.useCases.map(uc => uc.id === action.payload.id ? action.payload : uc), lastUpdated: new Date().toISOString() };
    case 'ADD_USE_CASE':
      return { ...state, useCases: [...state.useCases, action.payload], lastUpdated: new Date().toISOString() };
    case 'ACKNOWLEDGE_ALERT':
      return { ...state, alerts: state.alerts.map(a => a.id === action.payload ? { ...a, acknowledged: true } : a), lastUpdated: new Date().toISOString() };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts.slice(-2), action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'UPDATE_APPROVAL': {
      const { useCaseId, step, status, comments, approvedBy } = action.payload;
      return {
        ...state,
        lastUpdated: new Date().toISOString(),
        useCases: state.useCases.map(uc => {
          if (uc.id !== useCaseId) return uc;
          return {
            ...uc,
            approvals: uc.approvals.map(a =>
              a.step === step ? { ...a, status, comments, approvedBy, approvedAt: new Date().toISOString() } : a
            ),
          };
        }),
      };
    }
    case 'SET_USE_CASE_STATUS':
      return {
        ...state,
        lastUpdated: new Date().toISOString(),
        useCases: state.useCases.map(uc =>
          uc.id === action.payload.useCaseId ? { ...uc, status: action.payload.status } : uc
        ),
      };
    default:
      return state;
  }
}

const initialState: AppState = {
  isAuthenticated: false,
  currentPersona: loadPersistedPersona(),
  environmentFilter: loadPersistedEnvFilter(),
  darkMode: false,
  useCases: initialUseCases,
  alerts: initialAlerts,
  notifications: 5,
  toasts: [],
  lastUpdated: new Date().toISOString(),
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useCurrentPersona() {
  const { state } = useApp();
  return personas.find(p => p.id === state.currentPersona)!;
}

export function usePersonaAccess(module: string) {
  const persona = useCurrentPersona();
  return persona.accessModules.includes(module);
}

export function addToast(dispatch: React.Dispatch<Action>, type: AppState['toasts'][0]['type'], title: string, description?: string) {
  const id = Date.now().toString();
  dispatch({ type: 'ADD_TOAST', payload: { id, type, title, description } });
  setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 2000);
}
