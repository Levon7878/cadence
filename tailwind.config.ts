import type { Config } from 'tailwindcss';

/**
 * Semantic tokens map to CSS variables declared in `shared/styles/tokens.css`.
 * Colors are stored as HSL channels ("221 83% 53%") so Tailwind's
 * `<alpha-value>` mechanism works and light/dark themes swap by re-declaring
 * the variables — no duplicated color scales.
 */
const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        bg: withOpacity('--bg'),
        'bg-subtle': withOpacity('--bg-subtle'),
        'bg-muted': withOpacity('--bg-muted'),
        surface: withOpacity('--surface'),
        'surface-hover': withOpacity('--surface-hover'),
        border: withOpacity('--border'),
        'border-strong': withOpacity('--border-strong'),
        text: withOpacity('--text'),
        'text-muted': withOpacity('--text-muted'),
        'text-subtle': withOpacity('--text-subtle'),
        primary: withOpacity('--primary'),
        'primary-hover': withOpacity('--primary-hover'),
        'primary-fg': withOpacity('--primary-fg'),
        success: withOpacity('--success'),
        'success-fg': withOpacity('--success-fg'),
        warning: withOpacity('--warning'),
        'warning-fg': withOpacity('--warning-fg'),
        danger: withOpacity('--danger'),
        'danger-fg': withOpacity('--danger-fg'),
        info: withOpacity('--info'),
        'info-fg': withOpacity('--info-fg'),
        ring: withOpacity('--ring'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        md: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }],
        '3xl': ['2.125rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 hsl(var(--shadow) / 0.05)',
        sm: '0 1px 3px 0 hsl(var(--shadow) / 0.1), 0 1px 2px -1px hsl(var(--shadow) / 0.1)',
        md: '0 4px 6px -1px hsl(var(--shadow) / 0.1), 0 2px 4px -2px hsl(var(--shadow) / 0.1)',
        lg: '0 10px 15px -3px hsl(var(--shadow) / 0.12), 0 4px 6px -4px hsl(var(--shadow) / 0.1)',
        popover: '0 6px 24px -6px hsl(var(--shadow) / 0.22)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'scale-in': 'scale-in 120ms ease-out',
        'slide-in-right': 'slide-in-right 180ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
