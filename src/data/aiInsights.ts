/**
 * AI Insight Engine — generates contextual, persona-aware insights.
 * Combines data from use cases, pods, deployments, monitoring, and governance
 * to produce non-obvious, actionable intelligence for each persona.
 */

import { UseCase, MonitoringAlert, PersonaId } from './types';
import { pods, buildToTransfer, deployedEndpoints, monitoringAlerts, experiments } from './mockData';
import { computeMetrics, scopeUseCases, getPersonaCategory, type PersonaCategory } from './metrics';

// ─── Insight Types ───

export interface AiInsight {
  text: string;
  type: 'insight' | 'risk' | 'prediction' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
}

export interface AiInsightSection {
  title: string;
  icon: 'health' | 'pipeline' | 'handover' | 'monitoring' | 'prediction';
  insights: AiInsight[];
}

// ─── Helper Utilities ───

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Core Insight Generator ───

export function generateAiInsights(
  personaId: PersonaId,
  allUseCases: UseCase[],
): AiInsightSection[] {
  const cat = getPersonaCategory(personaId);
  const scoped = scopeUseCases(allUseCases, personaId);
  const metrics = computeMetrics(allUseCases);
  const scopedMetrics = computeMetrics(scoped);

  // Derived data points
  const inDevUcs = allUseCases.filter(u => u.status === 'in-development');
  const deployedUcs = allUseCases.filter(u => u.status === 'deployed');
  const pendingReview = allUseCases.filter(u => u.status === 'submitted' || u.status === 'under-review');
  const approvedWaiting = allUseCases.filter(u => u.status === 'approved');
  const highRiskUcs = allUseCases.filter(u => u.riskLevel === 'high' || u.riskLevel === 'critical');
  const highRiskInDev = inDevUcs.filter(u => u.riskLevel === 'high' || u.riskLevel === 'critical');

  const activeAlerts = monitoringAlerts.filter(a => !a.acknowledged);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const prodEndpoints = deployedEndpoints.filter(e => e.environment === 'Production' && e.status === 'deployed');
  const slowEndpoints = deployedEndpoints.filter(e => e.avgResponseTime > 200 && e.status === 'deployed');
  const lowUptimeEndpoints = prodEndpoints.filter(e => e.uptime < 99.5);

  const podsWithBlockers = pods.filter(p => p.currentSprint.blockers.length > 0);
  const totalBlockers = pods.reduce((a, p) => a + p.currentSprint.blockers.length, 0);
  const avgVelocity = pods.filter(p => p.sprintVelocity > 0).reduce((a, p) => a + p.sprintVelocity, 0) /
    Math.max(1, pods.filter(p => p.sprintVelocity > 0).length);

  const nearGoLiveUcs = inDevUcs.filter(u => {
    const d = daysUntil(u.lifecycle.estimatedGoLive);
    return d > 0 && d <= 90;
  });
  const pendingDeploymentApproval = inDevUcs.filter(u =>
    u.approvals.some(a => a.type === 'deploymentApproval' && a.status === 'pending')
  );

  const failedExperiments = experiments.filter(e => e.status === 'failed');
  const runningExperiments = experiments.filter(e => e.status === 'running');

  const btt = buildToTransfer;
  const currentSnap = btt.snapshots[btt.currentMonth - 1];

  // Low reuse ratio use cases
  const lowReuseUcs = allUseCases.filter(u => u.components.reuseRatio < 0.5 && u.status !== 'draft' && u.status !== 'rejected');

  switch (cat) {
    case 'business':
      return generateBusinessInsights(scoped, scopedMetrics, personaId, allUseCases);
    case 'idt':
      return generateIdtInsights(allUseCases, metrics, pendingReview, approvedWaiting, highRiskUcs, lowReuseUcs);
    case 'ide-leadership':
      return generateIdeLeadershipInsights(allUseCases, metrics, inDevUcs, podsWithBlockers, totalBlockers, avgVelocity, nearGoLiveUcs, pendingDeploymentApproval, btt, currentSnap, highRiskInDev, failedExperiments, runningExperiments, lowReuseUcs, activeAlerts, criticalAlerts);
    case 'ide-delivery':
      return generateIdeDeliveryInsights(allUseCases, metrics, inDevUcs, podsWithBlockers, totalBlockers, nearGoLiveUcs, runningExperiments, failedExperiments);
    case 'idso':
      return generateIdsoInsights(allUseCases, metrics, deployedUcs, prodEndpoints, activeAlerts, criticalAlerts, slowEndpoints, lowUptimeEndpoints, nearGoLiveUcs);
    default:
      return generateIdeDeliveryInsights(allUseCases, metrics, inDevUcs, podsWithBlockers, totalBlockers, nearGoLiveUcs, runningExperiments, failedExperiments);
  }
}

