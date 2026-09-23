/**
 * Single Source of Truth for all computed metrics, KPIs, and labels.
 * Every page must derive display values from these functions — never hardcode.
 */

import { UseCase, MonitoringAlert, PersonaId } from './types';
import { costAggregates, buildToTransfer, pods, deployedEndpoints } from './mockData';
import { personas } from './personas';

// ─── Lifecycle Status Labels (Enterprise-grade, unambiguous) ───

export const lifecycleStageLabels: Record<string, string> = {
  intake: 'New Submission',
  'architecture-review': 'Architecture Review',
  'pod-assignment': 'Pod Assignment',
  development: 'In Development',
  testing: 'Testing',
  deployment: 'Deploying',
  live: 'In Production',
};

export const useCaseStatusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  'under-review': 'Under Review',
  approved: 'Ready for Development',
  'in-development': 'In Development',
  deployed: 'In Production',
  rejected: 'Rejected',
};

// ─── Deployment Environment Labels ───

export const deploymentEnvLabels: Record<string, string> = {
  Development: 'Development',
  Staging: 'Staging',
  Production: 'Production',
};

export const deploymentStatusLabels: Record<string, string> = {
  ready: 'Ready for Deployment',
  deploying: 'Deploying',
  deployed: 'Active',
  'rollback-required': 'Rollback Required',
};

// ─── Persona Category Helpers ───

export type PersonaCategory = 'business' | 'idt' | 'ide-leadership' | 'ide-delivery' | 'idso';

export function getPersonaCategory(personaId: PersonaId): PersonaCategory {
  switch (personaId) {
    case 'business-sponsor':
    case 'business-sme':
      return 'business';
    case 'idt-gm':
    case 'idt-advisor':
      return 'idt';
    case 'ide-gm':
    case 'ide-pm':
      return 'ide-leadership';
    case 'pod-member':
    case 'wipro-delivery':
      return 'ide-delivery';
    case 'idso-gm':
    case 'idso-pm':
      return 'idso';
    default:
      return 'ide-delivery';
  }
}

// ─── Centralized KPI Computation ───

export function computeMetrics(useCases: UseCase[]) {
  const total = useCases.length;
  const nonDraft = useCases.filter(u => u.status !== 'draft');
  const activePipeline = nonDraft.length; // submitted use cases (excludes drafts)
  const inDev = useCases.filter(u => u.status === 'in-development').length;
  const deployed = useCases.filter(u => u.status === 'deployed').length;
  const submitted = useCases.filter(u => u.status === 'submitted' || u.status === 'under-review').length;
  const approved = useCases.filter(u => u.status === 'approved').length;
  const draft = useCases.filter(u => u.status === 'draft').length;

  const avgReuseRatio = nonDraft.length > 0
    ? nonDraft.reduce((a, u) => a + u.components.reuseRatio, 0) / nonDraft.length
    : 0;

  const totalInvested =
    nonDraft.reduce((a, u) => a + u.costs.poc + u.costs.deployment + u.costs.scaling, 0);

  const reuseSavings = nonDraft.reduce((a, u) => a + u.components.reusable * 4000, 0);

  return {
    total,
    activePipeline,
    inDev,
    deployed,
    submitted,
    approved,
    draft,
    avgReuseRatio,
    avgReuseRatioPct: Math.round(avgReuseRatio * 100),
    totalInvested,
    totalInvestedFormatted: `$${(totalInvested / 1_000_000).toFixed(2)}M`,
    reuseSavings,
    reuseSavingsFormatted: `$${(reuseSavings / 1_000_000).toFixed(2)}M`,
    pipeline: total - deployed - draft, // active pipeline (not draft, not deployed)
  };
}

// ─── Persona-scoped use cases ───

export function scopeUseCases(useCases: UseCase[], personaId: PersonaId): UseCase[] {
  const cat = getPersonaCategory(personaId);
  const persona = personas.find(p => p.id === personaId);
  if (!persona) return useCases;

  if (cat === 'business') {
    return useCases.filter(uc => uc.submittedBy.personaId === personaId || uc.submittedBy.name === persona.name);
  }
  // All other personas see all use cases
  return useCases;
}

// ─── Notification/Alert Relevance Filtering ───

export type AlertCategory = 'operational' | 'governance' | 'delivery' | 'business';

export function categorizeAlert(alert: MonitoringAlert): AlertCategory {
  const t = alert.type.toLowerCase();
  if (t.includes('sla') || t.includes('response time') || t.includes('uptime') || t.includes('drift')) return 'operational';
  if (t.includes('compliance') || t.includes('policy') || t.includes('audit')) return 'governance';
  if (t.includes('data source') || t.includes('delay')) return 'delivery';
  return 'operational';
}

export function isAlertRelevantForPersona(alert: MonitoringAlert, personaId: PersonaId): boolean {
  const cat = getPersonaCategory(personaId);
  const alertCat = categorizeAlert(alert);

  switch (cat) {
    case 'business':
      // Business personas should NOT see operational/technical alerts
      return false;
    case 'idt':
      return alertCat === 'governance' || alertCat === 'delivery';
    case 'ide-leadership':
      return true; // IDE leadership sees everything
    case 'ide-delivery':
      return alertCat === 'delivery' || alertCat === 'operational';
    case 'idso':
      return alertCat === 'operational' || alertCat === 'delivery';
    default:
      return true;
  }
}

// ─── Persona-aware AI Summary ───

