import React from 'react';
import { useCurrentPersona } from '@/context/AppContext';

export default function ProfilePage() {
  const persona = useCurrentPersona();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-display font-bold text-foreground">Profile</h1>

      <div className="bg-surface-card rounded-lg border border-border-subtle p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-accent-blue flex items-center justify-center text-xl font-bold text-accent-foreground">{persona.avatar}</div>
          <div>
            <h2 className="text-xl font-display text-foreground">{persona.name}</h2>
            <p className="text-sm text-muted-foreground">{persona.role} · {persona.layer} Layer</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-foreground">{persona.name.toLowerCase().replace(' ', '.')}@shell.com</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <p className="text-foreground">{persona.role}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Layer</label>
            <p className="text-foreground">{persona.layer}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Accessible Modules</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {persona.accessModules.map(m => (
                <span key={m} className="text-xs bg-surface-elevated px-3 py-1 rounded-full text-foreground border border-border-subtle">{m}</span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Key Performance Indicators</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {persona.kpis.map(k => (
                <span key={k} className="text-xs bg-shell-yellow/10 px-3 py-1 rounded-full text-foreground">{k}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