// ─── Business Persona Insights ───

function generateBusinessInsights(
  scoped: UseCase[], scopedMetrics: ReturnType<typeof computeMetrics>,
  personaId: PersonaId, allUseCases: UseCase[],
): AiInsightSection[] {
  const myInDev = scoped.filter(u => u.status === 'in-development');
  const myDeployed = scoped.filter(u => u.status === 'deployed');
  const myPending = scoped.filter(u => u.status === 'submitted' || u.status === 'under-review');

  const sections: AiInsightSection[] = [];

  // Health
  const healthInsights: AiInsight[] = [];
  if (myInDev.length > 0) {
    const avgCompletion = Math.round(myInDev.reduce((a, u) => a + u.lifecycle.sprintCompletionPct, 0) / myInDev.length);
    healthInsights.push({
      text: `Your active use cases are averaging ${avgCompletion}% sprint completion — ${avgCompletion >= 50 ? 'progressing well toward milestones' : 'early stages, expect acceleration in upcoming sprints'}.`,
      type: 'insight', priority: 'medium',
    });
  }
  const highRiskMine = scoped.filter(u => u.riskLevel === 'high' && u.status !== 'draft' && u.status !== 'deployed');
  if (highRiskMine.length > 0) {
    healthInsights.push({
      text: `"${highRiskMine[0].title}" is flagged high-risk — this could impact your expected go-live timeline. Consider requesting an IDT status update.`,
      type: 'risk', priority: 'high',
    });
  }
  if (myDeployed.length > 0) {
    const totalAnnualSavings = myDeployed.reduce((a, u) => a + u.components.reusable * 4000, 0);
    healthInsights.push({
      text: `Your deployed solutions are generating ~$${(totalAnnualSavings / 1000).toFixed(0)}K in component reuse savings — demonstrating strong ROI for continued investment.`,
      type: 'insight', priority: 'low',
    });
  }
  sections.push({ title: 'Portfolio Health', icon: 'health', insights: healthInsights });

  // Pipeline
  const pipelineInsights: AiInsight[] = [];
  if (myPending.length > 0) {
    pipelineInsights.push({
      text: `${myPending.length} of your submissions ${myPending.length === 1 ? 'is' : 'are'} awaiting IDT qualification. Based on current review velocity, expect a decision within 10–14 business days.`,
      type: 'prediction', priority: 'medium',
    });
  }
  const myDraftCount = scoped.filter(u => u.status === 'draft').length;
  if (myDraftCount > 0) {
    pipelineInsights.push({
      text: `You have ${myDraftCount} draft use case${myDraftCount !== 1 ? 's' : ''} that haven't been submitted yet. Completing the required fields will accelerate intake.`,
      type: 'recommendation', priority: 'low',
    });
  }
  if (pipelineInsights.length > 0) sections.push({ title: 'Intake & Pipeline', icon: 'pipeline', insights: pipelineInsights });

  // Predictions
  const predInsights: AiInsight[] = [];
  const nearGoLive = myInDev.filter(u => daysUntil(u.lifecycle.estimatedGoLive) <= 90 && daysUntil(u.lifecycle.estimatedGoLive) > 0);
  if (nearGoLive.length > 0) {
    const soonest = nearGoLive.sort((a, b) => daysUntil(a.lifecycle.estimatedGoLive) - daysUntil(b.lifecycle.estimatedGoLive))[0];
    predInsights.push({
      text: `"${soonest.title}" is on track for go-live in ~${daysUntil(soonest.lifecycle.estimatedGoLive)} days. You may want to prepare business stakeholders for UAT and change management.`,
      type: 'prediction', priority: 'high',
    });
  }
  if (predInsights.length > 0) sections.push({ title: 'Upcoming Milestones', icon: 'prediction', insights: predInsights });

  return sections;
}

