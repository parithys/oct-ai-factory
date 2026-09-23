import React from 'react';
import { useApp } from '@/context/AppContext';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'border-l-4 border-l-accent-green bg-surface-card',
  error: 'border-l-4 border-l-shell-red bg-surface-card',
  warning: 'border-l-4 border-l-accent-amber bg-surface-card',
  info: 'border-l-4 border-l-accent-blue bg-surface-card',
};

export default function ToastContainer() {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {state.toasts.map(toast => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`${colorMap[toast.type]} rounded-md shadow-lg p-4 animate-fade-in flex items-start gap-3`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">{toast.title}</p>
              {toast.description && <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>}
            </div>
            <button
              onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
