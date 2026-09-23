import React, { useState, useEffect } from 'react';
import { experiments } from '@/data/mockData';
import { Link, useParams } from 'react-router-dom';
import { Search, ArrowLeft, PlayCircle } from 'lucide-react';
import { useCurrentPersona } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import NewExperimentWizard from '@/components/NewExperimentWizard';
import StatusBadge from '@/components/StatusBadge';

export default function ModelLab() {
  const { experimentId } = useParams();
  const [search, setSearch] = useState('');
  const [simProgress, setSimProgress] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const persona = useCurrentPersona();
  const navigate = useNavigate();
  const canCreate = ['pod-member', 'ide-pm', 'wipro-delivery', 'ide-gm'].includes(persona.id);

  const selected = experimentId ? experiments.find(e => e.id === experimentId) : null;

  const filtered = experiments.filter(e => !search || e.useCaseTitle.toLowerCase().includes(search.toLowerCase()) || e.modelType.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (selected && selected.status === 'running') {
      const interval = setInterval(() => setSimProgress(p => Math.min(p + 1, selected.epochs.total)), 3000);
      setSimProgress(selected.epochs.current);
      return () => clearInterval(interval);
    }
  }, [selected]);

  const trainingData = Array.from({ length: 20 }, (_, i) => ({
    epoch: i + 1,
    train_loss: 0.5 * Math.exp(-i * 0.15) + 0.02 + Math.random() * 0.01,
    val_loss: 0.55 * Math.exp(-i * 0.12) + 0.04 + Math.random() * 0.02,
  }));

  if (selected) {
    const featureData = selected.features.map(f => ({ name: f.name, importance: Math.round(f.importance * 100) }));
    return (
      <div className="space-y-6">
        <Link to="/model-lab" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back to Experiments</Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-muted-foreground">{selected.id}</span>
              <StatusBadge status={selected.status} />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">{selected.useCaseTitle}</h1>
            <p className="text-sm text-muted-foreground">{selected.modelType} · Owner: {selected.owner}</p>
          </div>
        </div>

        {selected.status === 'running' && (
          <div className="bg-surface-card rounded-lg border border-border-subtle p-4">
            <div className="flex justify-between text-sm mb-2"><span>Training Progress</span><span>Epoch {simProgress}/{selected.epochs.total}</span></div>
            <div className="w-full h-3 bg-border-subtle rounded-full overflow-hidden"><div className="h-full bg-shell-yellow rounded-full transition-all" style={{ width: `${(simProgress / selected.epochs.total) * 100}%` }} /></div>
            <div className="mt-3 bg-foreground/5 rounded p-3 font-mono text-xs text-muted-foreground max-h-32 overflow-y-auto">
              {Array.from({ length: Math.min(simProgress, 5) }, (_, i) => (
                <div key={i}>Epoch {simProgress - 4 + i}/{selected.epochs.total} — loss: {(0.12 - i * 0.008).toFixed(4)} — val_loss: {(0.14 - i * 0.006).toFixed(4)} — acc: {(0.88 + i * 0.005).toFixed(3)}</div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
            <h3 className="font-bold text-foreground mb-3">Hyperparameters</h3>
            <table className="w-full text-sm"><tbody>
              {Object.entries(selected.hyperparameters).map(([k, v]) => (
                <tr key={k} className="border-b border-border-subtle"><td className="py-2 text-muted-foreground font-mono text-xs">{k}</td><td className="py-2 text-foreground font-mono text-xs">{String(v)}</td></tr>
              ))}
            </tbody></table>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
            <h3 className="font-bold text-foreground mb-3">Metrics</h3>
            {Object.keys(selected.metrics).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(selected.metrics).map(([k, v]) => (
                  <div key={k} className="bg-surface-elevated rounded-md p-3"><p className="text-xs text-muted-foreground uppercase">{k}</p><p className="text-lg font-display">{typeof v === 'number' ? (v < 1 ? (v * 100).toFixed(1) + '%' : v.toFixed(1)) : v}</p></div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm">No metrics available yet</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
            <h3 className="font-bold text-foreground mb-3">Feature Importance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={featureData} layout="vertical" margin={{ bottom: 35, left: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" label={{ value: 'Importance (weight)', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} /><YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} label={{ value: 'Feature', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} /><Tooltip /><Bar dataKey="importance" fill="#FBCE07" radius={[0, 4, 4, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
            <h3 className="font-bold text-foreground mb-3">Training History</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trainingData} margin={{ bottom: 35, left: 15 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="epoch" tick={{ fontSize: 11 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} /><YAxis tick={{ fontSize: 11 }} label={{ value: 'Loss', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} /><Tooltip /><Line type="monotone" dataKey="train_loss" stroke="#FBCE07" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="val_loss" stroke="#DD1D21" strokeWidth={2} dot={false} strokeDasharray="5 5" /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {selected.versions.length > 0 && (
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
            <h3 className="font-bold text-foreground mb-3">Version History</h3>
            <table className="w-full text-sm"><thead><tr className="border-b border-border-subtle"><th className="text-left py-2 text-xs text-muted-foreground">Version</th><th className="text-left py-2 text-xs text-muted-foreground">Accuracy</th><th className="text-left py-2 text-xs text-muted-foreground">Date</th><th className="text-left py-2 text-xs text-muted-foreground">Status</th></tr></thead>
              <tbody>{selected.versions.map(v => (<tr key={v.version} className="border-b border-border-subtle"><td className="py-2 font-mono">{v.version}</td><td className="py-2">{(v.accuracy * 100).toFixed(1)}%</td><td className="py-2 text-muted-foreground">{v.date}</td><td className="py-2">{v.promoted ? <StatusBadge status="promoted" label="Promoted" /> : '—'}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const formatMetric = (exp: typeof experiments[0]) => {
    const entries = Object.entries(exp.metrics);
    if (entries.length === 0) return '—';
    const [key, val] = entries[0];
    if (key === 'accuracy') return `${(val * 100).toFixed(1)}%`;
    if (key === 'rouge') return `ROUGE: ${val}`;
    if (key === 'reward') return `Reward: ${val}`;
    if (key === 'r2') return `R²: ${val}`;
    return `${key}: ${val}`;
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Model Lab</h1>
        {canCreate && (
          <button onClick={() => setWizardOpen(true)} className="flex items-center gap-2 border border-primary text-foreground bg-primary px-5 py-2.5 rounded-md font-medium text-sm hover:opacity-90 transition-opacity" aria-label="Create a new experiment">
            <PlayCircle className="w-5 h-5" aria-hidden="true" /> New Experiment
          </button>
        )}
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <label htmlFor="exp-search" className="sr-only">Search experiments</label>
        <input id="exp-search" type="text" placeholder="Search experiments..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border-subtle rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <NewExperimentWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
         <table className="w-full text-sm" aria-label="Experiments list">
          <thead><tr className="bg-surface-elevated border-b border-border-subtle">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Experiment ID</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Use Case</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Model Type</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Accuracy/Score</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Created</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Owner</th>
          </tr></thead>
          <tbody>
            {filtered.map(exp => (
              <tr key={exp.id} role="link" tabIndex={0} aria-label={`View experiment ${exp.id}: ${exp.useCaseTitle}`} className="border-b border-border-subtle hover:bg-surface-elevated cursor-pointer transition-colors" onClick={() => navigate(`/model-lab/${exp.id}`)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/model-lab/${exp.id}`); } }}>
                <td className="py-3 px-4 font-mono text-sm text-foreground">{exp.id}</td>
                <td className="py-3 px-4 text-foreground"><Link to={`/use-cases/${exp.useCaseId}`} className="text-accent-blue hover:underline">{exp.useCaseId}</Link></td>
                <td className="py-3 px-4 text-foreground">{exp.modelType}</td>
                <td className="py-3 px-4"><StatusBadge status={exp.status} /></td>
                <td className="py-3 px-4 text-foreground">{formatMetric(exp)}</td>
                <td className="py-3 px-4 text-foreground">{exp.createdAt}</td>
                <td className="py-3 px-4 text-foreground">{exp.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