export function getAiSummaryBullets(
  personaId: PersonaId,
  useCases: UseCase[],
): { text: string; color: string }[] {
  const metrics = computeMetrics(useCases);
  const scoped = scopeUseCases(useCases, personaId);
  const scopedMetrics = computeMetrics(scoped);
  const cat = getPersonaCategory(personaId);
  const btt = buildToTransfer;

  switch (cat) {
    case 'business':
      return [
        { text: `${scopedMetrics.total} use case${scopedMetrics.total !== 1 ? 's' : ''} in portfolio`, color: 'text-shell-yellow' },
        { text: scopedMetrics.inDev > 0 ? `${scopedMetrics.inDev} in active development` : 'No use cases in active development', color: 'text-shell-yellow' },
        { text: `${scopedMetrics.deployed} deployed to production`, color: 'text-accent-green' },
        { text: `Budget utilization at 90% — on track`, color: 'text-accent-green' },
      ];
    case 'idt':
      return [
        { text: `Pipeline contains ${metrics.total} use cases`, color: 'text-shell-yellow' },
        { text: `${metrics.submitted} awaiting IDT review`, color: 'text-accent-amber' },
        { text: `${metrics.approved} qualified and ready for development`, color: 'text-accent-green' },
        { text: `Avg handoff speed improved to 12 days`, color: 'text-accent-green' },
      ];
    case 'idso':
      return [
        { text: `${metrics.deployed} solution${metrics.deployed !== 1 ? 's' : ''} in production`, color: 'text-shell-yellow' },
        { text: `2 approaching deployment within 60 days`, color: 'text-accent-amber' },
        { text: `SLA compliance at 99.2% — above target`, color: 'text-accent-green' },
        { text: `Avg annual run cost per solution: $18K`, color: 'text-shell-yellow' },
      ];
    default: // IDE leadership / delivery
      return [
        { text: `Factory healthy — ${metrics.inDev} active deliveries across ${pods.length} pods`, color: 'text-accent-green' },
        { text: `Sprint velocity averaging 34 pts`, color: 'text-shell-yellow' },
        { text: `Reuse ratio at ${metrics.avgReuseRatioPct}% — saving ${metrics.reuseSavingsFormatted}`, color: 'text-accent-green' },
        { text: `Build-to-Transfer M${btt.currentMonth}: ${btt.snapshots[btt.currentMonth - 1]?.wipro}/${btt.snapshots[btt.currentMonth - 1]?.shell} — on track`, color: 'text-shell-yellow' },
      ];
  }
}

// ─── Persona-aware Dashboard KPIs ───

export interface KpiDef {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
}

export function getDashboardKpis(personaId: PersonaId, useCases: UseCase[]): KpiDef[] {
  const metrics = computeMetrics(useCases);
  const scoped = scopeUseCases(useCases, personaId);
  const scopedMetrics = computeMetrics(scoped);
  const cat = getPersonaCategory(personaId);
  const btt = buildToTransfer;

  switch (cat) {
    case 'business':
      return [
        { label: 'My Use Cases', value: `${scopedMetrics.total}` },
        { label: 'In Development', value: `${scopedMetrics.inDev}` },
        { label: 'In Production', value: `${scopedMetrics.deployed}` },
        { label: 'Budget Utilization', value: '90%', trend: 'stable', trendLabel: 'On track' },
      ];
    case 'idt':
      return [
        { label: 'Pipeline Size', value: `${metrics.total}`, trend: 'up', trendLabel: 'Growing' },
        { label: 'Awaiting Review', value: `${metrics.submitted}` },
        { label: 'Qualified', value: `${metrics.approved}`, trend: 'up', trendLabel: '+3 this month' },
        { label: 'Avg Handoff Speed', value: '12 days', trend: 'down', trendLabel: '-2 days improvement' },
      ];
    case 'idso':
      return [
        { label: 'In Production', value: `${metrics.deployed}` },
        { label: 'Approaching Deployment', value: '2', trendLabel: 'Within 60 days' },
        { label: 'Avg Run Cost', value: '$18K/yr' },
        { label: 'SLA Compliance', value: '99.2%', trend: 'up', trendLabel: 'Above target' },
      ];
    case 'ide-leadership':
      return [
        { label: 'Active Use Cases', value: `${metrics.inDev} of ${metrics.total}`, trend: 'up', trendLabel: '+3 this month' },
        { label: 'Avg Reuse Ratio', value: `${metrics.avgReuseRatioPct}%`, trend: 'up', trendLabel: '+4% vs last quarter' },
        { label: 'Factory Velocity', value: '34 pts/sprint', trend: 'stable', trendLabel: 'Stable' },
        { label: 'Wipro/Shell Ratio', value: `${btt.snapshots[btt.currentMonth - 1]?.wipro}/${btt.snapshots[btt.currentMonth - 1]?.shell}`, trend: 'up', trendLabel: 'On track' },
      ];
    default: // ide-delivery
      return [
        { label: 'Active Use Cases', value: `${metrics.inDev}` },
        { label: 'Total Pipeline', value: `${metrics.total}` },
        { label: 'Reuse Ratio', value: `${metrics.avgReuseRatioPct}%` },
        { label: 'In Production', value: `${metrics.deployed}` },
      ];
  }
}

// ─── Data Management alerts: separate by domain ───

export const dataManagementAlerts = [
  { msg: 'Well Telemetry Stream — 2.3% null rate spike in pressure_psi field — above 1% threshold', sev: 'text-shell-red', domain: 'data-quality' },
  { msg: 'Seismic Files — schema drift detected — 2 new fields found', sev: 'text-accent-amber', domain: 'data-quality' },
];

// The vendor invoice SLA alert belongs in Monitoring, not Data Management
export const monitoringOnlyAlerts = [
  { msg: 'Vendor Invoice System — 6-hour data delay — SLA breach imminent', sev: 'text-accent-amber', domain: 'operational' },
];
