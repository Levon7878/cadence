import { Monitor, Moon, Sun } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useThemeStore, type ThemeMode } from '@/shared/lib/stores/theme-store';

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function AppearanceSettings() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <Card>
      <CardHeader title="Appearance" description="Customize how Cadence looks on this device." />
      <CardBody>
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-text">Theme</legend>
          <div className="grid grid-cols-3 gap-3">
            {OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                  mode === option.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-border-strong',
                )}
              >
                <input type="radio" name="theme" value={option.value} checked={mode === option.value} onChange={() => setMode(option.value)} className="sr-only" />
                <option.icon className={cn('size-5', mode === option.value ? 'text-primary' : 'text-text-muted')} aria-hidden />
                <span className="text-base font-medium text-text">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </CardBody>
    </Card>
  );
}
