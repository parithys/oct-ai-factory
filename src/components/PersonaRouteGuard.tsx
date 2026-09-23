import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentPersona } from '@/context/AppContext';
import { ShieldX } from 'lucide-react';

const routeModuleMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/use-cases': 'use-cases',
  '/governance': 'governance',
  '/data': 'data',
  '/model-lab': 'model-lab',
  '/deployment': 'deployment',
  '/monitoring': 'monitoring',
  '/analytics': 'analytics',
  '/settings': 'settings',
  '/profile': 'profile',
};

function getModuleForPath(pathname: string): string | null {
  for (const [route, module] of Object.entries(routeModuleMap)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return module;
    }
  }
  return null;
}

export default function PersonaRouteGuard({ children }: { children: React.ReactNode }) {
  const persona = useCurrentPersona();
  const location = useLocation();
  const requiredModule = getModuleForPath(location.pathname);

  // profile is always accessible, dashboard is always accessible
  if (!requiredModule || requiredModule === 'profile' || requiredModule === 'dashboard') {
    return <>{children}</>;
  }

  if (!persona.accessModules.includes(requiredModule)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Your current role <span className="font-semibold text-foreground">({persona.role})</span> does not have permission to access this module.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
