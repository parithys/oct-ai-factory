import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { deployedEndpoints } from '@/data/mockData';
import { deploymentStatusLabels, getPersonaCategory } from '@/data/metrics';
import { Rocket } from 'lucide-react';
import { useCurrentPersona } from '@/context/AppContext';
import DeployModelWizard from '@/components/DeployModelWizard';
import StatusBadge from '@/components/StatusBadge';

export default function Deployment() {
  const persona = useCurrentPersona();
  const cat = getPersonaCategory(persona.id);
  const canDeploy = ['ide-gm', 'ide-pm', 'idso-gm', 'idso-pm', 'pod-member', 'wipro-delivery'].includes(persona.id);
  const [wizardOpen, setWizardOpen] = useState(false);

  const columns = [
    { label: 'Ready for Deployment', filter: 'ready' as const },
    { label: 'Deploying', filter: 'deploying' as const },
    { label: 'Active', filter: 'deployed' as const },
    { label: 'Rollback Required', filter: 'rollback-required' as const },
  ];

  // Business personas should see simplified view
  const showTechnicalDetails = cat !== 'business';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-foreground">Deployment</h1>
        {canDeploy && (
          <button onClick={() => setWizardOpen(true)} aria-label="Deploy a model" className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
            <Rocket className="w-5 h-5" aria-hidden="true" /> Deploy Model
          </button>
        )}
      </div>

      <DeployModelWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const eps = deployedEndpoints.filter(ep => ep.status === col.filter);
          return (
            <div key={col.filter} className="bg-surface-elevated rounded-lg p-4">
              <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">{col.label} ({eps.length})</h3>
              <div className="space-y-2">
                {eps.map(ep => (
                  <div key={ep.id} className="bg-surface-card rounded-md p-3 border border-border-subtle shadow-sm">
                    <p className="text-sm font-medium text-foreground"><Link to={`/use-cases/${ep.useCaseId}`} className="hover:text-accent-blue hover:underline transition-colors">{ep.useCaseTitle}</Link></p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={ep.environment.toLowerCase()} label={col.filter === 'ready' ? `Target: ${ep.environment}` : ep.environment} />
                      <span className="text-xs text-muted-foreground">{ep.version}</span>
                    </div>
                    {showTechnicalDetails && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{ep.endpoint}</p>
                    )}
                  </div>
                ))}
                {eps.length === 0 && <p className="text-xs text-muted-foreground italic">No items</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Endpoints Table */}
      <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
        <h3 className="px-4 py-3 font-bold text-foreground border-b border-border-subtle">Active Endpoints</h3>
        <table className="w-full text-sm" aria-label="Active endpoints">
          <thead><tr className="bg-surface-elevated border-b border-border-subtle">
            {showTechnicalDetails && <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Endpoint</th>}
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Use Case</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Environment</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Version</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
            {showTechnicalDetails && <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Uptime</th>}
            {showTechnicalDetails && <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Response</th>}
            {showTechnicalDetails && <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Req/Day</th>}
          </tr></thead>
          <tbody>
            {deployedEndpoints.map(ep => (
              <tr key={ep.id} className="border-b border-border-subtle hover:bg-surface-elevated transition-colors">
                {showTechnicalDetails && <td className="py-3 px-4 font-mono text-xs text-muted-foreground truncate max-w-[200px]">{ep.endpoint}</td>}
                <td className="py-3 px-4 font-medium text-foreground"><Link to={`/use-cases/${ep.useCaseId}`} className="hover:text-accent-blue hover:underline transition-colors">{ep.useCaseTitle}</Link></td>
                <td className="py-3 px-4"><StatusBadge status={ep.environment.toLowerCase()} label={ep.environment} /></td>
                <td className="py-3 px-4 text-foreground font-mono text-xs">{ep.version}</td>
                <td className="py-3 px-4"><StatusBadge status={ep.status} label={deploymentStatusLabels[ep.status]} /></td>
                {showTechnicalDetails && <td className="py-3 px-4 text-foreground">{ep.uptime > 0 ? `${ep.uptime}%` : '—'}</td>}
                {showTechnicalDetails && <td className="py-3 px-4 text-foreground">{ep.avgResponseTime > 0 ? `${ep.avgResponseTime}ms` : '—'}</td>}
                {showTechnicalDetails && <td className="py-3 px-4 text-foreground">{ep.requestsPerDay > 0 ? ep.requestsPerDay.toLocaleString() : '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
