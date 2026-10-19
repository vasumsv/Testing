import { useNavigate } from 'react-router-dom';
import {
  Check, ArrowRight, Download, MessageCircle, Camera, Eye,
  CreditCard, TrendingUp, FileText, Sparkles, Menu, X,
  Palette, LayoutTemplate, ChevronRight, Star,
} from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { useState, useEffect, useRef } from 'react';

const LOGO_URL = 'https://raw.githubusercontent.com/vasumsv/Testing/refs/heads/main/snapQuote/snapquote%20logo%20new.png';

const HERO_IMG = 'https://images.pexels.com/photos/33072063/pexels-photo-33072063.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop';
const HERO_IMG_MOBILE = 'https://images.pexels.com/photos/33072063/pexels-photo-33072063.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&fit=crop';

const WEDDING_STORY_IMG = 'https://images.pexels.com/photos/30871487/pexels-photo-30871487.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop';

const GROWTH_IMG = 'https://images.pexels.com/photos/16313530/pexels-photo-16313530.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1000&fit=crop';

const FINAL_CTA_IMG = 'https://images.pexels.com/photos/4942876/pexels-photo-4942876.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop';

const NICHES = [
  { label: 'Wedding Photography', img: 'https://images.pexels.com/photos/10840188/pexels-photo-10840188.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop' },
  { label: 'Pre-Wedding', img: 'https://images.pexels.com/photos/30372650/pexels-photo-30372650.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop' },
  { label: 'Portrait Photography', img: 'https://images.pexels.com/photos/33406877/pexels-photo-33406877.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop' },
  { label: 'Event Photography', img: 'https://images.pexels.com/photos/30215324/pexels-photo-30215324.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop' },
  { label: 'Commercial Photography', img: 'https://images.pexels.com/photos/134469/pexels-photo-134469.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop' },
  { label: 'Fashion Photography', img: 'https://images.pexels.com/photos/20194705/pexels-photo-20194705.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop' },
];

const BENEFITS = [
  { icon: FileText, title: 'Create Quotes', desc: 'Beautiful professional quotations' },
  { icon: MessageCircle, title: 'Share on WhatsApp', desc: 'Send directly to clients' },
  { icon: Eye, title: 'Track Views', desc: 'Know when clients view quotes' },
  { icon: CreditCard, title: 'Get Paid Faster', desc: 'Convert accepted work into payment' },
  { icon: TrendingUp, title: 'Grow Your Studio', desc: 'Manage your client workflow' },
];

const CORE_FEATURES = [
  { icon: FileText, title: 'CREATE QUOTES', desc: 'Beautiful quotes in minutes' },
  { icon: MessageCircle, title: 'SHARE INSTANTLY', desc: 'Send via WhatsApp or email' },
  { icon: Eye, title: 'TRACK VIEWS', desc: 'Know when clients view your quote' },
  { icon: Camera, title: 'GET BOOKINGS', desc: 'Professional quotes convert better' },
  { icon: CreditCard, title: 'TAKE PAYMENTS', desc: 'Invoices and online payments' },
  { icon: TrendingUp, title: 'GROW BUSINESS', desc: 'Manage leads and track performance' },
];

const STEPS = [
  { num: '01', title: 'Choose a Template', desc: 'Pick a design that matches your style.' },
  { num: '02', title: 'Add Details', desc: 'Add packages, pricing and deliverables.' },
  { num: '03', title: 'Preview & Customize', desc: 'See the live preview and make it perfect.' },
  { num: '04', title: 'Send to Client', desc: 'Share via WhatsApp or email and track views.' },
];

const TEMPLATE_FEATURES = [
  'Custom branding & logo',
  'Multiple beautiful templates',
  'Custom backgrounds',
  'Packages & deliverables',
  'Terms & conditions',
  'Live preview',
];

