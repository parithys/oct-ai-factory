import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dataSources } from '@/data/mockData';
import { dataManagementAlerts } from '@/data/metrics';
import { Search, Database, Play, CheckCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useCurrentPersona } from '@/context/AppContext';
import StatusBadge from '@/components/StatusBadge';

export default function DataManagement() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [ingestionRunning, setIngestionRunning] = useState(false);
  const [ingestionStep, setIngestionStep] = useState(0);
  const persona = useCurrentPersona();
  const canRunIngestion = ['ide-gm', 'ide-pm', 'pod-member', 'wipro-delivery', 'idt-advisor'].includes(persona.id);

  const filtered = dataSources.filter(ds => {
    if (typeFilter !== 'all' && ds.type !== typeFilter) return false;
    if (search && !ds.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = dataSources.find(d => d.id === selectedSource);
  const ingestionSteps = ['Connecting to source...', 'Extracting records...', 'Applying transformations...', 'Validating schema...', 'Complete'];

  const runIngestion = () => {
    setIngestionRunning(true);
    setIngestionStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setIngestionStep(step);
      if (step >= ingestionSteps.length - 1) { clearInterval(interval); setTimeout(() => setIngestionRunning(false), 2000); }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Data Management</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Overall Quality</p><p className="text-2xl font-display font-bold text-accent-green">96.4%</p></div>
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Rules Passing</p><p className="text-2xl font-display font-bold text-foreground">42/45</p></div>
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Data Quality Alerts</p><p className="text-2xl font-display font-bold text-shell-red">{dataManagementAlerts.length}</p></div>
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Data Sources</p><p className="text-2xl font-display font-bold text-foreground">{dataSources.length}</p></div>
      </div>

      {/* Data Quality Alerts only (SLA/operational alerts removed) */}
      <div className="space-y-2">
        {dataManagementAlerts.map((a, i) => (
          <div key={i} className={`bg-surface-card border border-border-subtle rounded-md p-3 flex items-center gap-3 text-sm ${a.sev}`}>
            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
            {a.msg}
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <label htmlFor="ds-search" className="sr-only">Search data sources</label>
          <input id="ds-search" type="text" placeholder="Search data sources..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <label htmlFor="ds-type-filter" className="sr-only">Filter by type</label>
        <select id="ds-type-filter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-surface-card border border-border-subtle rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Types</option>
          <option value="Structured">Structured</option>
          <option value="Unstructured">Unstructured</option>
          <option value="Streaming">Streaming</option>
        </select>
        {canRunIngestion && (
          <button onClick={runIngestion} disabled={ingestionRunning} aria-label="Run data ingestion pipeline" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 disabled:opacity-50">
            <Play className="w-4 h-4" aria-hidden="true" /> Run Ingestion
          </button>
        )}
      </div>

      {ingestionRunning && (
        <div className="bg-surface-card border border-border-subtle rounded-lg p-4 space-y-2">
          {ingestionSteps.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm ${i <= ingestionStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {i < ingestionStep ? <CheckCircle className="w-4 h-4 text-accent-green" /> : i === ingestionStep ? <div className="w-4 h-4 border-2 border-shell-yellow border-t-transparent rounded-full animate-spin" /> : <div className="w-4 h-4" />}
              {step}
            </div>
          ))}
          {ingestionStep >= ingestionSteps.length - 1 && <p className="text-xs text-accent-green mt-2">✓ Ingestion complete. 84,231 records processed. 0 errors.</p>}
        </div>
      )}

      <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
        <table className="w-full text-sm" aria-label="Data sources">
          <thead><tr className="bg-surface-elevated border-b border-border-subtle">
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Name</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Type</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Domain</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Quality</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Rows</th>
            <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Connected Use Cases</th>
          </tr></thead>
          <tbody>
            {filtered.map(ds => (
              <tr key={ds.id} role="button" tabIndex={0} aria-label={`View details for ${ds.name}`} className="border-b border-border-subtle hover:bg-surface-elevated cursor-pointer transition-colors" onClick={() => setSelectedSource(ds.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSource(ds.id); } }}>
                <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2"><Database className="w-4 h-4 text-muted-foreground" />{ds.name}</td>
                <td className="py-3 px-4"><StatusBadge status={ds.type.toLowerCase()} label={ds.type} /></td>
                <td className="py-3 px-4 text-muted-foreground">{ds.domain}</td>
                <td className="py-3 px-4"><span className={ds.qualityScore >= 95 ? 'text-accent-green' : ds.qualityScore >= 90 ? 'text-accent-amber' : 'text-shell-red'}>{ds.qualityScore}%</span></td>
                <td className="py-3 px-4 font-mono text-xs">{(ds.rowCount / 1000000).toFixed(1)}M</td>
                <td className="py-3 px-4 text-xs">{ds.connectedUseCases.length > 0 ? ds.connectedUseCases.map((ucId, i) => (<React.Fragment key={ucId}>{i > 0 && ', '}<Link to={`/use-cases/${ucId}`} className="text-accent-blue hover:underline" onClick={e => e.stopPropagation()}>{ucId}</Link></React.Fragment>)) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(isOpen) => { if (!isOpen) setSelectedSource(null); }}>
        <SheetContent side="right" className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-elevated rounded-md p-3"><p className="text-xs font-bold text-muted-foreground">Type</p><p className="text-sm font-medium">{selected.type}</p></div>
                  <div className="bg-surface-elevated rounded-md p-3"><p className="text-xs font-bold text-muted-foreground">Quality</p><p className="text-sm font-medium">{selected.qualityScore}%</p></div>
                  <div className="bg-surface-elevated rounded-md p-3"><p className="text-xs font-bold text-muted-foreground">Row Count</p><p className="text-sm font-medium font-mono">{selected.rowCount.toLocaleString()}</p></div>
                  <div className="bg-surface-elevated rounded-md p-3"><p className="text-xs font-bold text-muted-foreground">Owner</p><p className="text-sm font-medium">{selected.owner}</p></div>
                </div>
                <h3 className="text-sm font-bold text-foreground mt-4">Schema</h3>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border-subtle"><th className="text-left py-2 text-muted-foreground">Field</th><th className="text-left py-2 text-muted-foreground">Type</th><th className="text-left py-2 text-muted-foreground">Sample</th></tr></thead>
                  <tbody>{selected.fields.map(f => (<tr key={f.name} className="border-b border-border-subtle"><td className="py-2 font-mono text-foreground">{f.name}</td><td className="py-2 text-muted-foreground">{f.type}</td><td className="py-2 font-mono text-muted-foreground">{f.sample}</td></tr>))}</tbody>
                </table>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
