import { Check, Minus } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/shared/ui';
import { ALL_PERMISSIONS, ROLES, ROLE_META, roleHas } from '@/shared/lib/permissions';

export default function PermissionsSettings() {
  return (
    <Card>
      <CardHeader title="Role permissions" description="A read-only overview of what each role can do." />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <caption className="sr-only">Permission matrix by role</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-2 py-2 text-left text-sm font-semibold text-text-muted">Permission</th>
                {ROLES.map((role) => (
                  <th key={role} scope="col" className="px-2 py-2 text-center text-sm font-semibold text-text-muted">{ROLE_META[role].label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((permission) => (
                <tr key={permission} className="border-b border-border last:border-0">
                  <th scope="row" className="whitespace-nowrap px-2 py-2 text-left font-normal text-text">{permission}</th>
                  {ROLES.map((role) => (
                    <td key={role} className="px-2 py-2 text-center">
                      {roleHas(role, permission) ? (
                        <Check className="mx-auto size-4 text-success" aria-label="Allowed" />
                      ) : (
                        <Minus className="mx-auto size-4 text-text-subtle" aria-label="Not allowed" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
