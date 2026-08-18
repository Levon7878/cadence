import type { Activity } from './types';

/** Turns an immutable activity event into a human-readable sentence fragment. */
export function describeActivity(activity: Activity): string {
  const { action, entityLabel, metadata } = activity;
  switch (action) {
    case 'task.status_changed':
      return `changed status of "${entityLabel}"${metadata?.to ? ` to ${metadata.to.replace('_', ' ')}` : ''}`;
    case 'task.reassigned':
      return `reassigned "${entityLabel}"${metadata?.to ? ` to ${metadata.to}` : ''}`;
    case 'task.created':
      return `created task "${entityLabel}"`;
    case 'project.created':
      return `created project ${entityLabel}`;
    case 'project.budget_updated':
      return `updated the budget for ${entityLabel}`;
    case 'member.invited':
      return `invited ${entityLabel}${metadata?.role ? ` as ${metadata.role}` : ''}`;
    case 'member.role_changed':
      return `changed ${entityLabel}'s role${metadata?.to ? ` to ${metadata.to}` : ''}`;
    case 'invoice.paid':
      return `paid an invoice`;
    case 'settings.updated':
      return `updated ${entityLabel.toLowerCase()}`;
    default:
      return `updated ${entityLabel}`;
  }
}
