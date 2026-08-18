import { createContext, useContext, useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface FieldContextValue {
  id: string;
  descriptionId?: string;
  errorId?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Provides accessible label/description/error wiring for a single control. */
export function Field({
  label,
  description,
  error,
  required,
  className,
  children,
}: {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <FieldContext.Provider value={{ id, descriptionId, errorId, invalid: Boolean(error) }}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text">
            {label}
            {required && (
              <span className="ml-0.5 text-danger" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        {description && (
          <p id={descriptionId} className="text-sm text-text-muted">
            {description}
          </p>
        )}
        {children}
        {error && (
          <p id={errorId} role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

/** Controls consume this to inherit id + aria wiring from the surrounding Field. */
export function useFieldProps() {
  const ctx = useContext(FieldContext);
  if (!ctx) return {};
  const describedBy = [ctx.descriptionId, ctx.errorId].filter(Boolean).join(' ') || undefined;
  return {
    id: ctx.id,
    'aria-invalid': ctx.invalid || undefined,
    'aria-describedby': describedBy,
  };
}
