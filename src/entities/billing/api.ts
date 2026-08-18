import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, isApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { toast } from '@/shared/ui/toast';
import type { BillingOverview, Invoice, PaymentMethod, Plan, PlanId } from './model/types';

export async function fetchBillingOverview(): Promise<BillingOverview> {
  const { data } = await apiClient.get('/billing/overview');
  return data as BillingOverview;
}

export async function fetchPlans(): Promise<Plan[]> {
  const { data } = await apiClient.get('/billing/plans');
  return data as Plan[];
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data } = await apiClient.get('/billing/invoices');
  return data as Invoice[];
}

export function useBillingOverviewQuery() {
  return useQuery({ queryKey: queryKeys.billing.overview, queryFn: fetchBillingOverview });
}

export function usePlansQuery() {
  return useQuery({ queryKey: queryKeys.billing.plans, queryFn: fetchPlans, staleTime: 10 * 60_000 });
}

export function useInvoicesQuery() {
  return useQuery({ queryKey: queryKeys.billing.invoices, queryFn: fetchInvoices });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PaymentMethod) => apiClient.put('/billing/payment-method', body),
    onSuccess: () => {
      toast.success('Payment method updated');
      qc.invalidateQueries({ queryKey: queryKeys.billing.overview });
    },
    onError: (error) => toast.error('Could not update payment method', isApiError(error) ? error.message : undefined),
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: PlanId) => apiClient.post('/billing/subscription', { planId }),
    onSuccess: () => {
      toast.success('Plan updated');
      qc.invalidateQueries({ queryKey: queryKeys.billing.overview });
    },
    onError: (error) => toast.error('Could not change plan', isApiError(error) ? error.message : undefined),
  });
}
