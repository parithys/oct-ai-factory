import React from 'react';
import { useApp, useCurrentPersona } from '@/context/AppContext';
import { buildToTransfer } from '@/data/mockData';
import {
  computeMetrics, scopeUseCases, getPersonaCategory,
} from '@/data/metrics';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import StatusBadge from '@/components/StatusBadge';
import { useCaseStatusLabels } from '@/data/metrics';

const COLORS = ['#FBCE07', '#2B4590', '#1A7A4A', '#DD1D21', '#D4820A', '#8A8AAA', '#4A4A6A'];
const PHASE_LEGEND = [
  { label: 'PoC', color: '#FBCE07' },
  { label: 'Deploy', color: '#2B4590' },
  { label: 'Scale', color: '#1A7A4A' },
  { label: 'Run', color: '#D4820A' },
];
const BTT_LEGEND = [
  { label: 'Shell', color: '#1A7A4A' },
  { label: 'Wipro', color: '#DD1D21', dashed: true },
];

function ChartCaption({ label }: { label: string }) {
  return <p className="mt-1 text-center text-sm text-muted-foreground">{label}</p>;
}

function ChartLegend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean }> }) {
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="h-0.5 w-5 rounded-full"
            style={{
              backgroundColor: item.dashed ? 'transparent' : item.color,
              borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
            }}
            aria-hidden="true"
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { state } = useApp();
  const persona = useCurrentPersona();
  const cat = getPersonaCategory(persona.id);
  const isBiz = cat === 'business';
  const allUcs = state.useCases;
  const ucs = scopeUseCases(allUcs, persona.id);
  const metrics = computeMetrics(ucs);
  const allMetrics = computeMetrics(allUcs);

  const statusDist = Object.entries(
    ucs.reduce((acc, uc) => { const label = useCaseStatusLabels[uc.status] || uc.status; acc[label] = (acc[label] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const reuseData = ucs.map(uc => ({ name: uc.id, ratio: Math.round(uc.components.reuseRatio * 100) })).sort((a, b) => b.ratio - a.ratio);

  const costByPhase = ucs.filter(uc => uc.status !== 'draft').slice(0, 6).map(uc => ({
    name: uc.id, PoC: uc.costs.poc / 1000, Deploy: uc.costs.deployment / 1000, Scale: uc.costs.scaling / 1000, Run: uc.costs.annualRunMaintain / 1000,
  }));

  const bttData = buildToTransfer.snapshots.map(s => ({ name: `M${s.month}`, Shell: s.shell, Wipro: s.wipro }));

  // Persona-aware insights
  const insights = isBiz ? [
    { bullets: [`${metrics.pipeline} use case${metrics.pipeline !== 1 ? 's' : ''} in your portfolio`, `${metrics.inDev} currently in active development`, `${metrics.deployed} deployed to production`], confidence: 92, impact: 'High', link: '/use-cases', action: 'View Portfolio' },
    { bullets: ['Budget utilization at 90% — on track', 'No timeline risks identified', 'All deliveries progressing as planned'], confidence: 88, impact: 'Medium', link: '/dashboard', action: 'View Dashboard' },
  ] : cat === 'idso' ? [
    { bullets: [`${metrics.deployed} solution${metrics.deployed !== 1 ? 's' : ''} running in production`, 'SLA compliance at 99.2% — above target', 'All endpoints within response time thresholds'], confidence: 94, impact: 'High', link: '/monitoring', action: 'View Monitoring' },
    { bullets: ['2 use cases approaching deployment within 60 days', 'Ops readiness assessments on track', 'No infrastructure capacity concerns'], confidence: 87, impact: 'Medium', link: '/deployment', action: 'View Deployment Pipeline' },
    { bullets: ['Avg annual run cost per solution: $18K', 'Run costs stable quarter-over-quarter', 'No cost anomalies detected'], confidence: 91, impact: 'Medium', link: '/dashboard', action: 'View Dashboard' },
  ] : cat === 'idt' ? [
    { bullets: [`Pipeline contains ${metrics.total} use cases`, `${metrics.submitted} awaiting IDT review`, `${metrics.approved} qualified and ready for development`], confidence: 90, impact: 'High', link: '/use-cases', action: 'View Pipeline' },
    { bullets: ['Avg handoff speed improved to 12 days', 'Intake completeness scores above threshold', 'No qualification backlogs'], confidence: 85, impact: 'Medium', link: '/governance', action: 'View Governance' },
  ] : [
    { bullets: ['UC-001 on track for go-live: June 15, 2026', 'Current sprint velocity supports timeline', 'No blockers identified'], confidence: 89, impact: 'High', link: '/use-cases/UC-001', action: 'View UC-001 details' },
    { bullets: [`UC-003 has ${allUcs.find(u => u.id === 'UC-003')?.components.netNew || 0} net-new components`, 'Highest in current cohort', 'Recommendation: architecture review before pod assignment'], confidence: 78, impact: 'Medium', link: '/use-cases/UC-003', action: 'Review architecture' },
    { bullets: [`Wipro/Shell ratio at ${buildToTransfer.snapshots[buildToTransfer.currentMonth - 1]?.wipro}/${buildToTransfer.snapshots[buildToTransfer.currentMonth - 1]?.shell}`, 'Slightly behind target', 'Recommendation: accelerate Shell onboarding'], confidence: 85, impact: 'High', link: '/dashboard', action: 'View trajectory' },
    { bullets: ['COMP-001 (RAG Pipeline Template) reused 7 times', `Estimated savings: ~$154K`, 'Recommendation: promote to v4'], confidence: 92, impact: 'Medium', link: '/use-cases', action: 'Promote to v4' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">{isBiz ? 'My Use Cases' : cat === 'idso' ? 'In Production' : 'Total Use Cases'}</p><p className="text-2xl font-display font-bold text-foreground">{isBiz ? metrics.pipeline : cat === 'idso' ? metrics.deployed : metrics.total}</p></div>
        {cat !== 'idso' && <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">In Development</p><p className="text-2xl font-display font-bold text-foreground">{metrics.inDev}</p></div>}
        {cat !== 'idso' && <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">In Production</p><p className="text-2xl font-display font-bold text-foreground">{metrics.deployed}</p></div>}
        {cat === 'idso' && <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Approaching Deployment</p><p className="text-2xl font-display font-bold text-foreground">2</p></div>}
        {cat === 'idso' && <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">SLA Compliance</p><p className="text-2xl font-display font-bold text-accent-green">99.2%</p></div>}
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">{cat === 'idso' ? 'Avg Run Cost' : 'Reuse Ratio'}</p><p className="text-2xl font-display font-bold text-foreground">{cat === 'idso' ? '$18K/yr' : `${metrics.avgReuseRatioPct}%`}</p></div>
        {(cat === 'ide-leadership' || cat === 'ide-delivery') && <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Total Invested</p><p className="text-2xl font-display font-bold text-foreground">{allMetrics.totalInvestedFormatted}</p></div>}
        {(cat === 'ide-leadership' || cat === 'ide-delivery') && <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Reuse Savings</p><p className="text-2xl font-display font-bold text-accent-green">{allMetrics.reuseSavingsFormatted}</p></div>}
        {cat === 'idso' && <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">Avg Uptime</p><p className="text-2xl font-display font-bold text-accent-green">99.8%</p></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
          <h3 className="font-bold text-foreground mb-3">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={statusDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
              {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
          <h3 className="font-bold text-foreground mb-3">Reuse Ratio by Use Case</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reuseData} layout="vertical" margin={{ bottom: 35, left: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Reuse Ratio (%)', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} /><YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="ratio" fill="#1A7A4A" radius={[0, 4, 4, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(cat === 'ide-leadership' || cat === 'ide-delivery') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
            <h3 className="font-bold text-foreground mb-3">Cost by Phase ($K)</h3>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={costByPhase} margin={{ bottom: 6, left: 0, right: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis width={50} tickMargin={4} tick={{ fontSize: 10 }} label={{ value: 'Cost ($K)', angle: -90, position: 'center', dx: -16, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} /><Tooltip />
                <Bar dataKey="PoC" fill="#FBCE07" /><Bar dataKey="Deploy" fill="#2B4590" /><Bar dataKey="Scale" fill="#1A7A4A" /><Bar dataKey="Run" fill="#D4820A" />
              </BarChart>
            </ResponsiveContainer>
            <ChartLegend items={PHASE_LEGEND} />
            <ChartCaption label="Use Case" />
          </div>
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
            <h3 className="font-bold text-foreground mb-3">Build-to-Transfer</h3>
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={bttData} margin={{ bottom: 6, left: 0, right: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis width={50} tickMargin={4} domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Capability (%)', angle: -90, position: 'center', dx: -16, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} /><Tooltip />
                <ReferenceLine x={`M${buildToTransfer.currentMonth}`} stroke="#DD1D21" strokeWidth={2} strokeDasharray="4 4" label={{ value: '▼ Today', position: 'top', fill: '#DD1D21', fontSize: 10, fontWeight: 600 }} />
                <Line dataKey="Shell" stroke="#1A7A4A" strokeWidth={2} /><Line dataKey="Wipro" stroke="#DD1D21" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            <ChartLegend items={BTT_LEGEND} />
            <ChartCaption label="Month" />
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-accent-amber" /> {isBiz ? 'Portfolio Insights' : 'Predictive Insights'}</h3>
        <div className="space-y-4">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-surface-elevated rounded-lg">
              <div className="flex-1">
                <ul className="text-sm text-foreground space-y-1 list-none">
                  {ins.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2"><span className="text-accent-amber mt-0.5">•</span><span>{b}</span></li>
                  ))}
                </ul>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full">Confidence: {ins.confidence}%</span>
                  <StatusBadge status={ins.impact === 'High' ? 'high' : 'medium'} label={`Impact: ${ins.impact}`} />
                </div>
              </div>
              <Link to={ins.link} aria-label={`Take action: ${ins.action}`} className="flex items-center gap-1 text-xs text-accent-blue hover:underline shrink-0 mt-1 text-right max-w-[260px]">
                {ins.action} <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
