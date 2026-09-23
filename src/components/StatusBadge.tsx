import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Standardized Status Badge — design system component.
 * ALL status indicators across the application MUST use this component.
 *
 * Two visual styles:
 *   - "filled" (risk levels): solid background, white text
 *   - "subtle" (everything else): tinted background, colored text, colored border
 */

type StatusType =
  | 'draft' | 'submitted' | 'under-review' | 'approved' | 'in-development' | 'deployed' | 'rejected'
  | 'running' | 'completed' | 'failed' | 'queued' | 'archived'
  | 'ready' | 'deploying' | 'rollback-required'
  | 'low' | 'medium' | 'high' | 'critical'
  | 'healthy' | 'has-blockers'
  | 'reused' | 'net-new'
  | 'promoted'
  | 'development' | 'staging' | 'production'
  | 'pending' | 'active' | 'inactive'
  | 'structured' | 'unstructured' | 'streaming';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

/*
 * Color palette mapping — every status uses ONE of four semantic colors:
 *   green  = success / healthy / low risk / completed / approved
 *   amber  = warning / medium risk / running / under review / staging
 *   red    = error / high risk / failed / rejected
 *   blue   = info / submitted / development / streaming
 *   neutral = draft / queued / inactive / archived
 *
 * "filled" entries get solid bg + white text (risk levels only).
 * Everything else gets tinted bg + colored border + colored text ("subtle").
 */
type ColorSemantic = 'green' | 'amber' | 'red' | 'blue' | 'neutral';
type StyleVariant = 'filled' | 'subtle';

const statusMapping: Record<string, { color: ColorSemantic; variant?: StyleVariant }> = {
  // Use-case workflow
  draft:            { color: 'neutral' },
  submitted:        { color: 'blue' },
  'under-review':   { color: 'amber' },
  approved:         { color: 'green' },
  'in-development': { color: 'amber' },
  deployed:         { color: 'green' },
  rejected:         { color: 'red' },

  // Experiments
  running:   { color: 'amber' },
  completed: { color: 'green' },
  failed:    { color: 'red' },
  queued:    { color: 'neutral' },
  archived:  { color: 'neutral' },

  // Deployment
  ready:              { color: 'blue' },
  deploying:          { color: 'amber' },
  'rollback-required': { color: 'red' },

  // Risk levels — filled style
  low:      { color: 'green',  variant: 'filled' },
  medium:   { color: 'amber',  variant: 'filled' },
  high:     { color: 'red',    variant: 'filled' },
  critical: { color: 'red',    variant: 'filled' },

  // Pod health
  healthy:       { color: 'green' },
  'has-blockers': { color: 'red' },

  // Component types
  reused:    { color: 'green' },
  'net-new': { color: 'amber' },

  // Version
  promoted: { color: 'green' },

  // Environments
  development: { color: 'blue' },
  staging:     { color: 'amber' },
  production:  { color: 'green' },

  // Data source types
  structured:   { color: 'green' },
  unstructured: { color: 'amber' },
  streaming:    { color: 'blue' },

  // Generic
  pending:  { color: 'amber' },
  active:   { color: 'green' },
  inactive: { color: 'neutral' },
};

const colorStyles: Record<ColorSemantic, { subtle: string; filled: string }> = {
  green: {
    subtle: 'bg-accent-green/10 text-accent-green border border-accent-green/30',
    filled: 'bg-accent-green text-accent-foreground border border-accent-green',
  },
  amber: {
    subtle: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30',
    filled: 'bg-accent-amber text-accent-foreground border border-accent-amber',
  },
  red: {
    subtle: 'bg-shell-red/10 text-shell-red border border-shell-red/30',
    filled: 'bg-shell-red text-accent-foreground border border-shell-red',
  },
  blue: {
    subtle: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30',
    filled: 'bg-accent-blue text-accent-foreground border border-accent-blue',
  },
  neutral: {
    subtle: 'bg-muted text-muted-foreground border border-border-subtle',
    filled: 'bg-muted text-muted-foreground border border-border-subtle',
  },
};

const defaultMapping = { color: 'neutral' as ColorSemantic };

function formatStatusLabel(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const mapping: { color: ColorSemantic; variant?: StyleVariant } = statusMapping[key] || defaultMapping;
  const variant: StyleVariant = mapping.variant || 'subtle';
  const styles = colorStyles[mapping.color][variant];
  const displayLabel = label || formatStatusLabel(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1',
        'text-[11px] font-semibold uppercase tracking-wide leading-none',
        'transition-colors',
        styles,
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}

export { statusMapping, formatStatusLabel };
export type { StatusType };
