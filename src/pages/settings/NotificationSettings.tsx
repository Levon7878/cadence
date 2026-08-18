import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Switch } from '@/shared/ui';
import { toast } from '@/shared/ui/toast';

interface Prefs {
  email: boolean;
  product: boolean;
  projectAlerts: boolean;
  teamAlerts: boolean;
}

const ROWS: { key: keyof Prefs; label: string; description: string }[] = [
  { key: 'email', label: 'Email notifications', description: 'Receive important updates by email.' },
  { key: 'product', label: 'Product updates', description: 'News about features and improvements.' },
  { key: 'projectAlerts', label: 'Project alerts', description: 'When a project you own becomes at risk.' },
  { key: 'teamAlerts', label: 'Team alerts', description: 'When a team member becomes over-allocated.' },
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<Prefs>({ email: true, product: false, projectAlerts: true, teamAlerts: true });

  return (
    <Card>
      <CardHeader title="Notifications" description="Choose what you want to be notified about." />
      <CardBody>
        <div className="divide-y divide-border">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
              <div>
                <p className="text-base font-medium text-text">{row.label}</p>
                <p className="text-sm text-text-muted">{row.description}</p>
              </div>
              <Switch
                aria-label={row.label}
                checked={prefs[row.key]}
                onChange={(e) => setPrefs((p) => ({ ...p, [row.key]: e.target.checked }))}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={() => toast.success('Preferences saved')}>Save preferences</Button>
        </div>
      </CardBody>
    </Card>
  );
}
