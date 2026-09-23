import React, { useState } from 'react';
import shellLogo from '@/assets/shell-logo.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp, useCurrentPersona, addToast } from '@/context/AppContext';
import { personas } from '@/data/personas';
import { EnvironmentFilter } from '@/data/types';
import {
  LayoutDashboard, Briefcase, Database, FlaskConical, Rocket, Activity, Shield, BarChart3,
  Settings, User, ChevronLeft, ChevronRight, Sun, Moon, ChevronDown, Menu, LogOut, Globe, Clock,
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';
import { formatDistanceToNow } from 'date-fns';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { label: 'AI Use Cases', path: '/use-cases', icon: Briefcase, module: 'use-cases' },
  { label: 'Governance', path: '/governance', icon: Shield, module: 'governance' },
  { label: 'Data Management', path: '/data', icon: Database, module: 'data' },
  { label: 'Model Lab', path: '/model-lab', icon: FlaskConical, module: 'model-lab' },
  { label: 'Deployment', path: '/deployment', icon: Rocket, module: 'deployment' },
  { label: 'Monitoring', path: '/monitoring', icon: Activity, module: 'monitoring' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, module: 'analytics' },
];

const systemItems = [
  { label: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
  { label: 'Profile', path: '/profile', icon: User, module: 'profile' },
];

const envOptions: { label: string; value: EnvironmentFilter }[] = [
  { label: 'All Environments', value: 'all' },
  { label: 'Development', value: 'Development' },
  { label: 'Staging', value: 'Staging' },
  { label: 'Production', value: 'Production' },
];

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const labels: Record<string, string> = {
    dashboard: 'Dashboard', 'use-cases': 'AI Use Cases', data: 'Data Management',
    'model-lab': 'Model Lab', deployment: 'Deployment', monitoring: 'Monitoring',
    governance: 'Governance', analytics: 'Analytics', settings: 'Settings', profile: 'Profile',
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">Home</Link>
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          <span className="mx-1">/</span>
          {i === segments.length - 1 ? (
            <span className="text-foreground font-medium">{labels[seg] || seg}</span>
          ) : (
            <Link to={`/${segments.slice(0, i + 1).join('/')}`} className="hover:text-foreground transition-colors">
              {labels[seg] || seg}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function DataFreshnessIndicator() {
  const { state } = useApp();
  let timeAgo: string;
  try {
    timeAgo = formatDistanceToNow(new Date(state.lastUpdated), { addSuffix: true });
  } catch {
    timeAgo = 'just now';
  }
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground pr-4" title={`Last updated: ${new Date(state.lastUpdated).toLocaleString()}`}>
      <Clock className="w-3 h-3" />
      <span>Updated {timeAgo}</span>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const persona = useCurrentPersona();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [personaHighlight, setPersonaHighlight] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);

  const visibleNav = navItems.filter(item => persona.accessModules.includes(item.module));

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
    addToast(dispatch, 'info', 'Signed out', 'You have been logged out.');
  };

  const currentEnvLabel = envOptions.find(e => e.value === state.environmentFilter)?.label || 'All Environments';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`${collapsed ? 'w-16' : 'w-60'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border shrink-0">
          <img src={shellLogo} alt="Shell" className="w-8 h-8 object-contain" />
          {!collapsed && <span className="font-display text-lg font-semibold tracking-tight">Shell AI Factory</span>}
        </div>


        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <p className={`text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
            {collapsed ? '—' : 'Main'}
          </p>
          {visibleNav.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5 text-sm transition-all ${
                  isActive
                    ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <p className={`text-xs uppercase tracking-wider text-sidebar-foreground/50 mt-6 mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
            {collapsed ? '—' : 'System'}
          </p>
          {systemItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5 text-sm transition-all ${
                  isActive
                    ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-10 items-center justify-center border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header role="banner" className="h-16 bg-surface-card border-b border-border-subtle flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-foreground" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-2">
            {/* Data Freshness */}
            <DataFreshnessIndicator />


            {/* Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setPersonaOpen(!personaOpen)}
                aria-expanded={personaOpen}
                aria-haspopup="listbox"
                aria-label={`Switch persona, current: ${persona.name}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border border-border-subtle hover:bg-surface-elevated transition-all duration-500 text-sm ${personaHighlight ? 'bg-shell-yellow/30 border-shell-yellow' : ''}`}
              >
                <div className="w-7 h-7 rounded-full bg-accent-blue flex items-center justify-center text-xs font-bold text-accent-foreground">
                  {persona.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-medium text-foreground leading-tight">{persona.name}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{persona.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {personaOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPersonaOpen(false)} />
                  <div role="listbox" aria-label="Persona list" className="absolute right-0 top-full mt-1 w-72 bg-surface-card border border-border-subtle rounded-lg shadow-lg z-50 py-1 max-h-96 overflow-y-auto">
                    {personas.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          dispatch({ type: 'SET_PERSONA', payload: p.id });
                          setPersonaOpen(false);
                          setPersonaHighlight(true);
                          setTimeout(() => setPersonaHighlight(false), 2000);
                        }}
                        role="option"
                        aria-selected={state.currentPersona === p.id}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-elevated transition-colors ${
                          state.currentPersona === p.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-xs font-bold text-accent-foreground">
                          {p.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.role} · {p.layer}</div>
                          <div className="flex gap-1 mt-0.5">
                            {p.permissions.map(perm => (
                              <span key={perm} className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-muted text-muted-foreground font-medium">{perm}</span>
                            ))}
                          </div>
                        </div>
                        {state.currentPersona === p.id && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-shell-yellow shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dark Mode */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              className="p-2 rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {state.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <NotificationPanel />

            {/* Logout with confirmation */}
            <div className="relative">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-destructive"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              {showLogoutConfirm && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLogoutConfirm(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-surface-card border border-border-subtle rounded-lg shadow-lg z-50 p-4">
                    <p className="text-sm font-medium text-foreground mb-3">Sign out?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-md border border-border-subtle text-foreground hover:bg-surface-elevated"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 px-3 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground hover:opacity-90"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main role="main" aria-label="Page content" className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