// ─── IDT Persona Insights ───

function generateIdtInsights(
  allUseCases: UseCase[], metrics: ReturnType<typeof computeMetrics>,
  pendingReview: UseCase[], approvedWaiting: UseCase[],
  highRiskUcs: UseCase[], lowReuseUcs: UseCase[],
): AiInsightSection[] {
  const sections: AiInsightSection[] = [];

  // Health
  const healthInsights: AiInsight[] = [];
  if (pendingReview.length > 2) {
    healthInsights.push({
      text: `Review queue is building — ${pendingReview.length} use cases pending qualification. Prolonged backlogs risk bottlenecking the factory intake.`,
      type: 'risk', priority: 'high',
    });
  } else if (pendingReview.length > 0) {
    healthInsights.push({
      text: `${pendingReview.length} use case${pendingReview.length !== 1 ? 's' : ''} in the review queue — within manageable capacity for timely qualification.`,
      type: 'insight', priority: 'low',
    });
  }
  const highRiskPending = pendingReview.filter(u => u.riskLevel === 'high' || u.riskLevel === 'critical');
  if (highRiskPending.length > 0) {
    healthInsights.push({
      text: `"${highRiskPending[0].title}" is high-risk with ${highRiskPending[0].components.netNew} net-new components — architecture complexity may extend delivery timelines by 30–40%.`,
      type: 'risk', priority: 'high',
    });
  }
  sections.push({ title: 'Demand Pipeline Health', icon: 'health', insights: healthInsights });

  // Pipeline
  const pipelineInsights: AiInsight[] = [];
  if (approvedWaiting.length > 0) {
    pipelineInsights.push({
      text: `${approvedWaiting.length} qualified use case${approvedWaiting.length !== 1 ? 's' : ''} awaiting pod assignment. The factory has capacity gaps that may delay onboarding — consider escalating priority alignment with IDE.`,
      type: 'recommendation', priority: 'medium',
    });
  }
  if (lowReuseUcs.length > 0) {
    const worstReuse = lowReuseUcs.sort((a, b) => a.components.reuseRatio - b.components.reuseRatio)[0];
    pipelineInsights.push({
      text: `"${worstReuse.title}" has only ${Math.round(worstReuse.components.reuseRatio * 100)}% component reuse — ${worstReuse.components.netNew} net-new builds will drive higher delivery cost. Consider whether existing components can be adapted.`,
      type: 'insight', priority: 'medium',
    });
  }
  sections.push({ title: 'Qualification & Prioritization', icon: 'pipeline', insights: pipelineInsights });

  // Predictions
  const predInsights: AiInsight[] = [];
  const submittedRecently = allUseCases.filter(u => u.status === 'submitted' && daysSince(u.submittedAt) < 30);
  if (submittedRecently.length >= 2) {
    predInsights.push({
      text: `Intake velocity has increased — ${submittedRecently.length} new submissions in the last 30 days. At this rate, the review backlog could double within 6 weeks without additional IDT capacity.`,
      type: 'prediction', priority: 'medium',
    });
  }
  predInsights.push({
    text: `Cross-vertical demand is concentrated in IGUPT (${allUseCases.filter(u => u.businessVertical === 'IGUPT').length} use cases). Diversifying intake from other verticals would reduce portfolio concentration risk.`,
    type: 'recommendation', priority: 'low',
  });
  sections.push({ title: 'Trends & Predictions', icon: 'prediction', insights: predInsights });

  return sections;
}

// ─── IDE Leadership Insights ───

