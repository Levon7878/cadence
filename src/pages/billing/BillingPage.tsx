import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Check, CreditCard, Download } from 'lucide-react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { Badge, Button, Card, CardHeader, DataTable, Dialog, Field, Input, Progress, Select, Skeleton, type Column } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { toast } from '@/shared/ui/toast';
import { Can } from '@/features/rbac';
import {
  useBillingOverviewQuery,
  usePlansQuery,
  useInvoicesQuery,
  useChangePlan,
  useUpdatePaymentMethod,
  type Invoice,
  type PlanId,
} from '@/entities/billing';

const cardSchema = z.object({
  brand: z.string().min(1),
  last4: z.string().regex(/^\d{4}$/, 'Enter the last 4 digits'),
  expMonth: z.coerce.number().min(1).max(12),
  expYear: z.coerce.number().min(2026).max(2040),
});
type CardForm = z.input<typeof cardSchema>;

function PaymentMethodDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const update = useUpdatePaymentMethod();
  const { register, handleSubmit, formState: { errors } } = useForm<CardForm>({
    defaultValues: { brand: 'Visa', last4: '', expMonth: 12, expYear: 2028 },
  });
  const onSubmit = handleSubmit(async (values) => {
    const parsed = cardSchema.safeParse(values);
    if (!parsed.success) return;
    await update.mutateAsync(parsed.data);
    onClose();
  });
  return (
    <Dialog open={open} onClose={onClose} title="Update payment method" size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={onSubmit} loading={update.isPending}>Save card</Button></>}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Card brand"><Select options={[{ value: 'Visa', label: 'Visa' }, { value: 'Mastercard', label: 'Mastercard' }, { value: 'Amex', label: 'Amex' }]} {...register('brand')} /></Field>
        <Field label="Last 4 digits" error={errors.last4?.message} required><Input inputMode="numeric" maxLength={4} placeholder="4242" {...register('last4')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Exp. month"><Input type="number" min={1} max={12} {...register('expMonth')} /></Field>
          <Field label="Exp. year"><Input type="number" min={2026} max={2040} {...register('expYear')} /></Field>
        </div>
      </form>
    </Dialog>
  );
}

export default function BillingPage() {
  const { data: overview, isLoading } = useBillingOverviewQuery();
  const { data: plans } = usePlansQuery();
  const { data: invoices, isLoading: invoicesLoading } = useInvoicesQuery();
  const changePlan = useChangePlan();
  const [cardOpen, setCardOpen] = useState(false);

  const invoiceColumns: Column<Invoice>[] = [
    { id: 'number', header: 'Invoice', cell: (i) => <span className="font-medium text-text">{i.number}</span> },
    { id: 'date', header: 'Date', cell: (i) => <span className="text-text-muted">{formatDate(i.date)}</span> },
    { id: 'amount', header: 'Amount', align: 'right', cell: (i) => <span className="tabular-nums">{formatCurrency(i.amount)}</span> },
    { id: 'status', header: 'Status', cell: (i) => <Badge tone={i.status === 'paid' ? 'success' : i.status === 'open' ? 'warning' : 'neutral'}>{i.status}</Badge> },
    { id: 'download', header: '', hideable: false, align: 'right', cell: () => <Button size="sm" variant="ghost" leftIcon={<Download className="size-4" />} onClick={() => toast.info('Invoice download', 'In a real app this would download a PDF.')}>PDF</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Billing" description="Manage your subscription, usage and invoices." />

      {isLoading || !overview ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3"><Skeleton className="h-40 lg:col-span-2" /><Skeleton className="h-40" /></div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Subscription"
              action={<Badge tone={overview.subscription.status === 'active' ? 'success' : 'warning'} dot>{overview.subscription.status}</Badge>}
            />
            <div className="p-4">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xl font-semibold capitalize text-text">{overview.subscription.planId}</span>
                <span className="text-base text-text-muted">· renews {formatDate(overview.subscription.renewsAt)}</span>
              </div>
              <p className="mt-1 text-base text-text-muted">{overview.subscription.seats} seats · {formatCurrency(overview.subscription.amountDue)} due</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {overview.usage.map((u) => (
                  <div key={u.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-text-muted">{u.label}</span>
                      <span className="tabular-nums text-text">{u.used} / {u.limit}</span>
                    </div>
                    <Progress value={(u.used / u.limit) * 100} tone={u.used / u.limit > 0.85 ? 'warning' : 'primary'} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment method" />
            <div className="p-4">
              {overview.paymentMethod ? (
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <CreditCard className="size-5 text-text-muted" aria-hidden />
                  <div>
                    <p className="text-base font-medium text-text">{overview.paymentMethod.brand} •••• {overview.paymentMethod.last4}</p>
                    <p className="text-sm text-text-muted">Expires {overview.paymentMethod.expMonth}/{overview.paymentMethod.expYear}</p>
                  </div>
                </div>
              ) : (
                <p className="text-base text-text-muted">No payment method on file.</p>
              )}
              <Can action="billing:manage" fallback={<p className="mt-3 text-sm text-text-subtle">Only the owner can manage billing.</p>}>
                <Button variant="outline" className="mt-3" fullWidth onClick={() => setCardOpen(true)}>Update payment method</Button>
              </Can>
            </div>
          </Card>
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-text">Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(plans ?? []).map((plan) => {
            const current = overview?.subscription.planId === plan.id;
            return (
              <Card key={plan.id} className={cn('flex flex-col p-5', current && 'border-primary ring-1 ring-primary')}>
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-semibold text-text">{plan.name}</h3>
                  {current && <Badge tone="primary">Current</Badge>}
                </div>
                <p className="mt-2 text-2xl font-semibold text-text">{formatCurrency(plan.pricePerMonth)}<span className="text-base font-normal text-text-muted">/mo</span></p>
                <p className="mt-1 text-sm text-text-muted">{plan.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-base text-text-muted"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{f}</li>
                  ))}
                </ul>
                <Can action="billing:manage" fallback={<Button className="mt-4" variant="outline" disabled fullWidth>{current ? 'Current plan' : 'Owner only'}</Button>}>
                  <Button className="mt-4" variant={current ? 'outline' : 'primary'} fullWidth disabled={current || changePlan.isPending} onClick={() => changePlan.mutate(plan.id as PlanId)}>
                    {current ? 'Current plan' : `Switch to ${plan.name}`}
                  </Button>
                </Can>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-text">Invoices</h2>
        <DataTable columns={invoiceColumns} rows={invoices ?? []} getRowId={(i) => i.id} loading={invoicesLoading} caption="Invoices" />
      </section>

      <PaymentMethodDialog open={cardOpen} onClose={() => setCardOpen(false)} />
    </PageContainer>
  );
}
