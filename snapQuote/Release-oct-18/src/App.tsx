import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { DashboardAuthProvider, PaymentsAuthProvider, AnalyticsAuthProvider, useSectionAuth } from './contexts/SectionAuthContext';
import { NavigationGuardProvider } from './contexts/NavigationGuardContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const SectionLogin = lazy(() => import('./pages/app/SectionLogin').then(m => ({ default: m.SectionLogin })));

const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/auth/Signup').then(m => ({ default: m.Signup })));
const TermsAndConditions = lazy(() => import('./pages/legal/TermsAndConditions').then(m => ({ default: m.TermsAndConditions })));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy').then(m => ({ default: m.RefundPolicy })));

const AppLayout = lazy(() => import('./components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const Dashboard = lazy(() => import('./pages/app/Dashboard').then(m => ({ default: m.Dashboard })));
const Clients = lazy(() => import('./pages/app/Clients').then(m => ({ default: m.Clients })));
const QuoteBuilder = lazy(() => import('./pages/app/quote-builder/QuoteBuilder').then(m => ({ default: m.QuoteBuilder })));
const Quotes = lazy(() => import('./pages/app/Quotes').then(m => ({ default: m.Quotes })));
const Services = lazy(() => import('./pages/app/services/Services').then(m => ({ default: m.Services })));
const Packages = lazy(() => import('./pages/app/Packages').then(m => ({ default: m.Packages })));
const Settings = lazy(() => import('./pages/app/Settings').then(m => ({ default: m.Settings })));
const Analytics = lazy(() => import('./pages/app/Analytics').then(m => ({ default: m.Analytics })));
const Portfolio = lazy(() => import('./pages/app/Portfolio').then(m => ({ default: m.Portfolio })));
const PaymentsPage = lazy(() => import('./pages/app/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const InvoicesPage = lazy(() => import('./pages/app/payments/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const BillingDetail = lazy(() => import('./pages/app/payments/BillingDetail').then(m => ({ default: m.BillingDetail })));
const PaymentLogin = lazy(() => import('./pages/payments/PaymentLogin').then(m => ({ default: m.PaymentLogin })));
const PaymentPortal = lazy(() => import('./pages/payments/PaymentPortal').then(m => ({ default: m.PaymentPortal })));

const AdminLayout = lazy(() => import('./components/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Studios = lazy(() => import('./pages/admin/Studios').then(m => ({ default: m.Studios })));
const Subscriptions = lazy(() => import('./pages/admin/Subscriptions').then(m => ({ default: m.Subscriptions })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function DashboardGuard() {
  const { authenticated, loading, loginRequired } = useSectionAuth('dashboard');
  if (loading) return <PageLoader />;
  if (loginRequired && !authenticated) return <SectionLogin section="dashboard" title="Dashboard Login" subtitle="Enter your Dashboard credentials to access business overview" redirectTo="/app/dashboard" />;
  return <Dashboard />;
}

function PaymentsGuard() {
  const { authenticated, loading, loginRequired } = useSectionAuth('payments');
  if (loading) return <PageLoader />;
  if (loginRequired && !authenticated) return <SectionLogin section="payments" title="Payments Login" subtitle="Enter your Payments credentials to manage payments" redirectTo="/app/payments" />;
  return <PaymentsPage />;
}

function AnalyticsGuard() {
  const { authenticated, loading, loginRequired } = useSectionAuth('analytics');
  if (loading) return <PageLoader />;
  if (loginRequired && !authenticated) return <SectionLogin section="analytics" title="Analytics Login" subtitle="Enter your Analytics credentials to view business insights" redirectTo="/app/analytics" />;
  return <Analytics />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NavigationGuardProvider>
        <AuthProvider>
          <DashboardAuthProvider>
          <PaymentsAuthProvider>
          <AnalyticsAuthProvider>
          <AdminAuthProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refunds" element={<RefundPolicy />} />
              <Route path="/payment-login" element={<PaymentLogin />} />
              <Route path="/payment-portal" element={<PaymentPortal />} />

              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardGuard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="quote-builder" element={<QuoteBuilder />} />
                <Route path="quote-builder/:quoteId" element={<QuoteBuilder />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="services" element={<Services />} />
                <Route path="packages" element={<Packages />} />
                <Route path="analytics" element={<AnalyticsGuard />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="settings" element={<Settings />} />
                <Route path="payments" element={<PaymentsGuard />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="invoices/:invoiceId" element={<BillingDetail />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="studios" element={<Studios />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </AdminAuthProvider>
          </AnalyticsAuthProvider>
          </PaymentsAuthProvider>
          </DashboardAuthProvider>
        </AuthProvider>
        </NavigationGuardProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
