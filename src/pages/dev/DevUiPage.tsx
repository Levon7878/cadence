import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import {
  Alert, Badge, Button, Card, CardBody, Checkbox, Dialog, EmptyState, Field,
  Input, Progress, Select, Skeleton, Spinner, Switch, Tabs, Textarea, Tooltip,
} from '@/shared/ui';
import { toast } from '@/shared/ui/toast';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-text">{title}</h2>
      <Card><CardBody className="flex flex-wrap items-center gap-3">{children}</CardBody></Card>
    </section>
  );
}

const TOKENS = ['bg', 'surface', 'border', 'primary', 'success', 'warning', 'danger', 'info'];

export default function DevUiPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState('one');

  return (
    <PageContainer>
      <PageHeader title="UI Gallery" description="Development-only showcase of the design system." />

      <Section title="Typography">
        <div className="space-y-1">
          <p className="text-3xl font-bold text-text">Display 3xl</p>
          <p className="text-2xl font-semibold text-text">Heading 2xl</p>
          <p className="text-lg text-text">Large 18</p>
          <p className="text-base text-text">Body base 14</p>
          <p className="text-sm text-text-muted">Small muted 13</p>
          <p className="text-xs text-text-subtle">Extra small 12</p>
        </div>
      </Section>

      <Section title="Color tokens">
        {TOKENS.map((token) => (
          <div key={token} className="flex flex-col items-center gap-1">
            <div className="size-12 rounded-lg border border-border" style={{ background: `hsl(var(--${token}))` }} />
            <span className="text-xs text-text-muted">{token}</span>
          </div>
        ))}
      </Section>

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Badges">
        <Badge>Neutral</Badge>
        <Badge tone="primary">Primary</Badge>
        <Badge tone="success" dot>Success</Badge>
        <Badge tone="warning" dot>Warning</Badge>
        <Badge tone="danger" dot>Danger</Badge>
        <Badge tone="info">Info</Badge>
      </Section>

      <Section title="Form controls">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Field label="Input" description="With helper text"><Input placeholder="Type here…" /></Field>
          <Field label="Invalid input" error="This field is required"><Input defaultValue="oops" /></Field>
          <Field label="Select"><Select options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} /></Field>
          <Field label="Textarea"><Textarea placeholder="Multiple lines…" /></Field>
          <div className="flex items-center gap-6"><Checkbox label="Checkbox" defaultChecked /><Switch label="Switch" defaultChecked /></div>
        </div>
      </Section>

      <Section title="Feedback">
        <div className="grid w-full gap-3">
          <Alert tone="info" title="Info">An informational message.</Alert>
          <Alert tone="success" title="Success">Everything worked.</Alert>
          <Alert tone="warning" title="Warning">Careful now.</Alert>
          <Alert tone="danger" title="Danger">Something failed.</Alert>
        </div>
      </Section>

      <Section title="Overlays & misc">
        <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
        <Button variant="outline" onClick={() => toast.success('Saved', 'Your changes were saved.')}>Trigger toast</Button>
        <Tooltip content="Helpful hint"><Button variant="ghost">Hover me</Button></Tooltip>
        <Spinner />
      </Section>

      <Section title="Progress & skeleton">
        <div className="grid w-full max-w-md gap-3">
          <Progress value={30} />
          <Progress value={70} tone="warning" />
          <Progress value={95} tone="danger" />
          <Skeleton className="h-6 w-full" />
        </div>
      </Section>

      <div className="mt-6">
        <Tabs items={[{ value: 'one', label: 'Tab one' }, { value: 'two', label: 'Tab two' }, { value: 'three', label: 'Tab three' }]} value={tab} onChange={setTab} />
        <div className="p-4 text-base text-text-muted">Active tab: {tab}</div>
      </div>

      <Section title="Empty state">
        <div className="w-full">
          <EmptyState icon={Sparkles} title="Nothing here yet" description="This is what an empty state looks like." action={<Button size="sm">Take action</Button>} />
        </div>
      </Section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Example dialog" description="An accessible modal dialog."
        footer={<><Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Confirm</Button></>}>
        <p className="text-base text-text-muted">Dialog content goes here. Focus is trapped and Escape closes it.</p>
      </Dialog>
    </PageContainer>
  );
}
