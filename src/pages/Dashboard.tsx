import React from 'react';
import { useApp, useCurrentPersona, addToast } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { pods, buildToTransfer } from '@/data/mockData';
import {
  computeMetrics, scopeUseCases, getDashboardKpis,
  getPersonaCategory, lifecycleStageLabels,
} from '@/data/metrics';
import { generateAiInsights, type AiInsight, type AiInsightSection } from '@/data/aiInsights';
import { TrendingUp, TrendingDown, Minus, ArrowRight, AlertTriangle, Clock, Shield, Lightbulb, Target, Activity, Brain, FileText, Mail, Download, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart, ReferenceLine } from 'recharts';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StatusBadge from '@/components/StatusBadge';

const stageTooltips: Record<string, string> = {
  intake: 'Newly submitted use cases awaiting initial review and feasibility assessment by the IDT team.',
  'architecture-review': 'Use cases being evaluated for technical architecture, component reuse potential, and infrastructure requirements.',
  'pod-assignment': 'Qualified use cases being matched to a delivery pod based on capacity, skills, and priority.',
  development: 'Actively being built by the assigned pod. Sprint progress and velocity are tracked here.',
  testing: 'Development complete — undergoing QA, integration testing, and user acceptance testing.',
  deployment: 'Approved for production release. Deployment pipeline is active.',
  live: 'Successfully deployed and running in production. Monitored by IDSO.',
};

