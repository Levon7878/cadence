/** Centralized query-key factories for stable, collision-free cache keys. */
export const queryKeys = {
  session: ['session'] as const,
  organization: ['organization'] as const,
  workspaces: ['workspaces'] as const,

  projects: {
    all: ['projects'] as const,
    list: (params: object) => ['projects', 'list', params] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    tasks: (id: string, params: object) => ['projects', id, 'tasks', params] as const,
    activities: (id: string, params: object) => ['projects', id, 'activities', params] as const,
  },

  tasks: {
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },

  members: {
    all: ['members'] as const,
    list: (params: object) => ['members', 'list', params] as const,
    directory: ['members', 'directory'] as const,
  },

  activities: {
    list: (params: object) => ['activities', 'list', params] as const,
  },

  notifications: ['notifications'] as const,

  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    overview: (params: object) => ['analytics', 'overview', params] as const,
  },

  billing: {
    overview: ['billing', 'overview'] as const,
    plans: ['billing', 'plans'] as const,
    invoices: ['billing', 'invoices'] as const,
  },
} as const;

