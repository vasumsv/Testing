import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Footer } from '../components/layout/Footer';

const FREE_FEATURES = [
  'Up to 10 quotations',
  '3 basic themes',
  'PDF download',
  'WhatsApp sharing',
  'Studio branding (logo + details)',
];

const BUSINESS_FEATURES = [
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
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time from your account settings. Your plan stays active until the end of the current billing period — no questions asked.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. Every account starts on the Free plan — no credit card required. Upgrade to SnapQuote Business anytime to unlock the full professional experience.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'No credit card is required to start on Free. You only need to add payment details when you upgrade to SnapQuote Business.',
  },
  {
    q: 'What happens when my Business subscription expires?',
    a: 'Your account automatically moves back to the Free plan. All your quotes, customers, and data remain intact — you just lose the premium features until you renew.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-slate-200 rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-sm cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-[0.9375rem] font-medium text-slate-800">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </div>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export function Pricing() {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  const businessPrice = yearly ? 6990 : 699;
  const annualSaving = 699 * 12 - 6990;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter',system-ui,sans-serif]">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img
              src="https://raw.githubusercontent.com/vasumsv/Testing/refs/heads/main/snapQuote/snapquote%20logo%20new.png"
              alt="SnapQuote"
              className="h-8 w-auto object-contain"
            />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-12 px-6 text-center">
        <h1 className="text-[2.25rem] font-bold text-slate-900 tracking-tight leading-tight max-w-xl mx-auto">
          Simple pricing for photography studios
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
          Close more clients with instant, professional quotations
        </p>

        <div className="mt-10 inline-flex items-center gap-0 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setYearly(false)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              !yearly
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              yearly
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Annual
            <span className="text-[0.6875rem] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 leading-tight">
              Save ₹{annualSaving.toLocaleString('en-IN')}
            </span>
          </button>
        </div>

        {yearly && (
          <p className="mt-4 text-sm text-emerald-600 font-medium">
            Save ₹{annualSaving.toLocaleString('en-IN')} with annual billing
          </p>
        )}
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 items-start">
          {/* Free Plan */}
          <div className="bg-white border border-slate-200 rounded-[10px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="p-8">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Free
              </p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-[0.9375rem] font-medium text-slate-500">₹</span>
                <span className="text-[2.75rem] font-bold text-slate-900 leading-none tracking-tight">
                  0
                </span>
                <span className="text-slate-400 text-sm mb-1.5">/forever</span>
              </div>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                For users getting started with SnapQuote.
              </p>

              <button
                onClick={() => navigate('/signup')}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 mb-8 bg-slate-900 hover:bg-slate-700 text-white"
              >
                Get started for free
              </button>

              <ul className="space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-slate-100">
                      <Check className="w-2.5 h-2.5 text-slate-500" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm text-slate-600 leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SnapQuote Business Plan */}
          <div className="relative bg-white border-2 border-[#2563EB] rounded-[10px] shadow-[0_8px_40px_rgba(37,99,235,0.12)] scale-100 md:scale-[1.015] z-10 transition-all duration-300">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-[#2563EB] text-white text-[0.6875rem] font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
                Recommended
              </span>
            </div>

            <div className="p-8">
              <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-widest mb-3">
                SnapQuote Business
              </p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-[0.9375rem] font-medium text-slate-500">₹</span>
                <span className="text-[2.75rem] font-bold text-slate-900 leading-none tracking-tight">
                  {businessPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-400 text-sm mb-1.5">/{yearly ? 'year' : 'mo'}</span>
              </div>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Everything you need to create, send, track and manage professional quotations.
              </p>

              <button
                onClick={() => navigate('/signup')}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 mb-8 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm hover:shadow-md"
              >
                Upgrade to Business
              </button>

              <ul className="space-y-3">
                {BUSINESS_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#EFF6FF]">
                      <Check className="w-2.5 h-2.5 text-[#2563EB]" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm text-slate-600 leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[1.25rem] font-semibold text-slate-800 leading-snug">
            Close just 1 extra booking and recover 10x your subscription cost
          </p>
          <p className="mt-3 text-sm text-slate-500">
            The average photography booking in India is worth ₹15,000 — ₹50,000. SnapQuote pays for itself the moment you send your first quote.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[1.4375rem] font-bold text-slate-900 text-center mb-10 tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
            Start creating professional quotations today
          </h3>
          <p className="text-sm text-slate-400 mb-7">
            Free forever. Upgrade to Business anytime. No credit card required to start.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-7 py-3 rounded-lg text-sm transition-colors duration-150 shadow-lg hover:shadow-xl"
          >
            Get started for free
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
