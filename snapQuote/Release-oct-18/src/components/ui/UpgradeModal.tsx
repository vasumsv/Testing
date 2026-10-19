import { useState } from 'react';
import { Check, AlertTriangle, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { PLAN_LABELS, StudioPlan, BillingCycle } from '../../types';
import { PLANS, loadRazorpayScript, PaymentState, RazorpayOptions, RazorpayResponse } from '../../lib/razorpay';

interface Props {
  open: boolean;
  onClose: () => void;
  currentPlan: StudioPlan;
  onUpgradeSuccess?: (plan: StudioPlan, expiresAt: string | null) => void;
}

export function UpgradeModal({ open, onClose, currentPlan, onUpgradeSuccess }: Props) {
  const { profile } = useAuth();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [activatingPlan, setActivatingPlan] = useState<StudioPlan | null>(null);
  const [successPlan, setSuccessPlan] = useState<StudioPlan | null>(null);
  const [successExpiresAt, setSuccessExpiresAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleClose() {
    if (paymentState === 'creating' || paymentState === 'processing') return;
    setPaymentState('idle');
    setSuccessPlan(null);
    setSuccessExpiresAt(null);
    setErrorMsg(null);
    setActivatingPlan(null);
    onClose();
  }

  async function handleSelectPlan(plan: StudioPlan) {
    if (!profile?.studio_id) return;
    setPaymentState('creating');
    setActivatingPlan(plan);
    setErrorMsg(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Could not load payment SDK');

      const planConfig = PLANS.find(p => p.id === plan)!;
      const priceINR = cycle === 'monthly' ? planConfig.monthlyPrice : planConfig.annualPrice;
      const amountPaise = priceINR * 100;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, billing_cycle: cycle, amount_paise: amountPaise }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create order');
      }

      const { order_id, amount, currency, key_id } = await res.json();
      setPaymentState('processing');

      const options: RazorpayOptions = {
        key: key_id,
        amount,
        currency,
        name: 'SnapQuote',
        description: `${PLAN_LABELS[plan]} Plan – ${cycle === 'monthly' ? 'Monthly' : 'Annual'}`,
        order_id,
        prefill: {
          name: profile.full_name ?? '',
          email: profile.email ?? '',
        },
        theme: { color: '#2563EB' },
        handler: async (response: RazorpayResponse) => {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
            billing_cycle: cycle,
            amount_paise: amountPaise,
            token,
          });
        },
        modal: {
          ondismiss: () => {
            setPaymentState('idle');
            setActivatingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setActivatingPlan(null);
    }
  }

  async function verifyPayment(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: StudioPlan;
    billing_cycle: BillingCycle;
    amount_paise: number;
    token: string;
  }) {
    setPaymentState('processing');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/razorpay-verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: params.razorpay_order_id,
          razorpay_payment_id: params.razorpay_payment_id,
          razorpay_signature: params.razorpay_signature,
          plan: params.plan,
          billing_cycle: params.billing_cycle,
          amount_paise: params.amount_paise,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Payment verification failed');
      }

      const result = await res.json();
      const expiresAt: string | null = result.expires_at ?? null;
      setSuccessPlan(params.plan);
      setSuccessExpiresAt(expiresAt);
      setPaymentState('success');
      onUpgradeSuccess?.(params.plan, expiresAt);
    } catch (err) {
      setPaymentState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setActivatingPlan(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={paymentState === 'success' ? 'Plan Upgraded' : 'Upgrade Your Plan'}
      description={
        paymentState === 'success'
          ? undefined
          : 'Choose a plan that fits your studio and unlock more quotes.'
      }
      width="xl"
    >
      {paymentState === 'success' && successPlan ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1">
            Your plan has been upgraded successfully
          </h3>
          <p className="text-sm text-ink-muted mb-1">
            You are now on the <span className="font-semibold text-ink">{PLAN_LABELS[successPlan]}</span> plan.
          </p>
          {successExpiresAt && (
            <p className="text-xs text-ink-subtle mb-6">
              Valid until{' '}
              {new Date(successExpiresAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {!successExpiresAt && <div className="mb-6" />}
          <Button size="sm" onClick={handleClose}>Continue</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Currently on <span className="font-semibold text-ink">{PLAN_LABELS[currentPlan]}</span>
            </p>
            <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-lg p-0.5">
              <button
                onClick={() => setCycle('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  cycle === 'monthly'
                    ? 'bg-white text-ink shadow-sm border border-border'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle('annual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  cycle === 'annual'
                    ? 'bg-white text-ink shadow-sm border border-border'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Annual
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 py-px">
                  2 months free
                </span>
              </button>
            </div>
          </div>

          {paymentState === 'error' && errorMsg && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-600">{errorMsg}</p>
                <button
                  onClick={() => { setPaymentState('idle'); setErrorMsg(null); }}
                  className="text-xs text-red-500 underline underline-offset-2 mt-1 hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => {
              const price = cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
              const isCurrentPlan = currentPlan === plan.id;
              const isLoading = activatingPlan === plan.id && (paymentState === 'creating' || paymentState === 'processing');
              const isBusy = paymentState === 'creating' || paymentState === 'processing';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-4 flex flex-col transition-all ${
                    isCurrentPlan
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : plan.highlight
                        ? 'border-primary-600 shadow-md shadow-primary-600/10 bg-white'
                        : 'border-border bg-white hover:border-slate-300'
                  }`}
                >
                  {plan.highlight && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm">
                        <Zap className="w-2.5 h-2.5" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-3">
                    <span className="text-sm font-semibold text-ink">{plan.label}</span>
                  </div>

                  <div className="mb-1">
                    <span className="text-xl font-bold text-ink">{formatCurrency(price)}</span>
                    <span className="text-xs text-ink-muted ml-1">
                      / {cycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  <p className="text-xs text-ink-muted mb-3">
                    {plan.limit ? `${plan.limit} quotes/month` : 'Unlimited quotes'}
                  </p>

                  <ul className="space-y-1.5 mb-4 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-ink-muted">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <div className="w-full text-center py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      disabled={isBusy}
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        plan.highlight
                          ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm disabled:opacity-50'
                          : 'border border-border text-ink hover:bg-surface-raised disabled:opacity-50'
                      }`}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Processing…</>
                      ) : (
                        <>Upgrade to {plan.label}</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
