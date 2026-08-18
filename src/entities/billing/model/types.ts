export type PlanId = 'starter' | 'growth' | 'scale';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type InvoiceStatus = 'paid' | 'open' | 'void';

export interface Plan {
  id: PlanId;
  name: string;
  pricePerMonth: number;
  description: string;
  seatLimit: number;
  projectLimit: number;
  features: string[];
}

export interface UsageMetric {
  label: string;
  used: number;
  limit: number;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
}

export interface Subscription {
  planId: PlanId;
  status: SubscriptionStatus;
  seats: number;
  renewsAt: string;
  amountDue: number;
}

export interface BillingOverview {
  subscription: Subscription;
  paymentMethod?: PaymentMethod;
  usage: UsageMetric[];
}
