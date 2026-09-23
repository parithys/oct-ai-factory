import React, { useState } from 'react';
import { useApp, addToast } from '@/context/AppContext';
import { personas } from '@/data/personas';
import { Sun, Moon, SlidersHorizontal } from 'lucide-react';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const [notifStrategy, setNotifStrategy] = useState('email-inapp');
  const [schemaEnforcement, setSchemaEnforcement] = useState(true);
  const [completenessGating, setCompletenessGating] = useState(true);

  const handleSaveGlobalConfig = () => {
    addToast(dispatch, 'success', 'Global configuration saved', `Notification: ${notifStrategy}, Schema: ${schemaEnforcement ? 'on' : 'off'}, Gating: ${completenessGating ? 'on' : 'off'}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="bg-surface-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-lg font-display text-foreground mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border-subtle hover:bg-surface-elevated transition-colors"
              >
                {state.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {state.darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          <div className="bg-surface-card rounded-lg border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-6">
              <SlidersHorizontal className="w-5 h-5 text-foreground" aria-hidden="true" />
              <h2 className="text-lg font-display text-foreground">Global Configuration</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label htmlFor="notif-strategy" className="block text-sm font-medium text-foreground mb-2">Default Notification Strategy</label>
                <select
                  id="notif-strategy"
                  value={notifStrategy}
                  onChange={e => setNotifStrategy(e.target.value)}
                  className="w-full bg-surface-card border border-border-subtle rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="email-inapp">Email + In-App</option>
                  <option value="email-only">Email Only</option>
                  <option value="inapp-only">In-App Only</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">Enable Automatic Schema Enforcement (Data Mgmt)</span>
                <button role="switch" aria-checked={schemaEnforcement} aria-label="Enable Automatic Schema Enforcement" onClick={() => setSchemaEnforcement(v => !v)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${schemaEnforcement ? 'bg-accent-green' : 'bg-border-strong'}`}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${schemaEnforcement ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">Strict Completeness Gating (Intake Form)</span>
                <button role="switch" aria-checked={completenessGating} aria-label="Strict Completeness Gating" onClick={() => setCompletenessGating(v => !v)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${completenessGating ? 'bg-accent-green' : 'bg-border-strong'}`}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${completenessGating ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <button onClick={handleSaveGlobalConfig} className="w-full mt-6 bg-primary text-primary-foreground font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity">
              Save Global Config
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="bg-surface-card rounded-lg border border-border-subtle p-6 h-fit">
          <h2 className="text-lg font-display text-foreground mb-4">Persona Configuration</h2>
          <p className="text-sm text-muted-foreground mb-4">Current persona determines visible modules, KPIs, and available actions.</p>
          <div className="space-y-2">
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => dispatch({ type: 'SET_PERSONA', payload: p.id })}
                className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${state.currentPersona === p.id ? 'bg-shell-yellow/10 border border-shell-yellow' : 'bg-surface-elevated hover:bg-muted border border-transparent'}`}
              >
                <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-xs font-bold text-accent-foreground">{p.avatar}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name} — {p.role}</p>
                  <p className="text-xs text-muted-foreground">{p.layer} · Access: {p.accessModules.join(', ')}</p>
                </div>
                {state.currentPersona === p.id && <div className="ml-auto w-2 h-2 rounded-full bg-shell-yellow" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}