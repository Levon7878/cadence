export type NotificationKind = 'mention' | 'assignment' | 'risk' | 'deadline' | 'billing' | 'system';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  /** In-app link to the source entity. */
  href?: string;
  createdAt: string;
}