function generateIdeLeadershipInsights(
  allUseCases: UseCase[], metrics: ReturnType<typeof computeMetrics>,
  inDevUcs: UseCase[], podsWithBlockers: typeof pods,
  totalBlockers: number, avgVelocity: number,
  nearGoLiveUcs: UseCase[], pendingDeploymentApproval: UseCase[],
  btt: typeof buildToTransfer, currentSnap: typeof btt.snapshots[0],
  highRiskInDev: UseCase[], failedExperiments: typeof experiments,
  runningExperiments: typeof experiments, lowReuseUcs: UseCase[],
  activeAlerts: MonitoringAlert[], criticalAlerts: MonitoringAlert[],
): AiInsightSection[] {
  const sections: AiInsightSection[] = [];

  // Health
  const healthInsights: AiInsight[] = [];
  if (totalBlockers > 0) {
    const blockerPods = podsWithBlockers.map(p => p.name).join(', ');
    healthInsights.push({
      text: `${totalBlockers} active blocker${totalBlockers !== 1 ? 's' : ''} across ${podsWithBlockers.length} pod${podsWithBlockers.length !== 1 ? 's' : ''} (${blockerPods}) — unresolved blockers correlate with 20–35% velocity loss in subsequent sprints.`,
      type: 'risk', priority: 'high',
    });
  }
  if (highRiskInDev.length > 0) {
    healthInsights.push({
      text: `${highRiskInDev.length} high-risk use case${highRiskInDev.length !== 1 ? 's are' : ' is'} in active development. "${highRiskInDev[0].title}" at sprint ${highRiskInDev[0].lifecycle.sprintCurrent}/${highRiskInDev[0].lifecycle.sprintTotal} — monitor closely for scope creep.`,
      type: 'risk', priority: 'high',
    });
  }
  if (currentSnap) {
    const shellGrowth = currentSnap.shell - (btt.snapshots[Math.max(0, btt.currentMonth - 2)]?.shell ?? 0);
    healthInsights.push({
      text: `Build-to-Transfer is ${btt.onTrack ? 'on track' : 'at risk'} — Shell capability grew ${shellGrowth}pts this month to ${currentSnap.shell}%. ${btt.onTrack ? 'Knowledge transfer cadence supports M12 target.' : 'Acceleration needed to meet M12 80% target.'}`,
      type: btt.onTrack ? 'insight' : 'risk', priority: btt.onTrack ? 'medium' : 'high',
    });
  }
  sections.push({ title: 'Factory Health', icon: 'health', insights: healthInsights });

  // Pipeline
  const pipelineInsights: AiInsight[] = [];
  const idlePods = pods.filter(p => p.assignedUseCases.length === 0);
  const approvedWaiting = allUseCases.filter(u => u.status === 'approved').length;
  if (idlePods.length > 0 && approvedWaiting > 0) {
    pipelineInsights.push({
      text: `${idlePods.length} pod${idlePods.length !== 1 ? 's have' : ' has'} no active assignments while ${approvedWaiting} qualified use case${approvedWaiting !== 1 ? 's' : ''} await pod assignment — this represents idle capacity that could accelerate throughput.`,
      type: 'recommendation', priority: 'high',
    });
  }
  if (lowReuseUcs.length > 2) {
    pipelineInsights.push({
      text: `${lowReuseUcs.length} use cases have reuse ratios below 50%. Investing in 2–3 more reusable components could lift the factory-wide average above 65% and reduce per-UC delivery cost by ~$12K.`,
      type: 'recommendation', priority: 'medium',
    });
  }
  if (pipelineInsights.length > 0) sections.push({ title: 'Capacity & Efficiency', icon: 'pipeline', insights: pipelineInsights });

  // Handover
  const handoverInsights: AiInsight[] = [];
  if (nearGoLiveUcs.length > 0) {
    nearGoLiveUcs.forEach(uc => {
      const days = daysUntil(uc.lifecycle.estimatedGoLive);
      const hasPendingApproval = uc.approvals.some(a => a.type === 'deploymentApproval' && a.status === 'pending');
      handoverInsights.push({
        text: `"${uc.title}" targets go-live in ${days} days${hasPendingApproval ? ' but deployment approval is still pending — this could become a bottleneck if not addressed in the next 2 weeks' : ' with all approvals on track'}.`,
        type: hasPendingApproval ? 'risk' : 'insight',
        priority: hasPendingApproval ? 'high' : 'medium',
      });
    });
  }
  if (handoverInsights.length > 0) sections.push({ title: 'Deployment Readiness', icon: 'handover', insights: handoverInsights });

  // Predictions
  const predInsights: AiInsight[] = [];
  if (failedExperiments.length > 0) {
    predInsights.push({
      text: `${failedExperiments.length} experiment${failedExperiments.length !== 1 ? 's have' : ' has'} failed recently — "${failedExperiments[0].useCaseTitle}" may need a revised modeling approach before it can progress to deployment.`,
      type: 'prediction', priority: 'medium',
    });
  }
  if (criticalAlerts.length > 0) {
    predInsights.push({
      text: `${criticalAlerts.length} critical alert${criticalAlerts.length !== 1 ? 's' : ''} in production — if unresolved within 48 hours, this could trigger SLA penalty clauses and erode stakeholder confidence.`,
      type: 'prediction', priority: 'high',
    });
  }
  predInsights.push({
    text: `At current velocity (~${Math.round(avgVelocity)} pts/sprint), the factory can absorb ${Math.max(1, Math.floor(avgVelocity / 15))} additional use case${Math.floor(avgVelocity / 15) > 1 ? 's' : ''} per quarter without overloading pods.`,
    type: 'prediction', priority: 'low',
  });
  sections.push({ title: 'Forecasts & Recommendations', icon: 'prediction', insights: predInsights });

  return sections;
}

