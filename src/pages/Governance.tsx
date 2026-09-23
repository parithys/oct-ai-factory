import React, { useState } from 'react';
import { formatLabel } from '@/lib/utils';
import { useApp, useCurrentPersona, addToast } from '@/context/AppContext';
import { scopeUseCases } from '@/data/metrics';
import { auditLog } from '@/data/mockData';
import { Search, Download, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function Governance() {
  const { state, dispatch } = useApp();
  const persona = useCurrentPersona();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const tabs = ['Approval Queue', 'Risk Classification', 'Audit Log', 'Explainability'];

  const pendingApprovals = state.useCases.flatMap(uc =>
    uc.approvals.filter(a => a.status === 'pending').map(a => ({ ...a, useCaseId: uc.id, useCaseTitle: uc.title, riskLevel: uc.riskLevel, submittedBy: uc.submittedBy.name, submittedAt: uc.submittedAt }))
  );

  const filteredAudit = auditLog.filter(e => !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.actor.toLowerCase().includes(search.toLowerCase()) || e.target.toLowerCase().includes(search.toLowerCase()));
  const paginatedAudit = filteredAudit.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Governance</h1>

      <div className="flex gap-1 border-b border-border-subtle overflow-x-auto" role="tablist" aria-label="Governance sections">
        {tabs.map((tab, i) => (
          <button key={tab} role="tab" aria-selected={activeTab === i} aria-controls={`gov-tab-${i}`} onClick={() => setActiveTab(i)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap ${activeTab === i ? 'border-b-2 border-b-accent-blue text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab} {i === 0 && pendingApprovals.length > 0 ? `(${pendingApprovals.length})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
          {pendingApprovals.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground"><CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No pending approvals</p></div>
          ) : (
             <table className="w-full text-sm" aria-label="Pending approval requests">
              <thead><tr className="bg-surface-elevated border-b border-border-subtle">
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Use Case</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Approval Type</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Submitted By</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Risk</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody>
                {pendingApprovals.map((a, i) => (
                  <tr key={i} className="border-b border-border-subtle hover:bg-surface-elevated">
                    <td className="py-3 px-4"><span className="font-mono text-xs text-muted-foreground">{a.useCaseId}</span> <span className="font-medium text-foreground">{a.useCaseTitle}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{formatLabel(a.type)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.submittedBy}</td>
                    <td className="py-3 px-4"><StatusBadge status={a.riskLevel} /></td>
                    <td className="py-3 px-4">
                      {['idt-gm', 'idt-advisor', 'ide-gm', 'ide-pm', 'idso-gm', 'idso-pm'].includes(persona.id) ? (
                        <div className="flex gap-2">
                          <button aria-label={`Approve ${a.useCaseId}`} onClick={() => { dispatch({ type: 'UPDATE_APPROVAL', payload: { useCaseId: a.useCaseId, step: a.step, status: 'approved', approvedBy: persona.name, comments: 'Approved' } }); addToast(dispatch, 'success', `${a.useCaseId} approved`); }} className="text-xs border border-accent-green text-accent-green bg-transparent px-3 py-1 rounded hover:bg-accent-green/10 font-medium transition-colors">Approve</button>
                          <button aria-label={`Reject ${a.useCaseId}`} onClick={() => { dispatch({ type: 'UPDATE_APPROVAL', payload: { useCaseId: a.useCaseId, step: a.step, status: 'rejected', approvedBy: persona.name, comments: 'Rejected' } }); dispatch({ type: 'SET_USE_CASE_STATUS', payload: { useCaseId: a.useCaseId, status: 'rejected' } }); addToast(dispatch, 'warning', `${a.useCaseId} rejected`); }} className="text-xs border border-shell-red text-shell-red bg-transparent px-3 py-1 rounded hover:bg-shell-red/10 font-medium transition-colors">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
           <table className="w-full text-sm" aria-label="Risk classification matrix">
            <thead><tr className="bg-surface-elevated border-b border-border-subtle">
               <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Use Case</th>
               <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Risk Level</th>
               <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</th>
               <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Factors</th>
            </tr></thead>
             <tbody>
              {scopeUseCases(state.useCases, persona.id).map(uc => (
                <tr key={uc.id} className="border-b border-border-subtle hover:bg-surface-elevated">
                  <td className="py-3 px-4 font-medium text-foreground">{uc.id} — {uc.title}</td>
                  <td className="py-3 px-4"><StatusBadge status={uc.riskLevel} /></td>
                  <td className="py-3 px-4">{uc.priorityScore}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{uc.components.netNew} net-new components · {uc.tags.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 2 && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <label htmlFor="audit-search" className="sr-only">Search audit log</label>
              <input id="audit-search" type="text" placeholder="Search audit log..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button aria-label="Export audit log as CSV" onClick={() => addToast(dispatch, 'success', 'Audit log exported', `audit_log_${new Date().toISOString().slice(0, 10)}.csv`)} className="flex items-center gap-2 border border-border-subtle px-3 py-2 rounded-md text-sm hover:bg-surface-elevated">
              <Download className="w-4 h-4" aria-hidden="true" /> Export
            </button>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
            <table className="w-full text-sm" aria-label="Audit log entries">
              <thead><tr className="bg-surface-elevated border-b border-border-subtle">
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Timestamp</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Actor</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Persona</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Action</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Target</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Details</th>
              </tr></thead>
              <tbody>
                {paginatedAudit.map(e => (
                  <tr key={e.id} className="border-b border-border-subtle hover:bg-surface-elevated text-xs">
                    <td className="py-2.5 px-4 font-mono text-muted-foreground whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-foreground">{e.actor}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{e.persona}</td>
                    <td className="py-2.5 px-4 font-medium text-foreground">{e.action}</td>
                    <td className="py-2.5 px-4 font-mono text-muted-foreground">{e.target}</td>
                    <td className="py-2.5 px-4 text-muted-foreground max-w-[300px] truncate">{e.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
              <span className="text-xs text-muted-foreground">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredAudit.length)} of {filteredAudit.length}</span>
              <div className="flex items-center gap-2">
                <button aria-label="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded border border-border-subtle disabled:opacity-30 hover:bg-surface-elevated transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button aria-label="Next page" onClick={() => setPage(p => p + 1)} disabled={page * perPage >= filteredAudit.length} className="p-1 rounded border border-border-subtle disabled:opacity-30 hover:bg-surface-elevated transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-surface-card rounded-lg border border-border-subtle p-6 space-y-6">
          <h3 className="font-bold text-foreground">AI/ML Explainability & Compliance</h3>
          <div className="space-y-3">
            {['Model documented', 'Training data catalogued', 'Human oversight mechanism defined', 'Explainability report available'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm"><CheckCircle className="w-4 h-4 text-accent-green" /><span className="text-foreground">{item}</span></div>
            ))}
            <div className="flex items-center gap-3 text-sm"><Clock className="w-4 h-4 text-accent-amber" /><span className="text-foreground">Bias assessment — PENDING</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