const GROWTH_FEATURES = [
  'Leads & customer management',
  'Quotations & proposals',
  'Online payments & invoices',
  'WhatsApp sharing',
  'Quote tracking & follow-ups',
  'Analytics & insights',
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function QuoteMockup() {
  return (
    <div className="w-full max-w-[380px] mx-auto bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xl">
      {/* Header with photography image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/30372650/pexels-photo-30372650.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <Camera className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-white font-semibold text-xs leading-tight">Meridian Studio</p>
              <p className="text-white/50 text-[10px]">Arjun Nair · Mumbai</p>
            </div>
          </div>
          <span className="text-[9px] font-semibold text-white bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">QT-2847</span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Quotation For</p>
        <p className="text-sm text-slate-900 font-semibold">Anjali &amp; Rohit Wedding</p>
        <p className="text-[11px] text-slate-400 mt-0.5">March 15, 2026 · Mumbai</p>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        {[
          { name: 'Photography Package (8 hrs)', price: '₹55,000' },
          { name: 'Pre-Wedding Shoot', price: '₹18,000' },
          { name: 'Wedding Album (40 pages)', price: '₹12,000' },
          { name: 'Same-Day Edit Highlights', price: '₹8,000' },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-600">{item.name}</span>
            <span className="text-xs font-semibold text-slate-900 shrink-0">{item.price}</span>
          </div>
        ))}
      </div>

      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-slate-500">Subtotal</span>
          <span className="text-[11px] text-slate-500">₹93,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Final Price</span>
          <span className="text-sm font-bold text-violet-600">₹88,000</span>
        </div>
      </div>

      <div className="px-5 py-3.5 flex gap-2 border-t border-slate-100">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold">
          <Download className="w-3 h-3" /> PDF
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold">
          <MessageCircle className="w-3 h-3" /> WhatsApp
        </button>
      </div>
    </div>
  );
}

function BrowserMockup() {
  return (
    <div className="w-full max-w-[640px] mx-auto bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
        </div>
        <div className="flex-1 mx-3 h-5 rounded-md bg-white border border-slate-200 flex items-center px-2.5">
          <span className="text-[10px] text-slate-400 font-medium">app.snapquote.in/quote-builder</span>
        </div>
      </div>
      <div className="flex">
        {/* Left sidebar */}
        <div className="hidden sm:block w-40 bg-slate-50 border-r border-slate-100 p-3 space-y-2.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Client</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-violet-700">AK</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-800 font-medium">Anjali Kapoor</p>
              <p className="text-[8px] text-slate-400">Wedding · Mar 2026</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Items</p>
            {['Photography Pkg', 'Pre-Wedding', 'Album', 'Drone'].map((n, i) => (
              <div key={n} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${i < 3 ? 'bg-violet-400' : 'bg-slate-300'}`} />
                <span className={`text-[9px] ${i < 3 ? 'text-slate-600' : 'text-slate-300 line-through'}`}>{n}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-200/60">
            <p className="text-[9px] text-slate-400">Total</p>
            <p className="text-sm font-bold text-slate-900">₹85,000</p>
          </div>
        </div>
        {/* Preview area */}
        <div className="flex-1 p-4 bg-slate-100/50">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="relative h-24 overflow-hidden">
              <img
                src="https://images.pexels.com/photos/8296813/pexels-photo-8296813.jpeg?auto=compress&cs=tinysrgb&w=500&h=200&fit=crop"
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
              <div className="absolute bottom-2 left-3">
                <p className="text-white font-semibold text-[11px]">Wedding Photography</p>
                <p className="text-white/60 text-[9px]">Meridian Studio</p>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              {['Photography Package', 'Pre-Wedding Shoot', 'Wedding Album'].map((n, i) => (
                <div key={n} className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">{n}</span>
                  <span className="text-[10px] font-semibold text-slate-800">{['₹55,000', '₹18,000', '₹12,000'][i]}</span>
                </div>
              ))}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-900">Final Price</span>
                <span className="text-[10px] font-bold text-violet-600">₹85,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#templates', label: 'Templates' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#niches', label: 'Customers' },
    { href: '#how-it-works', label: 'Resources' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/60' : 'bg-transparent'
        }`}
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 shrink-0">
            <img src={LOGO_URL} alt="SnapQuote" className="h-8 w-auto object-contain" />
          </a>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-150 ${
                  scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/login')}
              className={`hidden sm:block text-sm font-medium transition-colors duration-150 px-3 py-2 ${
                scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150 shadow-sm"
            >
              Start Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md transition-colors"
              aria-label="Open menu"
            >
              <Menu className={`w-5 h-5 ${scrolled ? 'text-slate-700' : 'text-white'}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <>
            <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileMenuOpen(false)} />
            <div className="lg:hidden fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-white z-50 shadow-2xl flex flex-col">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
                <img src={LOGO_URL} alt="SnapQuote" className="h-8 w-auto object-contain" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="border-t border-slate-200 p-4 space-y-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                  className="w-full py-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                  className="w-full py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Desktop background */}
        <div className="absolute inset-0 hidden sm:block">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/30" />
        </div>
        {/* Mobile background */}
        <div className="absolute inset-0 sm:hidden">
          <img src={HERO_IMG_MOBILE} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/80" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-20 pb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-violet-300 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Built for Photographers
            </p>
            <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem] font-bold text-white tracking-[-0.03em] leading-[1.05] mb-6">
              Create Professional<br />Quotes in Minutes
            </h1>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-lg mb-8">
              Beautiful quotations, proposals and invoices for your photography business. Impress clients, close more bookings and grow your studio.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-4">
              <button
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-6 py-3.5 rounded-xl transition-colors duration-150 text-[15px] shadow-xl"
              >
                Start Free Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 border border-white/25 hover:bg-white/10 text-white font-medium px-6 py-3.5 rounded-xl transition-colors duration-150 text-[15px] backdrop-blur-sm"
              >
                See How It Works
              </a>
            </div>
            <p className="text-xs text-white/50">No credit card required &middot; Free to start</p>
          </div>

          {/* Product mockup — below hero copy on mobile, floating on desktop */}
          <div className="mt-12 sm:mt-16 flex justify-center sm:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 bg-violet-500/20 blur-3xl rounded-full hidden sm:block" />
              <div className="relative">
                <QuoteMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefit Strip */}
      <section className="py-10 border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-violet-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Value Section */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-[0.2em] mb-4">Core Value</p>
              <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight">
                Run Your Photography Business<br className="hidden sm:block" /> in One Place
              </h2>
              <p className="text-base text-slate-500 mt-4 leading-relaxed">
                From quotes to payments, SnapQuote helps you manage your entire client journey with professional tools designed for photographers.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="group h-full p-6 bg-white border border-slate-200/80 rounded-2xl hover:border-violet-200 hover:shadow-lg transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-50 to-slate-50 border border-violet-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Icon className="w-5 h-5 text-violet-600" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-wide mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section id="templates" className="py-20 sm:py-28 bg-slate-50/80 border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <div className="order-2 lg:order-1">
                <BrowserMockup />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="order-1 lg:order-2">
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  Beautiful Templates
                </p>
                <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight mb-5">
                  Stunning Quotes<br />That Win Clients
                </h2>
                <p className="text-base text-slate-500 leading-relaxed mb-7">
                  Professional templates designed for photography businesses.
                </p>
                <ul className="space-y-3 mb-8">
                  {TEMPLATE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-violet-600" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold text-sm transition-colors"
                >
                  Explore Templates
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Photography Niches */}
      <section id="niches" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-[0.2em] mb-4">Designed For</p>
              <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight">
                Perfect for Every<br />Photography Niche
              </h2>
            </div>
          </Reveal>

          {/* Mobile: horizontal scroll cards */}
          <div className="flex gap-4 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 scrollbar-none snap-x snap-mandatory lg:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
            {NICHES.map(({ label, img }, i) => (
              <Reveal key={label} delay={i * 60}>
                <div className="group relative h-56 w-64 sm:w-auto shrink-0 sm:shrink rounded-2xl overflow-hidden snap-center cursor-pointer">
                  <img
                    src={img}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5 flex items-center justify-between">
                    <span className="text-white font-semibold text-base">{label}</span>
                    <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Visual Story */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={WEDDING_STORY_IMG} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/20" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-violet-300 uppercase tracking-[0.2em] mb-5">For Wedding Photographers</p>
              <h2 className="text-[2.25rem] sm:text-[3rem] font-bold text-white tracking-tight leading-[1.05] mb-5">
                Your Photography.<br />Your Brand.<br />Your Quote.
              </h2>
              <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-8 max-w-md">
                Create quotations that look as beautiful as the work you deliver.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-6 py-3.5 rounded-xl transition-colors duration-150 text-[15px] shadow-xl"
              >
                Create Your First Quote
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-[0.2em] mb-4">How It Works</p>
              <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight">
                Create and Send a Professional Quote<br className="hidden sm:block" /> in 4 Simple Steps
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ num, title, desc }, i) => (
              <Reveal key={num} delay={i * 100}>
                <div className="relative p-6 bg-slate-50/80 border border-slate-200/60 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300">
                  <span className="text-[2.5rem] font-bold text-violet-200 leading-none block mb-3">{num}</span>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-slate-200" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Business Growth Section */}
      <section className="py-20 sm:py-28 bg-slate-50/80 border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60">
                  <img src={GROWTH_IMG} alt="Photography workspace" className="w-full h-auto object-cover" loading="lazy" />
                </div>
                {/* Floating dashboard card */}
                <div className="hidden sm:block absolute -bottom-6 -right-4 w-52 bg-white rounded-xl shadow-2xl border border-slate-200/80 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900">Analytics</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Quotes Sent', val: '42', pct: '75%' },
                      { label: 'Viewed', val: '38', pct: '62%' },
                      { label: 'Booked', val: '19', pct: '45%' },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500">{s.label}</span>
                          <span className="text-[10px] font-bold text-slate-800">{s.val}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: s.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Floating callout labels */}
                <div className="hidden lg:block absolute -top-4 -left-4 bg-white rounded-lg shadow-lg border border-slate-200/80 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700">Organize</span>
                </div>
                <div className="hidden lg:block absolute top-1/3 -left-8 bg-white rounded-lg shadow-lg border border-slate-200/80 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700">Track</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div>
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-[0.2em] mb-4">Business Growth</p>
                <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight mb-5">
                  Everything You Need<br />to Grow Your Studio Business
                </h2>
                <ul className="space-y-3 mb-8">
                  {GROWTH_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-violet-600" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors duration-150 text-[15px] shadow-lg"
                >
                  Start Free Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 sm:py-28 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img src="https://images.pexels.com/photos/26606374/pexels-photo-26606374.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop" alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.2em] mb-4">Loved by Photographers</p>
              <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-white tracking-tight leading-tight">
                Helping Photographers<br />Grow Their Business
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', type: 'Wedding Photography', text: 'I used to spend 20 minutes on every quote. Now it takes under a minute. My close rate has never been better.' },
              { name: 'Rohan Mehta', type: 'Pre-Wedding & Events', text: 'The WhatsApp sharing is a game-changer. Clients respond within minutes instead of days.' },
              { name: 'Aisha Kapoor', type: 'Portrait & Fashion', text: 'The PDF quotes look so professional. Clients always comment on how clean everything looks.' },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="h-full p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-colors duration-300">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{t.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/50">{t.type}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
              {['500+', 'Businesses using SnapQuote'].map((s, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  {i === 0 && <span className="text-3xl font-bold text-white">{s}</span>}
                  {i === 1 && <span className="text-sm text-white/50">{s}</span>}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-[0.2em] mb-4">Pricing</p>
              <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight">
                Start Free. Upgrade When You Grow.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Reveal>
              <div className="h-full p-8 bg-white border border-slate-200 rounded-2xl flex flex-col">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Free</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[2.5rem] font-bold text-slate-900 leading-none">₹0</span>
                  <span className="text-sm text-slate-400">/forever</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">For getting started.</p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {['10 quotes per month', '3 Free Themes', 'PDF Download', 'WhatsApp Sharing', 'Studio Branding'].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Start Free
                </button>
              </div>
            </Reveal>

            {/* Business Plan */}
            <Reveal delay={100}>
              <div className="h-full p-8 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-bl-xl">
                  Recommended
                </div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">SnapQuote Business</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[2.5rem] font-bold text-white leading-none">₹699</span>
                  <span className="text-sm text-white/40">/month</span>
                </div>
                <p className="text-xs text-white/40 mb-6">or ₹6,990/year</p>
                <p className="text-sm text-white/60 mb-6">Everything you need to grow your studio.</p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {['Unlimited quotes', 'All Premium Themes', 'CRM — Lead management', 'Package templates', 'Invoices & Payments', 'Analytics'].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-white/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  Get SnapQuote Business
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={FINAL_CTA_IMG} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/70 to-slate-950/50" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <div className="max-w-2xl mx-auto">
              <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-6" />
              <h2 className="text-[2.25rem] sm:text-[3.25rem] font-bold text-white tracking-tight leading-[1.1] mb-5">
                Your Photos Tell the Story.<br />Your Quotes Get the Booking.
              </h2>
              <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-8 max-w-lg mx-auto">
                Create beautiful quotations, send them instantly and keep your photography business moving.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-8 py-4 rounded-xl transition-colors duration-150 text-base shadow-2xl"
              >
                Start Free Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="mt-4 text-xs text-white/50">No credit card required &middot; Free to start</p>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