function KpiCard({ label, value, trend, trendLabel }: { label: string; value: string; trend?: 'up' | 'down' | 'stable'; trendLabel?: string }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-accent-green' : trend === 'down' ? 'text-shell-red' : 'text-muted-foreground';
  return (
    <div className="bg-surface-card rounded-lg border border-border-subtle p-5 shadow-sm">
      <p className="text-sm font-bold text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      {trendLabel && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

const insightTypeConfig: Record<AiInsight['type'], { icon: typeof AlertTriangle; color: string; label: string }> = {
  insight: { icon: Lightbulb, color: 'text-accent-blue', label: 'Insight' },
  risk: { icon: AlertTriangle, color: 'text-shell-red', label: 'Risk' },
  prediction: { icon: Target, color: 'text-accent-amber', label: 'Prediction' },
  recommendation: { icon: Shield, color: 'text-accent-green', label: 'Action' },
};

const sectionIconMap: Record<AiInsightSection['icon'], typeof Activity> = {
  health: Activity,
  pipeline: Target,
  handover: Share2,
  monitoring: Shield,
  prediction: Brain,
};

function generatePdfReport(sections: AiInsightSection[], personaName: string, personaRole: string) {
  const typeLabels: Record<string, string> = { insight: 'INSIGHT', risk: 'RISK', prediction: 'PREDICTION', recommendation: 'ACTION' };
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>AI Insights Report</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a2e; line-height: 1.6; }
  h1 { font-size: 22px; border-bottom: 3px solid #FBCE07; padding-bottom: 8px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
  h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #1a1a2e; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #FBCE07; padding-left: 8px; }
  .insight { margin: 6px 0; padding: 6px 10px; border-radius: 4px; font-size: 13px; }
  .tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 6px; }
  .tag-insight { color: #2563eb; } .tag-risk { color: #dc2626; } .tag-prediction { color: #d97706; } .tag-recommendation { color: #16a34a; }
  .insight-risk { background: #fef2f2; } .insight-insight { background: #eff6ff; } .insight-prediction { background: #fffbeb; } .insight-recommendation { background: #f0fdf4; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; }
  @media print { body { margin: 20px; } }
</style></head><body>`;
  html += `<h1>🧠 AI Insights Report</h1>`;
  html += `<div class="meta">${personaName} · ${personaRole} · ${date}</div>`;

  for (const section of sections) {
    html += `<h2>${section.title}</h2>`;
    for (const insight of section.insights) {
      html += `<div class="insight insight-${insight.type}"><span class="tag tag-${insight.type}">${typeLabels[insight.type] || insight.type}</span>• ${insight.text}</div>`;
    }
  }
  html += `<div class="footer">Generated by Shell AI Factory · ${date}</div></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
  }
}

function AiSummaryPanel({ sections, onAction, personaName, personaRole }: { sections: AiInsightSection[]; onAction: (action: string) => void; personaName: string; personaRole: string }) {
  const [expandedSections, setExpandedSections] = React.useState<Record<number, boolean>>(
    Object.fromEntries(sections.map((_, i) => [i, false]))
  );

  const allExpanded = sections.every((_, i) => expandedSections[i] === true);

  const toggleAll = () => {
    const next = !allExpanded;
    setExpandedSections(Object.fromEntries(sections.map((_, i) => [i, next])));
  };

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAction = (action: string) => {
    if (action === 'pdf') {
      generatePdfReport(sections, personaName, personaRole);
    }
    onAction(action);
  };

  return (
    <div className="lg:col-span-1 bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden flex flex-col">
      <div className="border-l-4 border-l-shell-yellow p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-shell-yellow" />
          <h2 className="text-lg font-display font-bold text-foreground flex-1">AI Insights</h2>
          <button
            onClick={toggleAll}
            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-medium"
            title={allExpanded ? 'Collapse All' : 'Expand All'}
          >
            {allExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: '420px' }}>
          {sections.map((section, si) => {
            const SectionIcon = sectionIconMap[section.icon] || Activity;
            const isExpanded = expandedSections[si] === true;
            return (
              <div key={si} className="border border-border-subtle rounded-md overflow-hidden">
                <button
                  onClick={() => toggleSection(si)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-surface-elevated hover:bg-muted/50 transition-colors text-left"
                >
                  <SectionIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex-1">{section.title}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="px-3 py-2 space-y-2">
                    {section.insights.map((insight, ii) => {
                      const config = insightTypeConfig[insight.type];
                      const Icon = config.icon;
                      return (
                        <div key={ii} className="flex items-start gap-2">
                          <span className={`mt-0.5 shrink-0 ${config.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                            <p className="text-xs text-foreground leading-relaxed mt-0.5">• {insight.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => handleAction('report')} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 font-medium transition-colors">
              <FileText className="w-3 h-3" /> Full Report
            </button>
            <button onClick={() => handleAction('pdf')} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-accent-green/10 text-accent-green hover:bg-accent-green/20 font-medium transition-colors">
              <Download className="w-3 h-3" /> PDF
            </button>
            <button onClick={() => handleAction('email')} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 font-medium transition-colors">
              <Mail className="w-3 h-3" /> Email
            </button>
          </div>
          <Link to="/analytics" className="flex items-center gap-1 text-xs text-accent-blue hover:underline font-medium">
            View Full Analytics <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const persona = useCurrentPersona();
  const allUcs = state.useCases;
  const ucs = scopeUseCases(allUcs, persona.id);
  const metrics = computeMetrics(ucs);
  const allMetrics = computeMetrics(allUcs);
  const cat = getPersonaCategory(persona.id);
  const kpis = getDashboardKpis(persona.id, allUcs);
  const aiSections = generateAiInsights(persona.id, allUcs);

  const stages = ['intake', 'architecture-review', 'pod-assignment', 'development', 'testing', 'deployment', 'live'];

  const bttData = buildToTransfer.snapshots.map(s => ({ name: `M${s.month}`, Wipro: s.wipro, Shell: s.shell }));

  // Cost data derived from centralized metrics
  const costData = [
    { name: 'PoC', value: Math.round(allUcs.reduce((a, u) => a + u.costs.poc, 0) / 1000) },
    { name: 'Deploy', value: Math.round(allUcs.reduce((a, u) => a + u.costs.deployment, 0) / 1000) },
    { name: 'Scale', value: Math.round(allUcs.reduce((a, u) => a + u.costs.scaling, 0) / 1000) },
    { name: 'Run', value: Math.round(allUcs.reduce((a, u) => a + u.costs.annualRunMaintain, 0) / 1000) },
  ];

  const showCharts = cat === 'ide-leadership' || cat === 'ide-delivery';
  const showPods = cat === 'ide-leadership';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} trendLabel={kpi.trendLabel} />
        ))}
      </div>

      {/* Pipeline + AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-surface-card rounded-lg border border-border-subtle p-5 shadow-sm">
          <h2 className="text-lg font-display font-bold text-foreground mb-4">Use Case Pipeline</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stages.map(stage => {
              const stageUcs = ucs.filter(uc => uc.lifecycle.currentStage === stage && uc.status !== 'draft');
              return (
                <div key={stage} className="min-w-[180px] flex-1">
                  <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                    <TooltipProvider delayDuration={0}>
                      <ShadTooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/50">{lifecycleStageLabels[stage] || stage} ({stageUcs.length})</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                          <p>{stageTooltips[stage] || 'Pipeline stage'}</p>
                        </TooltipContent>
                      </ShadTooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-2">
                    {stageUcs.map(uc => {
                      const canAccess = persona.accessModules.includes('use-cases');
                      const cardContent = (
                        <>
                          <div className="text-xs font-mono text-muted-foreground">{uc.id}</div>
                          <div className="text-sm font-medium text-foreground mt-1 line-clamp-2">{uc.title}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge status={uc.riskLevel} />
                            {uc.lifecycle.sprintCompletionPct > 0 && (
                              <div className="flex-1 h-1 bg-border-subtle rounded-full overflow-hidden">
                                <div className="h-full bg-shell-yellow rounded-full" style={{ width: `${uc.lifecycle.sprintCompletionPct}%` }} />
                              </div>
                            )}
                          </div>
                        </>
                      );
                      return canAccess ? (
                        <Link key={uc.id} to={`/use-cases/${uc.id}`} aria-label={`View use case ${uc.id}: ${uc.title}`} className="block p-3 bg-surface-elevated rounded-md border border-border-subtle hover:shadow-md transition-shadow">
                          {cardContent}
                        </Link>
                      ) : (
                        <div key={uc.id} className="block p-3 bg-surface-elevated rounded-md border border-border-subtle opacity-75 cursor-default" aria-label={`Use case ${uc.id}: ${uc.title} (view only)`}>
                          {cardContent}
                        </div>
                      );
                    })}
                    {stageUcs.length === 0 && <div className="text-xs text-muted-foreground italic p-3">No items</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AiSummaryPanel sections={aiSections} personaName={persona.name} personaRole={persona.role} onAction={(action) => {
          const messages: Record<string, { title: string; desc: string }> = {
            report: { title: 'Full Report Requested', desc: 'AI-generated report is being prepared and will be available shortly.' },
            pdf: { title: 'PDF Export Started', desc: 'Your AI insights are being compiled into a downloadable PDF.' },
            email: { title: 'Email Summary Queued', desc: 'AI summary is being prepared for email distribution to stakeholders.' },
          };
          const msg = messages[action] || { title: 'Action Triggered', desc: 'Your request is being processed.' };
          addToast(dispatch, 'success', msg.title, msg.desc);
        }} />
      </div>

      {/* Charts Row — hidden for business personas */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-card rounded-lg border border-border-subtle p-5 shadow-sm">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Build-to-Transfer Trajectory</h2>
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={bttData} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottom', offset: -10, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} label={{ value: 'Capability (%)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ paddingTop: 14 }} />
                <ReferenceLine x={`M${buildToTransfer.currentMonth}`} stroke="#DD1D21" strokeWidth={2} strokeDasharray="4 4" label={{ value: '▼ Today', position: 'top', fill: '#DD1D21', fontSize: 11, fontWeight: 600 }} />
                <Area type="monotone" dataKey="Shell" stroke="#1A7A4A" fill="#1A7A4A" fillOpacity={0.2} />
                <Area type="monotone" dataKey="Wipro" stroke="#DD1D21" fill="#DD1D21" fillOpacity={0.1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-accent-green/10 text-accent-green font-medium">
                ✓ On Track
              </span>
              <span className="text-xs text-muted-foreground">Shell capability index: {buildToTransfer.shellCapabilityScore}/100</span>
            </div>
          </div>

          <div className="bg-surface-card rounded-lg border border-border-subtle p-5 shadow-sm">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Cost by Phase ($K)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} label={{ value: 'Phase', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Cost ($K)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#FBCE07" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-accent-green font-medium mt-2">💰 {allMetrics.reuseSavingsFormatted} saved through component reuse</p>
          </div>
        </div>
      )}

      {/* Pod Performance Table — IDE leadership only */}
      {showPods && (
        <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Pod performance metrics">
              <thead>
                <tr className="bg-surface-elevated border-b border-border-subtle">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Pod Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Use Cases</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Sprint Stage</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Velocity</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Wipro/Shell Split</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {pods.map(pod => (
                  <tr key={pod.id} className="border-b border-border-subtle hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{pod.name}</td>
                    <td className="py-3 px-4 text-foreground">{pod.assignedUseCases.length}</td>
                    <td className="py-3 px-4 text-foreground">{pod.currentSprint.number > 0 ? `Sprint ${pod.currentSprint.number}` : '—'}</td>
                    <td className="py-3 px-4 text-foreground">{pod.sprintVelocity} pts</td>
                    <td className="py-3 px-4 text-foreground">{pod.wipro_pct}% / {pod.shell_pct}%</td>
                    <td className="py-3 px-4">
                      {pod.currentSprint.blockers.length > 0 ? (
                        <TooltipProvider delayDuration={0}>
                          <ShadTooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-shell-red font-medium cursor-help">⚠ Has blockers</span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <p className="font-semibold mb-1">Active Blockers:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {pod.currentSprint.blockers.map((b, i) => (
                                  <li key={i} className="text-xs">{b}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </ShadTooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-accent-green font-medium">Healthy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Blockers Summary Panel — IDE leadership only */}
      {showPods && (() => {
        const allBlockers = pods.flatMap(pod =>
          pod.currentSprint.blockers.map(b => ({
            pod: pod.name,
            podId: pod.id,
            blocker: b,
            sprintNumber: pod.currentSprint.number,
            sprintStart: pod.currentSprint.startDate,
            daysAge: pod.currentSprint.startDate
              ? Math.max(1, Math.floor((Date.now() - new Date(pod.currentSprint.startDate).getTime()) / (1000 * 60 * 60 * 24)))
              : 0,
          }))
        );
        if (allBlockers.length === 0) return null;
        return (
          <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
            <div className="border-l-4 border-l-shell-red p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-shell-red" />
                <h2 className="text-lg font-display font-bold text-foreground">Active Blockers Summary</h2>
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-shell-red/10 text-shell-red font-medium">{allBlockers.length} blocker{allBlockers.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {allBlockers.map((item, i) => {
                  const severity = item.daysAge > 10 ? 'critical' : item.daysAge > 5 ? 'high' : 'medium';
                  const severityColor = severity === 'critical' ? 'text-shell-red' : severity === 'high' ? 'text-accent-amber' : 'text-muted-foreground';
                  const severityBg = severity === 'critical' ? 'bg-shell-red/10' : severity === 'high' ? 'bg-accent-amber/10' : 'bg-muted';
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 bg-surface-elevated rounded-md border border-border-subtle">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.blocker}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.pod} · Sprint {item.sprintNumber}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severityBg} ${severityColor}`}>{severity}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{item.daysAge}d</span>
                        </div>
                        <button
                          onClick={() => { addToast(dispatch, 'success', `Blocker resolved: "${item.blocker.slice(0, 30)}…"`); }}
                          className="text-[11px] px-2.5 py-1 rounded bg-accent-green/15 text-accent-green hover:bg-accent-green/25 font-medium transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => { addToast(dispatch, 'warning', `Escalated: "${item.blocker.slice(0, 30)}…" to leadership`); }}
                          className="text-[11px] px-2.5 py-1 rounded bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25 font-medium transition-colors"
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
