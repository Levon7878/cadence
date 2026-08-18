type ClassValue = string | number | bigint | null | false | undefined | ClassValue[];

/**
 * Tiny class-name combiner. A dedicated dependency (clsx/tailwind-merge) is not
 * justified for this project's needs — later classes are expected to be written
 * intentionally, and this keeps the dependency surface minimal.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(' ');
}
