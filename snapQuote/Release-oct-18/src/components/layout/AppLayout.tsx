import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingFlow } from '../../pages/onboarding/OnboardingFlow';

export function AppLayout() {
  const { user, profile, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return;
    if (!profile || !profile.studio_id) {
      setShowOnboarding(true);
      setOnboardingChecked(true);
      return;
    }
    setShowOnboarding(false);
    setOnboardingChecked(true);
  }, [loading, profile]);

  if (loading || !onboardingChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleOnboardingComplete() {
    setShowOnboarding(false);
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="lg:pl-[220px] min-w-0">
        <Topbar onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <main className="p-4 sm:p-5 lg:p-7 max-w-[1360px] overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
