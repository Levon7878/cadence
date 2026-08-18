import {
  LayoutDashboard,
  LineChart,
  FolderKanban,
  Users,
  UserCog,
  CreditCard,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/shared/lib/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Optional permission required to see this item. */
  permission?: Permission;
  /** Match nested routes (e.g. /projects/:id) for active state. */
  matchPrefix?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/analytics', label: 'Analytics', icon: LineChart, permission: 'analytics:view' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { to: '/projects', label: 'Projects', icon: FolderKanban, matchPrefix: true },
      { to: '/team', label: 'Team', icon: Users },
    ],
  },
  {
    label: 'Organization',
    items: [
      { to: '/members', label: 'Members', icon: UserCog, permission: 'member:invite' },
      { to: '/billing', label: 'Billing', icon: CreditCard, permission: 'billing:view' },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings', label: 'Settings', icon: Settings, matchPrefix: true },
    ],
  },
];
