export type UserRole = 'studio_owner' | 'admin' | 'staff';

export type LeadStatus = 'new' | 'quote_sent' | 'follow_up' | 'booked';
export type LeadSource = 'direct' | 'referral' | 'instagram' | 'website' | 'google' | 'other';

export type QuoteStatus = 'draft' | 'sent' | 'follow_up_pending' | 'interested' | 'accepted' | 'invoice_created' | 'paid' | 'rejected' | 'expired';

export type StudioPlan = 'trial' | 'starter' | 'growth' | 'pro' | 'business';
export type StudioStatus = 'active' | 'suspended' | 'cancelled';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';
export type BillingCycle = 'monthly' | 'annual';

export const TRIAL_LIMIT = 10;
export const FREE_LIMIT = 10;

export const PLAN_LIMITS: Record<StudioPlan, number | null> = {
  trial: TRIAL_LIMIT,
  starter: 30,
  growth: 100,
  pro: null,
  business: null,
};

export const PLAN_LABELS: Record<StudioPlan, string> = {
  trial: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  business: 'SnapQuote Business',
};

export const PLAN_PRICES: Record<'business', { monthly: number; annual: number }> = {
  business: { monthly: 699, annual: 6990 },
};

export const LEGACY_PLANS: StudioPlan[] = ['starter', 'growth', 'pro'];

export function isBusinessPlan(plan: StudioPlan | string | undefined | null): boolean {
  if (!plan) return false;
  if (plan === 'business') return true;
  return LEGACY_PLANS.includes(plan as StudioPlan);
}

export function isFreePlan(plan: StudioPlan | string | undefined | null): boolean {
  return plan === 'trial' || plan === 'free';
}

export interface Profile {
  id: string;
  studio_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Studio {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
  owner_name: string;
  website: string;
  gst_number: string;
  plan: StudioPlan;
  status: StudioStatus;
  is_active: boolean;
  subscription_expires_at: string | null;
  quotes_this_month: number;
  quotes_reset_at: string;
  whatsapp_api_key: string | null;
  whatsapp_business_number: string | null;
  whatsapp_followup_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudioQuota {
  studio_id: string;
  plan: StudioPlan;
  is_active: boolean;
  status: StudioStatus;
  subscription_expires_at: string | null;
  quotes_this_month: number;
  quotes_reset_at: string;
  monthly_limit: number | null;
  limit_reached: boolean;
  near_limit: boolean;
}

export interface Lead {
  id: string;
  studio_id: string;
  full_name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string | null;
  location: string;
  budget: number | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory = 'photography' | 'videography' | 'addon';

export interface Service {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  includes?: string[];
  deliverables?: string[];
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  studio_id: string;
  full_name: string;
  phone: string;
  email: string;
  event_type: string;
  event_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  followup_count: number;
  last_followup_at: string | null;
  last_followup_result: string | null;
  client_response: string | null;
  client_response_at: string | null;
  client_response_quote_id: string | null;
}

export interface Quote {
  id: string;
  studio_id: string;
  lead_id: string | null;
  client_id: string | null;
  quote_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  amount: number;
  status: QuoteStatus;
  valid_until: string | null;
  notes: string;
  follow_up_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  studio_id: string;
  plan: StudioPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  amount: number;
  current_period_start: string;
  current_period_end: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
