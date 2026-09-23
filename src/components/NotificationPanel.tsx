import React, { useState } from 'react';
import { formatLabel } from '@/lib/utils';
import { useApp, useCurrentPersona } from '@/context/AppContext';
import { isAlertRelevantForPersona, getPersonaCategory, scopeUseCases } from '@/data/metrics';
import { ApprovalType, PersonaId } from '@/data/types';
import { Bell, AlertTriangle, CheckCircle, Shield, X, Clock, Briefcase, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'alert' | 'approval' | 'portfolio';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  severity?: 'critical' | 'warning' | 'info';
}

// Which approval types are relevant for each persona category
function isApprovalRelevant(approvalType: ApprovalType, personaId: PersonaId): boolean {
  const cat = getPersonaCategory(personaId);
  switch (cat) {
    case 'business':
      // Business personas only care about status updates on their own use cases (handled separately)
      return false;
    case 'idt':
      return approvalType === 'idtQualification';
    case 'ide-leadership':
      return approvalType === 'ideAcceptance' || approvalType === 'architectureReview';
    case 'ide-delivery':
      return approvalType === 'architectureReview';
    case 'idso':
      return approvalType === 'deploymentApproval' || approvalType === 'cisoReview';
    default:
      return false;
  }
}

function buildNotifications(state: ReturnType<typeof useApp>['state'], personaId: string): Notification[] {
  const items: Notification[] = [];
  const cat = getPersonaCategory(personaId as PersonaId);
  const scopedUcs = scopeUseCases(state.useCases, personaId as PersonaId);

  // Alerts — filtered by persona relevance
  state.alerts.forEach(a => {
    if (!isAlertRelevantForPersona(a, personaId as PersonaId)) return;
    items.push({
      id: `alert-${a.id}`,
      type: 'alert',
      title: a.useCaseTitle,
      description: a.message,
      timestamp: a.timestamp,
      read: a.acknowledged,
      severity: a.severity,
    });
  });

  // Approvals — filtered by persona responsibility
  if (cat !== 'business') {
    scopedUcs.forEach(uc => {
      uc.approvals.forEach(ap => {
        if (ap.status === 'pending' && isApprovalRelevant(ap.type, personaId as PersonaId)) {
          items.push({
            id: `approval-pending-${uc.id}-${ap.step}`,
            type: 'approval',
            title: uc.title,
            description: `${formatLabel(ap.type)} awaiting approval`,
            timestamp: uc.submittedAt,
            read: false,
          });
        }
      });
    });
  }

  // Business personas get portfolio-relevant notifications for their own use cases
  if (cat === 'business') {
    const myUcs = scopedUcs;
    const inDev = myUcs.filter(u => u.status === 'in-development');
    const deployed = myUcs.filter(u => u.status === 'deployed');

    if (inDev.length > 0) {
      items.push({
        id: 'portfolio-indev',
        type: 'portfolio',
        title: 'Development Progress',
        description: `${inDev.length} use case${inDev.length !== 1 ? 's' : ''} currently in active development`,
        timestamp: new Date().toISOString(),
        read: true,
      });
    }
    if (deployed.length > 0) {
      items.push({
        id: 'portfolio-deployed',
        type: 'portfolio',
        title: 'Production Status',
        description: `${deployed.length} use case${deployed.length !== 1 ? 's' : ''} running in production`,
        timestamp: new Date().toISOString(),
        read: true,
      });
    }
    // Show approval status updates relevant to their use cases
    myUcs.forEach(uc => {
      uc.approvals.forEach(ap => {
        if (ap.status === 'approved' && ap.approvedAt) {
          items.push({
            id: `biz-approval-${uc.id}-${ap.step}`,
            type: 'approval',
            title: uc.title,
            description: `${formatLabel(ap.type)} approved${ap.approvedBy ? ` by ${ap.approvedBy}` : ''}`,
            timestamp: ap.approvedAt,
            read: true,
          });
        } else if (ap.status === 'pending') {
          items.push({
            id: `biz-pending-${uc.id}-${ap.step}`,
            type: 'approval',
            title: uc.title,
            description: `${formatLabel(ap.type)} awaiting approval`,
            timestamp: uc.submittedAt,
            read: false,
          });
        }
      });
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, 20);
}

const iconMap: Record<string, React.ComponentType<any>> = {
  alert: AlertTriangle,
  approval: Shield,
  portfolio: Briefcase,
};

const severityColors: Record<string, string> = {
  critical: 'text-destructive',
  warning: 'text-accent-amber',
  info: 'text-accent-blue',
};

type FilterType = 'all' | 'alert' | 'approval' | 'portfolio';

export default function NotificationPanel() {
  const { state, dispatch } = useApp();
  const persona = useCurrentPersona();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const notifications = buildNotifications(state, persona.id);
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const cat = getPersonaCategory(persona.id);
  const filters: { label: string; value: FilterType }[] = cat === 'business'
    ? [{ label: 'All', value: 'all' }, { label: 'Approvals', value: 'approval' }, { label: 'Portfolio', value: 'portfolio' }]
    : [{ label: 'All', value: 'all' }, { label: 'Alerts', value: 'alert' }, { label: 'Approvals', value: 'approval' }];

  function handleMarkAllRead() {
    state.alerts.forEach(a => {
      if (!a.acknowledged) {
        dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: a.id });
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-shell-red text-accent-foreground text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-96 bg-surface-card border border-border-subtle rounded-lg shadow-lg z-50 flex flex-col max-h-[32rem]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
              <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleMarkAllRead} className="text-xs text-accent-blue hover:underline">Mark all read</button>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex gap-1 px-4 py-2 border-b border-border-subtle shrink-0">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f.value
                      ? 'bg-accent-blue text-accent-foreground'
                      : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                filtered.map(n => {
                  const Icon = iconMap[n.type] || Bell;
                  const iconColor = n.severity ? severityColors[n.severity] : 'text-muted-foreground';
                  let timeAgo: string;
                  try {
                    timeAgo = formatDistanceToNow(new Date(n.timestamp), { addSuffix: true });
                  } catch {
                    timeAgo = n.timestamp;
                  }
                  return (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-border-subtle last:border-0 hover:bg-surface-elevated transition-colors ${!n.read ? 'bg-accent-blue/5' : ''}`}
                    >
                      <div className={`shrink-0 mt-0.5 ${iconColor}`}><Icon className="w-4 h-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70">
                          <Clock className="w-3 h-3" /><span>{timeAgo}</span>
                        </div>
                      </div>
                      {!n.read && <div className="shrink-0 mt-1.5"><div className="w-2 h-2 rounded-full bg-accent-blue" /></div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