// ─── IDE Delivery Insights ───

function generateIdeDeliveryInsights(
  allUseCases: UseCase[], metrics: ReturnType<typeof computeMetrics>,
  inDevUcs: UseCase[], podsWithBlockers: typeof pods,
  totalBlockers: number, nearGoLiveUcs: UseCase[],
  runningExperiments: typeof experiments, failedExperiments: typeof experiments,
): AiInsightSection[] {
  const sections: AiInsightSection[] = [];

  // Health
  const healthInsights: AiInsight[] = [];
  if (totalBlockers > 0) {
    podsWithBlockers.forEach(pod => {
      pod.currentSprint.blockers.forEach(b => {
        const age = daysSince(pod.currentSprint.startDate);
        healthInsights.push({
          text: `${pod.name}: "${b}" — unresolved for ${age}+ days. ${age > 7 ? 'Consider escalating to leadership; prolonged blockers compound sprint-over-sprint.' : 'Track daily to prevent velocity impact.'}`,
          type: 'risk', priority: age > 7 ? 'high' : 'medium',
        });
      });
    });
  } else {
    healthInsights.push({
      text: 'All pods are operating without active blockers — a strong signal for on-time delivery this sprint.',
      type: 'insight', priority: 'low',
    });
  }
  sections.push({ title: 'Sprint Health', icon: 'health', insights: healthInsights });

  // Experiments
  if (runningExperiments.length > 0 || failedExperiments.length > 0) {
    const expInsights: AiInsight[] = [];
    runningExperiments.forEach(exp => {
      if (exp.progressPct < 50) {
        expInsights.push({
          text: `"${exp.useCaseTitle}" model training is at ${exp.progressPct}% — on current trajectory, completion expected in ~${Math.ceil((100 - exp.progressPct) / 10)} days. Monitor for convergence issues.`,
          type: 'insight', priority: 'medium',
        });
      }
    });
    failedExperiments.forEach(exp => {
      expInsights.push({
        text: `"${exp.useCaseTitle}" experiment failed at ${exp.progressPct}% — review hyperparameters and training data quality before rerunning to avoid repeating the same failure mode.`,
        type: 'recommendation', priority: 'high',
      });
    });
    if (expInsights.length > 0) sections.push({ title: 'Model Lab Activity', icon: 'monitoring', insights: expInsights });
  }

  // Handover
  if (nearGoLiveUcs.length > 0) {
    const handoverInsights: AiInsight[] = [];
    nearGoLiveUcs.forEach(uc => {
      handoverInsights.push({
        text: `"${uc.title}" targets go-live in ${daysUntil(uc.lifecycle.estimatedGoLive)} days (sprint ${uc.lifecycle.sprintCurrent}/${uc.lifecycle.sprintTotal}). Ensure testing and IDSO handover documentation are in progress.`,
        type: 'recommendation', priority: 'medium',
      });
    });
    sections.push({ title: 'Upcoming Handovers', icon: 'handover', insights: handoverInsights });
  }

  return sections;
}

// ─── IDSO Insights ───

