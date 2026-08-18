import { Monitor, Moon, Sun } from 'lucide-react';
import { DropdownMenu, IconButton } from '@/shared/ui';
import { useThemeStore, type ThemeMode } from '@/shared/lib/stores/theme-store';

const ICON: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const Icon = ICON[mode];

  return (
    <DropdownMenu
      align="end"
      trigger={(props) => (
        <IconButton label="Change theme" size="sm" className="xs:size-9" {...props}>
          <Icon className="size-[18px]" />
        </IconButton>
      )}
      items={[
        { label: 'Light', icon: <Sun />, onSelect: () => setMode('light') },
        { label: 'Dark', icon: <Moon />, onSelect: () => setMode('dark') },
        { label: 'System', icon: <Monitor />, onSelect: () => setMode('system') },
      ]}
    />
  );
}
