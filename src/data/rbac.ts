/**
 * Role-Based Access Control (RBAC) — Single Source of Truth
 * Defines what each persona can do across the platform.
 */
import { PersonaId, Permission } from './types';

// ─── Permission Definitions per Persona ───
const personaPermissions: Record<PersonaId, Permission[]> = {
  'business-sponsor': ['view'],
  'business-sme': ['view', 'edit'],
  'idt-gm': ['view', 'approve'],
  'idt-advisor': ['view', 'approve', 'edit'],
  'ide-gm': ['view', 'edit', 'approve', 'deploy', 'configure'],
  'ide-pm': ['view', 'edit', 'approve', 'deploy'],
  'pod-member': ['view', 'edit'],
  'wipro-delivery': ['view', 'edit', 'deploy'],
  'idso-gm': ['view', 'approve', 'deploy', 'configure'],
  'idso-pm': ['view', 'approve', 'deploy'],
};

export function hasPermission(personaId: PersonaId, permission: Permission): boolean {
  return personaPermissions[personaId]?.includes(permission) ?? false;
}

export function getPermissions(personaId: PersonaId): Permission[] {
  return personaPermissions[personaId] ?? ['view'];
}

// ─── Action-level checks ───
export function canApprove(personaId: PersonaId): boolean {
  return hasPermission(personaId, 'approve');
}

export function canDeploy(personaId: PersonaId): boolean {
  return hasPermission(personaId, 'deploy');
}

export function canEdit(personaId: PersonaId): boolean {
  return hasPermission(personaId, 'edit');
}

export function canConfigure(personaId: PersonaId): boolean {
  return hasPermission(personaId, 'configure');
}

// ─── Alert Ownership Mapping ───
export function getAlertOwnerLabel(ownerRole: string): string {
  const labels: Record<string, string> = {
    'ide-gm': 'IDE GM',
    'ide-pm': 'IDE Project Manager',
    'idso-gm': 'IDSO GM',
    'idso-pm': 'IDSO Project Manager',
    'idt-gm': 'IDT GM',
    'business-sponsor': 'Business Sponsor',
  };
  return labels[ownerRole] || ownerRole;
}

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'ai-engine': 'AI Engine',
    'rule-engine': 'Rule Engine',
    'system-monitor': 'System Monitor',
  };
  return labels[source] || source;
}
