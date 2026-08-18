export interface Workspace {
  id: string;
  name: string;
  key: string;
  clientId?: string;
  projectCount: number;
  memberCount: number;
}

export type ClientHealth = 'healthy' | 'watch' | 'at_risk';

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  health: ClientHealth;
}

export interface Organization {
  id: string;
  name: string;
  memberCount: number;
  workspaceCount: number;
}
