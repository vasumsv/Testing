import { PLAN_LIMITS, StudioPlan } from '../types';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface PlanConfig {
  id: StudioPlan;
  label: string;
  monthlyPrice: number;
  annualPrice: number;
  limit: number | null;
  features: string[];
  highlight: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'business',
    label: 'SnapQuote Business',
    monthlyPrice: 699,
    annualPrice: 6990,
    limit: null,
    features: [
      'Unlimited quotations',
      'All professional templates & themes',
      'Custom branding & logo',
      'Custom quotation background',
      'CRM — Leads management',
      'Package templates & deliverables',
      'Discount display in quotes',
      'PDF generation & WhatsApp sharing',
      'Invoices & payments',
      'Advanced analytics',
      'Quotation tracking & follow-ups',
    ],
    highlight: true,
  },
];

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type PaymentState = 'idle' | 'creating' | 'processing' | 'success' | 'error';
