import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useCurrentPersona, addToast } from '@/context/AppContext';
import { deployedEndpoints } from '@/data/mockData';
import { isAlertRelevantForPersona, getPersonaCategory, monitoringOnlyAlerts } from '@/data/metrics';
import { getSourceLabel, getAlertOwnerLabel } from '@/data/rbac';
import { AlertTriangle, CheckCircle, Info, XCircle, ChevronDown, ChevronUp, Zap, Eye, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const sevIcons = { critical: XCircle, warning: AlertTriangle, info: Info };
const sevColors = { critical: 'border-l-shell-red', warning: 'border-l-accent-amber', info: 'border-l-accent-blue' };
const sevSortOrder = { critical: 0, warning: 1, info: 2 };

export default function Monitoring() {
  const { state, dispatch } = useApp();
  const persona = useCurrentPersona();
  const cat = getPersonaCategory(persona.id);
  const [alerts, setAlerts] = useState(state.alerts);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [sevFilter, setSevFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => { setAlerts(state.alerts); }, [state.alerts]);

  // Filter alerts by persona relevance, then by severity
  const relevantAlerts = alerts
    .filter(a => isAlertRelevantForPersona(a, persona.id))
    .filter(a => sevFilter === 'all' || a.severity === sevFilter)
    .sort((a, b) => sevSortOrder[a.severity] - sevSortOrder[b.severity]);

  // Environment-filtered endpoints
  const filteredEndpoints = state.environmentFilter === 'all'
    ? deployedEndpoints
    : deployedEndpoints.filter(ep => ep.environment === state.environmentFilter);

  const activeEndpoints = filteredEndpoints.filter(e => e.status === 'deployed');

  const reqData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, requests: Math.floor(40 + Math.random() * 80) }));
  const rtData = Array.from({ length: 24 }, (_, i) => {
    const spikeHours = [6, 7, 14, 15];
    const ms = spikeHours.includes(i)
      ? Math.floor(520 + Math.random() * 130)
      : Math.floor(80 + Math.random() * 120);
    return { hour: `${i}:00`, ms, sla: 500 };
  });
  const errData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, pct: +(Math.random() * 3).toFixed(1) }));

  const showTechnicalCharts = cat !== 'business' && cat !== 'idt';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Monitoring</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {persona.accessModules.includes('deployment') ? (
          <Link to="/deployment" className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <p className="text-xs font-bold text-muted-foreground">Active Endpoints</p>
            <p className="text-2xl font-display font-bold text-foreground">{activeEndpoints.length}</p>
            <p className="text-xs text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity mt-1">View in Deployment →</p>
          </Link>
        ) : (
          <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">Active Endpoints</p>
            <p className="text-2xl font-display font-bold text-foreground">{activeEndpoints.length}</p>
          </div>
        )}
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">Active Alerts</p>
          <p className="text-2xl font-display font-bold text-shell-red">{relevantAlerts.filter(a => !a.acknowledged).length}</p>
          <p className="text-xs text-muted-foreground mt-1">{relevantAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length} critical</p>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">Avg Uptime</p>
          <p className="text-2xl font-display font-bold text-accent-green">
            {activeEndpoints.length > 0 ? (activeEndpoints.reduce((s, e) => s + e.uptime, 0) / activeEndpoints.length).toFixed(1) : '—'}%
          </p>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">Avg Response</p>
          <p className="text-2xl font-display font-bold text-foreground">
            {activeEndpoints.length > 0 ? Math.round(activeEndpoints.reduce((s, e) => s + e.avgResponseTime, 0) / activeEndpoints.length) : '—'}ms
          </p>
        </div>
      </div>

      {/* Vendor Invoice SLA alert - surfaced here in Monitoring, not Data Management */}
      {(cat === 'idso' || cat === 'ide-leadership' || cat === 'ide-delivery') && monitoringOnlyAlerts.map((a, i) => (
        <div key={i} className={`bg-surface-card border border-border-subtle rounded-md p-3 flex items-center gap-3 text-sm ${a.sev}`}>
          <span className="w-2 h-2 rounded-full bg-current shrink-0" />
          {a.msg}
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showTechnicalCharts && (
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Requests / Hour</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={reqData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border-subtle))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={1} tickLine={false} axisLine={{ stroke: 'hsl(var(--border-subtle))' }} label={{ value: 'Time of Day', position: 'insideBottom', offset: -18, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 } }} />
                    <YAxis width={60} tickMargin={4} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border-subtle))' }} label={{ value: 'Requests (count)', angle: -90, position: 'center', dx: -20, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 } }} />
                    <Tooltip />
                    <Area dataKey="requests" fill="#FBCE07" fillOpacity={0.25} stroke="#FBCE07" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Response Time (ms)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={rtData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border-subtle))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={1} tickLine={false} axisLine={{ stroke: 'hsl(var(--border-subtle))' }} label={{ value: 'Time of Day', position: 'insideBottom', offset: -18, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 } }} />
                    <YAxis width={60} tickMargin={4} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border-subtle))' }} label={{ value: 'Response Time (ms)', angle: -90, position: 'center', dx: -20, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 } }} />
                    <Tooltip />
                    <Line dataKey="ms" stroke="#2B4590" strokeWidth={2} dot={false} />
                    <Line dataKey="sla" stroke="#DD1D21" strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-surface-card rounded-lg border border-border-subtle p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Error Rate (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={errData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border-subtle))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={1} tickLine={false} axisLine={{ stroke: 'hsl(var(--border-subtle))' }} label={{ value: 'Time of Day', position: 'insideBottom', offset: -18, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 } }} />
                  <YAxis width={60} tickMargin={4} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border-subtle))' }} label={{ value: 'Error Rate (%)', angle: -90, position: 'center', dx: -20, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 } }} />
                  <Tooltip />
                  <Bar dataKey="pct" fill="#DD1D21" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={showTechnicalCharts ? '' : 'lg:col-span-3'}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Active Alerts</h3>
              <div className="flex gap-1">
                {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSevFilter(sev)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${sevFilter === sev ? 'bg-accent-blue text-accent-foreground' : 'bg-surface-elevated text-muted-foreground hover:text-foreground'}`}
                  >
                    {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {relevantAlerts.length === 0 ? (
              <div className="bg-surface-card rounded-lg border border-border-subtle p-6 text-center text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No alerts relevant to your role</p>
                <p className="text-xs mt-1">All systems operating within normal parameters</p>
              </div>
            ) : (
              relevantAlerts.map(alert => {
                const Icon = sevIcons[alert.severity];
                const isExpanded = expandedAlert === alert.id;
                const useCaseId = deployedEndpoints.find(ep => ep.id === alert.endpointId)?.useCaseId || '';
                return (
                  <div key={alert.id} className={`bg-surface-card rounded-lg border border-border-subtle p-4 border-l-4 ${sevColors[alert.severity]} ${alert.acknowledged ? 'opacity-50' : ''} transition-all`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-shell-red' : alert.severity === 'warning' ? 'text-accent-amber' : 'text-accent-blue'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-medium text-foreground uppercase">{alert.type}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                            alert.severity === 'critical' ? 'bg-shell-red/10 text-shell-red' :
                            alert.severity === 'warning' ? 'bg-accent-amber/10 text-accent-amber' :
                            'bg-accent-blue/10 text-accent-blue'
                          }`}>{alert.severity}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {getSourceLabel(alert.source)}
                          </span>
                          {alert.confidence != null && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue font-medium">
                              {alert.confidence}% confidence
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/70 flex-wrap">
                          <Link to={`/use-cases/${useCaseId}`} className="hover:text-accent-blue hover:underline">{alert.useCaseTitle}</Link>
                          <span>·</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          <span>·</span>
                          <span>Owner: {getAlertOwnerLabel(alert.ownerRole)}</span>
                        </div>

                        {/* Expandable Traceability Section */}
                        <button
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                          className="flex items-center gap-1 mt-2 text-xs text-accent-blue hover:underline"
                        >
                          <Eye className="w-3 h-3" />
                          {isExpanded ? 'Hide details' : 'Why am I seeing this?'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-3 bg-surface-elevated rounded-md border border-border-subtle text-xs space-y-2">
                            <div><span className="font-medium text-foreground">Source:</span> <span className="text-muted-foreground">{getSourceLabel(alert.source)}</span></div>
                            <div><span className="font-medium text-foreground">Reason:</span> <span className="text-muted-foreground">{alert.reason}</span></div>
                            <div><span className="font-medium text-foreground">Impacted:</span> <span className="text-muted-foreground">{alert.impactedEntity}</span></div>
                            <div><span className="font-medium text-foreground">Assigned to:</span> <span className="text-muted-foreground">{getAlertOwnerLabel(alert.ownerRole)}</span></div>
                            {alert.suggestedAction && (
                              <div className="flex items-start gap-2 p-2 bg-accent-blue/5 rounded border border-accent-blue/10">
                                <Zap className="w-3.5 h-3.5 text-accent-blue shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium text-foreground">Suggested action:</span>
                                  <p className="text-muted-foreground mt-0.5">{alert.suggestedAction}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        {!alert.acknowledged && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => { dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: alert.id }); addToast(dispatch, 'success', 'Alert acknowledged', alert.type); }}
                              aria-label={`Acknowledge alert: ${alert.message}`}
                              className="text-xs bg-surface-elevated px-3 py-1.5 rounded border border-border-subtle hover:bg-muted transition-colors font-medium"
                            >
                              Acknowledge
                            </button>
                            {alert.suggestedAction && (
                              <button
                                onClick={() => { addToast(dispatch, 'info', 'Investigation started', alert.suggestedAction || 'Investigating...'); }}
                                className="text-xs bg-accent-blue/10 text-accent-blue px-3 py-1.5 rounded border border-accent-blue/20 hover:bg-accent-blue/20 transition-colors font-medium"
                              >
                                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Investigate</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