function generateIdsoInsights(
  allUseCases: UseCase[], metrics: ReturnType<typeof computeMetrics>,
  deployedUcs: UseCase[], prodEndpoints: typeof deployedEndpoints,
  activeAlerts: MonitoringAlert[], criticalAlerts: MonitoringAlert[],
  slowEndpoints: typeof deployedEndpoints, lowUptimeEndpoints: typeof deployedEndpoints,
  nearGoLiveUcs: UseCase[],
): AiInsightSection[] {
  const sections: AiInsightSection[] = [];

  // Monitoring
  const monInsights: AiInsight[] = [];
  if (criticalAlerts.length > 0) {
    criticalAlerts.forEach(alert => {
      monInsights.push({
        text: `${alert.useCaseTitle}: ${alert.message} Suggested: ${alert.suggestedAction || 'Investigate immediately.'}`,
        type: 'risk', priority: 'high',
      });
    });
  }
  if (slowEndpoints.length > 0) {
    monInsights.push({
      text: `${slowEndpoints.length} endpoint${slowEndpoints.length !== 1 ? 's' : ''} showing elevated latency (>200ms avg). Sustained high latency degrades user adoption and risks SLA penalties.`,
      type: 'risk', priority: 'medium',
    });
  }
  if (monInsights.length === 0) {
    monInsights.push({
      text: 'All production endpoints are operating within SLA thresholds — no immediate intervention required.',
      type: 'insight', priority: 'low',
    });
  }
  sections.push({ title: 'Production Stability', icon: 'monitoring', insights: monInsights });

  // Health
  const healthInsights: AiInsight[] = [];
  if (prodEndpoints.length > 0) {
    const avgUptime = prodEndpoints.reduce((a, e) => a + e.uptime, 0) / prodEndpoints.length;
    healthInsights.push({
      text: `Fleet uptime averaging ${avgUptime.toFixed(1)}% across ${prodEndpoints.length} production endpoint${prodEndpoints.length !== 1 ? 's' : ''}. ${avgUptime >= 99.5 ? 'Exceeding the 99.5% target — strong operational posture.' : 'Below the 99.5% target — investigate root causes for degraded availability.'}`,
      type: avgUptime >= 99.5 ? 'insight' : 'risk',
      priority: avgUptime >= 99.5 ? 'medium' : 'high',
    });
  }
  const totalRunCost = deployedUcs.reduce((a, u) => a + u.costs.annualRunMaintain, 0);
  if (deployedUcs.length > 0) {
    healthInsights.push({
      text: `Annual run cost for ${deployedUcs.length} deployed solution${deployedUcs.length !== 1 ? 's' : ''}: $${(totalRunCost / 1000).toFixed(0)}K ($${(totalRunCost / deployedUcs.length / 1000).toFixed(0)}K avg per solution). Track against budget to ensure sustainability.`,
      type: 'insight', priority: 'low',
    });
  }
  sections.push({ title: 'Operational KPIs', icon: 'health', insights: healthInsights });

  // Incoming
  const incomingInsights: AiInsight[] = [];
  if (nearGoLiveUcs.length > 0) {
    incomingInsights.push({
      text: `${nearGoLiveUcs.length} use case${nearGoLiveUcs.length !== 1 ? 's' : ''} approaching deployment within 90 days. Ensure ops-readiness checklists, monitoring hooks, and runbooks are prepared.`,
      type: 'recommendation', priority: 'high',
    });
    nearGoLiveUcs.forEach(uc => {
      incomingInsights.push({
        text: `"${uc.title}" (go-live ~${daysUntil(uc.lifecycle.estimatedGoLive)}d) will add ~$${(uc.costs.annualRunMaintain / 1000).toFixed(0)}K to annual run costs. Factor into capacity and budget planning.`,
        type: 'prediction', priority: 'medium',
      });
    });
  }
  if (incomingInsights.length > 0) sections.push({ title: 'Incoming Deployments', icon: 'handover', insights: incomingInsights });

  // Predictions
  const predInsights: AiInsight[] = [];
  if (activeAlerts.length > 1) {
    predInsights.push({
      text: `Alert frequency has increased to ${activeAlerts.length} unresolved items. If this trend continues, expect operational overhead to grow by ~15% this quarter — consider proactive infrastructure scaling.`,
      type: 'prediction', priority: 'medium',
    });
  }
  predInsights.push({
    text: `Based on pipeline progression, expect ${Math.min(3, nearGoLiveUcs.length + 1)} new solutions entering production in the next quarter — plan for incremental monitoring and support staffing.`,
    type: 'prediction', priority: 'low',
  });
  sections.push({ title: 'Operational Forecasts', icon: 'prediction', insights: predInsights });

  return sections;
}
