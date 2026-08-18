import { useForm } from 'react-hook-form';
import { Button, Card, CardBody, CardHeader, Field, Input, Select } from '@/shared/ui';
import { toast } from '@/shared/ui/toast';
import { useOrganizationQuery } from '@/entities/workspace';

interface Values {
  name: string;
  defaultRole: string;
  timezone: string;
}

export default function OrganizationSettings() {
  const { data: org } = useOrganizationQuery();
  const { register, handleSubmit } = useForm<Values>({
    values: { name: org?.name ?? '', defaultRole: 'member', timezone: 'Europe/Berlin' },
  });

  const onSubmit = handleSubmit(() => toast.success('Organization settings saved'));

  return (
    <Card>
      <CardHeader title="Organization" description="General settings and workspace defaults." />
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Organization name">
            <Input {...register('name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default role for new members" description="Applied when inviting members.">
              <Select options={[{ value: 'member', label: 'Member' }, { value: 'viewer', label: 'Viewer' }, { value: 'manager', label: 'Manager' }]} {...register('defaultRole')} />
            </Field>
            <Field label="Default timezone">
              <Select options={[{ value: 'Europe/Berlin', label: 'Europe/Berlin' }, { value: 'America/New_York', label: 'America/New_York' }, { value: 'Asia/Tokyo', label: 'Asia/Tokyo' }]} {...register('timezone')} />
            </Field>
          </div>
          <div><Button type="submit">Save settings</Button></div>
        </form>
      </CardBody>
    </Card>
  );
}
