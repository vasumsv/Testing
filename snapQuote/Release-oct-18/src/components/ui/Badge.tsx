import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  danger: 'bg-red-50 text-red-700 border border-red-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  info: 'bg-blue-50 text-blue-700 border border-blue-100',
  neutral: 'bg-slate-50 text-slate-500 border border-slate-200',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  quote_sent: 'Quote Sent',
  follow_up: 'Follow-up',
  booked: 'Booked',
};

export function leadStatusBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    new: 'info',
    quote_sent: 'warning',
    follow_up: 'default',
    booked: 'success',
  };
  const label = LEAD_STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={map[status] ?? 'neutral'}>{label}</Badge>;
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  follow_up_pending: 'Follow-up',
  interested: 'Interested',
  accepted: 'Accepted',
  invoice_created: 'Invoiced',
  paid: 'Paid',
  rejected: 'Rejected',
  expired: 'Expired',
};

export function quoteStatusBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    draft: 'neutral',
    sent: 'info',
    follow_up_pending: 'warning',
    interested: 'success',
    accepted: 'success',
    invoice_created: 'info',
    paid: 'success',
    rejected: 'danger',
    expired: 'warning',
  };
  const label = QUOTE_STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={map[status] ?? 'neutral'}>{label}</Badge>;
}

export function isHotLead(status: string) {
  return status === 'interested';
}

export function studioStatusBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    suspended: 'warning',
    cancelled: 'danger',
  };
  return <Badge variant={map[status] ?? 'neutral'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

export function planBadge(plan: string) {
  const map: Record<string, BadgeVariant> = {
    trial: 'neutral',
    business: 'success',
    starter: 'neutral',
    growth: 'default',
    pro: 'success',
  };
  const labels: Record<string, string> = {
    trial: 'Free',
    business: 'Business',
  };
  return <Badge variant={map[plan] ?? 'neutral'}>{labels[plan] ?? plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge>;
}
