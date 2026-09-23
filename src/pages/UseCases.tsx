import React, { useState, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, useNavigate } from 'react-router-dom';
import { useApp, useCurrentPersona, addToast } from '@/context/AppContext';
import { useCaseStatusLabels, lifecycleStageLabels, scopeUseCases } from '@/data/metrics';
import { Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import SubmitUseCaseWizard from '@/components/SubmitUseCaseWizard';
import StatusBadge from '@/components/StatusBadge';

export default function UseCases() {
  const { state } = useApp();
  const persona = useCurrentPersona();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const navigate = useNavigate();
  const perPage = 10;

  const filtered = useMemo(() => {
    const scoped = scopeUseCases(state.useCases, persona.id);
    return scoped.filter(uc => {
      if (statusFilter !== 'all' && uc.status !== statusFilter) return false;
      if (search && !uc.title.toLowerCase().includes(search.toLowerCase()) && !uc.painPoint.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [state.useCases, search, statusFilter, persona.id]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const canSubmit = ['business-sponsor', 'business-sme', 'idt-advisor'].includes(persona.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">AI Use Cases</h1>
        {canSubmit && (
          <button onClick={() => setWizardOpen(true)} aria-label="Submit a new use case" className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
            <PlusCircle className="w-5 h-5" aria-hidden="true" /> Submit New Use Case
          </button>
        )}
      </div>

      <SubmitUseCaseWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <label htmlFor="uc-search" className="sr-only">Search use cases</label>
          <input
            id="uc-search"
            type="text"
            placeholder="Search use cases..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border-subtle rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <label htmlFor="uc-status-filter" className="sr-only">Filter by status</label>
        <select
          id="uc-status-filter"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-surface-card border border-border-subtle rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          {Object.entries(useCaseStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="AI use cases list">
            <thead>
              <tr className="bg-surface-elevated border-b border-border-subtle">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Title</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Vertical</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Priority</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Stage</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help border-b border-dashed border-muted-foreground">Risk</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="font-semibold mb-2">Risk Levels:</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-green inline-block" /><span className="text-xs"><strong>Low</strong> — Minimal risk, on track</span></div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-amber inline-block" /><span className="text-xs"><strong>Medium</strong> — Some concerns, needs monitoring</span></div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-shell-red inline-block" /><span className="text-xs"><strong>High</strong> — Significant risk, action required</span></div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">PoC Cost</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Reuse %</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(uc => (
                <tr key={uc.id} role="link" tabIndex={0} aria-label={`View ${uc.id}: ${uc.title}`} className="border-b border-border-subtle hover:bg-surface-elevated transition-colors cursor-pointer" onClick={() => navigate(`/use-cases/${uc.id}`)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/use-cases/${uc.id}`); } }}>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{uc.id}</td>
                  <td className="py-3 px-4 font-medium text-foreground max-w-[250px] truncate">{uc.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">{uc.businessVertical}</td>
                  <td className="py-3 px-4"><span className="font-mono text-xs">#{uc.priorityRank}</span> <span className="text-xs text-muted-foreground">({uc.priorityScore})</span></td>
                  <td className="py-3 px-4 text-xs">{lifecycleStageLabels[uc.lifecycle.currentStage] || uc.lifecycle.currentStage}</td>
                  <td className="py-3 px-4"><StatusBadge status={uc.riskLevel} /></td>
                  <td className="py-3 px-4 font-mono text-xs">${(uc.costs.poc / 1000).toFixed(0)}K</td>
                  <td className="py-3 px-4">{Math.round(uc.components.reuseRatio * 100)}%</td>
                  <td className="py-3 px-4"><StatusBadge status={uc.status} label={useCaseStatusLabels[uc.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <span className="text-sm text-muted-foreground">Showing {filtered.length > 0 ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-border-subtle hover:bg-surface-elevated hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-foreground">Page {page} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded border border-border-subtle hover:bg-surface-elevated hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
