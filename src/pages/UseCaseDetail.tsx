import React, { useState } from 'react';
import { formatLabel } from '@/lib/utils';
import { useParams, Link } from 'react-router-dom';
import { useApp, useCurrentPersona, addToast } from '@/context/AppContext';
import { pods, components as allComponents, experiments, deployedEndpoints, dataSources } from '@/data/mockData';
import { lifecycleStageLabels, useCaseStatusLabels, deploymentStatusLabels } from '@/data/metrics';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle, FlaskConical, Rocket, Database } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import StatusBadge from '@/components/StatusBadge';

const stageOrder = ['intake', 'architecture-review', 'pod-assignment', 'development', 'testing', 'deployment', 'live'];

export default function UseCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const persona = useCurrentPersona();
  const [activeTab, setActiveTab] = useState(0);
  const [approvalComment, setApprovalComment] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState<{ step: number; action: 'approve' | 'reject' } | null>(null);

  const uc = state.useCases.find(u => u.id === id);
  if (!uc) return <div className="text-center py-20 text-muted-foreground">Use case not found</div>;

  const pod = uc.podId ? pods.find(p => p.id === uc.podId) : null;
  const ucComponents = allComponents.filter(c => uc.components.reusableItems.includes(c.name.toLowerCase().replace(/ /g, '-')) || uc.components.netNewItems.includes(c.name.toLowerCase().replace(/ /g, '-')));
  const currentStageIdx = stageOrder.indexOf(uc.lifecycle.currentStage);

  const tabs = ['Overview', 'Cost & Cloud', 'Architecture', 'Execution', 'Approvals', 'IDSO Readiness'];

  const handleApproval = () => {
    if (!showApprovalModal) return;
    dispatch({
      type: 'UPDATE_APPROVAL',
      payload: {
        useCaseId: uc.id,
        step: showApprovalModal.step,
        status: showApprovalModal.action === 'approve' ? 'approved' : 'rejected',
        comments: approvalComment,
        approvedBy: persona.name,
      },
    });
    if (showApprovalModal.action === 'reject') {
      dispatch({ type: 'SET_USE_CASE_STATUS', payload: { useCaseId: uc.id, status: 'rejected' } });
    }
    addToast(dispatch, showApprovalModal.action === 'approve' ? 'success' : 'warning',
      `${uc.id} ${showApprovalModal.action === 'approve' ? 'approved' : 'rejected'}`,
      approvalComment || undefined);
    setShowApprovalModal(null);
    setApprovalComment('');
  };

  return (
    <div className="space-y-6">
      <Link to="/use-cases" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Use Cases
      </Link>

      {/* Header */}
      <div className="bg-surface-card rounded-lg border border-border-subtle p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm text-muted-foreground">{uc.id}</span>
               <StatusBadge status={uc.status} label={useCaseStatusLabels[uc.status]} />
              <StatusBadge status={uc.riskLevel} label={`${uc.riskLevel} risk`} />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">{uc.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{uc.businessVertical} · {uc.businessLine} · Priority #{uc.priorityRank} (Index: {uc.priorityScore})</p>
          </div>
        </div>

        {/* Stage Indicator */}
        <div className="mt-6 flex items-center gap-1" role="list" aria-label="Use case lifecycle stages">
          {stageOrder.map((stage, i) => (
            <React.Fragment key={stage}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                i < currentStageIdx ? 'bg-accent-green/10 text-accent-green' :
                i === currentStageIdx ? 'bg-accent-blue/10 text-foreground ring-2 ring-accent-blue' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < currentStageIdx ? <CheckCircle className="w-3 h-3" /> : i === currentStageIdx ? <Clock className="w-3 h-3" /> : null}
                <span className="hidden sm:inline">{lifecycleStageLabels[stage] || stage}</span>
              </div>
              {i < stageOrder.length - 1 && <div className={`w-4 h-0.5 ${i < currentStageIdx ? 'bg-accent-green' : 'bg-border-subtle'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle overflow-x-auto" role="tablist" aria-label="Use case details">
        {tabs.map((tab, i) => (
          <button key={tab} role="tab" aria-selected={activeTab === i} aria-controls={`uc-tab-${i}`} onClick={() => setActiveTab(i)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === i ? 'border-b-2 border-b-accent-blue text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-surface-card rounded-lg border border-border-subtle p-6 shadow-sm">
        {activeTab === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-2">Pain Point</h3>
              <p className="text-foreground">{uc.painPoint}</p>
            </div>
            {uc.idtNotes && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-2">IDT Notes</h3>
                <p className="text-foreground">{uc.idtNotes}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-2">AI Classification</h3>
              <div className="flex items-center gap-3">
                <span className="bg-accent-blue/10 text-accent-blue text-sm px-3 py-1 rounded-full">{uc.aiClassification.category}</span>
                <span className="text-sm text-muted-foreground">Confidence: {Math.round(uc.aiClassification.confidence * 100)}%</span>
              </div>
              <div className="flex gap-2 mt-2">{uc.aiClassification.suggestedTags.map(t => <span key={t} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{t}</span>)}</div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-2">Completeness Score</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-xs h-2 bg-border-subtle rounded-full overflow-hidden">
                  <div className="h-full bg-accent-green rounded-full" style={{ width: `${uc.completenessScore}%` }} />
                </div>
                <span className="text-sm font-medium">{uc.completenessScore}%</span>
              </div>
              {uc.missingFields.length > 0 && <p className="text-xs text-shell-red mt-1">Missing: {uc.missingFields.join(', ')}</p>}
            </div>

            {/* Related Experiments */}
            {(() => {
              const relatedExps = experiments.filter(e => e.useCaseId === uc.id);
              return relatedExps.length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Related Experiments</h3>
                  <div className="space-y-2">
                    {relatedExps.map(exp => (
                      <Link key={exp.id} to={`/model-lab/${exp.id}`} className="flex items-center justify-between p-3 bg-surface-elevated rounded-md border border-border-subtle hover:shadow-md transition-shadow">
                        <div>
                          <span className="font-mono text-xs text-muted-foreground">{exp.id}</span>
                          <span className="ml-2 text-sm text-foreground">{exp.modelType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {Object.entries(exp.metrics).length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {Object.entries(exp.metrics)[0][0]}: {typeof Object.entries(exp.metrics)[0][1] === 'number' && Object.entries(exp.metrics)[0][1] < 1 ? `${(Object.entries(exp.metrics)[0][1] * 100).toFixed(1)}%` : Object.entries(exp.metrics)[0][1]}
                            </span>
                          )}
                          <StatusBadge status={exp.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Deployed Endpoints */}
            {(() => {
              const relatedEps = deployedEndpoints.filter(ep => ep.useCaseId === uc.id);
              return relatedEps.length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2"><Rocket className="w-4 h-4" /> Deployed Endpoints</h3>
                  <div className="space-y-2">
                    {relatedEps.map(ep => (
                      <div key={ep.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-md border border-border-subtle">
                        <div>
                          <span className="font-mono text-xs text-muted-foreground">{ep.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={ep.environment.toLowerCase()} label={ep.environment} />
                          <span className="text-xs text-muted-foreground">{ep.version}</span>
                          <span className="text-xs text-muted-foreground">{ep.uptime}% uptime</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Connected Data Sources */}
            {(() => {
              const relatedDs = dataSources.filter(ds => ds.connectedUseCases.includes(uc.id));
              return relatedDs.length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2"><Database className="w-4 h-4" /> Connected Data Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedDs.map(ds => (
                      <span key={ds.id} className="text-xs bg-surface-elevated px-3 py-1.5 rounded-full border border-border-subtle text-foreground">{ds.name} <span className="text-muted-foreground ml-1">({ds.qualityScore}% quality)</span></span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[{ label: 'PoC', value: uc.costs.poc }, { label: 'Deployment', value: uc.costs.deployment }, { label: 'Scaling', value: uc.costs.scaling }, { label: 'Annual Run', value: uc.costs.annualRunMaintain }].map(c => (
                <div key={c.label} className="bg-surface-elevated rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-display text-foreground">${(c.value / 1000).toFixed(0)}K</p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-3">Cloud Breakdown</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(uc.costs.cloudBreakdown).map(([k, v]) => (
                  <div key={k} className="bg-surface-elevated rounded-lg p-4">
                    <p className="text-xs text-muted-foreground capitalize">{k}</p>
                    <p className="text-lg font-display text-foreground">${(v / 1000).toFixed(0)}K</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-accent-green/5 rounded-lg p-4 border border-accent-green/20">
              <p className="text-sm font-medium text-accent-green">Reuse Savings</p>
              <p className="text-foreground mt-1">{uc.components.reusable} of {uc.components.total} components reused — estimated ${(uc.components.reusable * 4000 / 1000).toFixed(0)}K saved vs. full build</p>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold text-muted-foreground mb-3">Components</h3>
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-elevated border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Name</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Type</th>
                </tr></thead>
                <tbody>
                  {uc.components.reusableItems.map(name => (
                    <tr key={name} className="border-b border-border-subtle">
                      <td className="py-2 px-3 text-foreground font-mono text-xs">{name}</td>
                      <td className="py-2 px-3"><StatusBadge status="reused" label="Reused" /></td>
                    </tr>
                  ))}
                  {uc.components.netNewItems.map(name => (
                    <tr key={name} className="border-b border-border-subtle">
                      <td className="py-2 px-3 text-foreground font-mono text-xs">{name}</td>
                      <td className="py-2 px-3"><StatusBadge status="net-new" label="Net New" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4">
              <div className="bg-surface-elevated rounded-lg p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-display">{uc.components.total}</p></div>
              <div className="bg-surface-elevated rounded-lg p-4"><p className="text-xs text-muted-foreground">Reusable</p><p className="text-2xl font-display text-accent-green">{uc.components.reusable} ({Math.round(uc.components.reuseRatio * 100)}%)</p></div>
              <div className="bg-surface-elevated rounded-lg p-4"><p className="text-xs text-muted-foreground">Net New</p><p className="text-2xl font-display text-accent-amber">{uc.components.netNew}</p></div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-6">
            {pod ? (
              <>
                <div className="bg-surface-elevated rounded-lg p-4">
                  <h3 className="font-bold text-foreground mb-2">{pod.name}</h3>
                  <p className="text-sm text-muted-foreground">Wipro {pod.wipro_pct}% / Shell {pod.shell_pct}% · Velocity: {pod.sprintVelocity} pts/sprint</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[pod.team.architect, ...pod.team.developers, ...pod.team.testers, pod.team.scrumMaster].map(m => (
                      <div key={m.id} className="flex items-center gap-1.5 bg-surface-card rounded-full px-2 py-1 border border-border-subtle text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${m.wipro ? 'bg-accent-blue text-accent-foreground' : 'bg-accent-green text-accent-foreground'}`}>{m.avatar}</div>
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2">Sprint Progress</h3>
                  <p className="text-foreground">Sprint {uc.lifecycle.sprintCurrent} of {uc.lifecycle.sprintTotal} — {uc.lifecycle.sprintCompletionPct}% complete</p>
                  <div className="w-full h-3 bg-border-subtle rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-shell-yellow rounded-full transition-all" style={{ width: `${uc.lifecycle.sprintCompletionPct}%` }} />
                  </div>
                </div>
                {pod.currentSprint.blockers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-shell-red mb-2">Active Blockers</h3>
                    {pod.currentSprint.blockers.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground bg-shell-red/5 p-3 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-shell-red shrink-0" /> {b}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-lg">No pod assigned yet</p>
                <p className="text-sm mt-1">This use case is pending pod assignment</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-4">
            {uc.approvals.map(a => (
              <div key={a.step} className="flex gap-4 items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.status === 'approved' ? 'bg-accent-green text-accent-foreground' : a.status === 'rejected' ? 'bg-shell-red text-accent-foreground' : 'bg-border-subtle text-muted-foreground'}`}>
                  {a.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : a.status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{formatLabel(a.type)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'approved' ? 'bg-accent-green/10 text-accent-green' : a.status === 'rejected' ? 'bg-shell-red/10 text-shell-red' : 'bg-accent-amber/10 text-accent-amber'}`}>{a.status}</span>
                  </div>
                  {a.approvedBy && <p className="text-sm text-muted-foreground mt-1">By {a.approvedBy} on {new Date(a.approvedAt!).toLocaleDateString()}</p>}
                  {a.comments && <p className="text-sm text-foreground mt-1 italic">"{a.comments}"</p>}
                  {a.status === 'pending' && (
                    ['idt-gm', 'idt-advisor', 'ide-gm', 'ide-pm', 'idso-gm', 'idso-pm'].includes(persona.id) ? (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setShowApprovalModal({ step: a.step, action: 'approve' })} className="bg-accent-green text-accent-foreground px-3 py-1.5 rounded text-xs font-medium hover:opacity-90">Approve</button>
                        <button onClick={() => setShowApprovalModal({ step: a.step, action: 'reject' })} className="bg-shell-red text-accent-foreground px-3 py-1.5 rounded text-xs font-medium hover:opacity-90">Reject</button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic mt-2 block">View only</span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 5 && (
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">IDSO Readiness Checklist</h3>
            {['Run cost projection confirmed', 'SLA targets defined', 'Monitoring alerts configured', 'Support runbook drafted', 'IDSO team briefed'].map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-3 bg-surface-elevated rounded-md cursor-pointer">
                <input type="checkbox" defaultChecked={i < (uc.status === 'deployed' ? 5 : 2)} className="w-4 h-4 accent-shell-yellow" />
                <span className="text-sm text-foreground">{item}</span>
              </label>
            ))}
            <div className="bg-surface-elevated rounded-lg p-4 mt-4">
              <p className="text-xs text-muted-foreground">Annual Run & Maintain Cost</p>
              <p className="text-xl font-display text-foreground">${(uc.costs.annualRunMaintain / 1000).toFixed(0)}K</p>
            </div>
          </div>
        )}
      </div>

      {/* Approval Drawer */}
      <Sheet open={!!showApprovalModal} onOpenChange={(isOpen) => { if (!isOpen) setShowApprovalModal(null); }}>
        <SheetContent side="right" className="flex flex-col">
          {showApprovalModal && (
            <>
              <SheetHeader>
                <SheetTitle>{showApprovalModal.action === 'approve' ? 'Approve' : 'Reject'} {uc.id}</SheetTitle>
                <SheetDescription className="sr-only">Provide a comment for this approval action</SheetDescription>
              </SheetHeader>
              <div className="flex-1 py-4">
                <textarea
                  value={approvalComment}
                  onChange={e => setApprovalComment(e.target.value)}
                  aria-label="Approval comment"
                  placeholder="Add a comment (required)..."
                  className="w-full bg-surface-elevated border border-border-subtle rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground h-32 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2 justify-end border-t border-border-subtle pt-4">
                <button onClick={() => setShowApprovalModal(null)} className="px-4 py-2 text-sm border border-border-subtle rounded-md text-foreground hover:bg-surface-elevated">Cancel</button>
                <button
                  onClick={handleApproval}
                  disabled={!approvalComment.trim()}
                  className={`px-4 py-2 text-sm rounded-md font-medium text-accent-foreground disabled:opacity-50 ${showApprovalModal.action === 'approve' ? 'bg-accent-green' : 'bg-shell-red'}`}
                >
                  Confirm {showApprovalModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
