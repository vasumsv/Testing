import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';

const routeTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/studios': 'Studios',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/settings': 'Settings',
};

function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation();
  const title = routeTitles[pathname] || 'Admin';

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" strokeWidth={1.75} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-widest">Admin Panel</p>
        <h1 className="text-sm font-semibold text-ink truncate">{title}</h1>
      </div>
      <button className="w-10 h-10 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised transition-colors shrink-0">
        <Bell className="w-4 h-4" strokeWidth={1.75} />
      </button>
    </header>
  );
}

export function AdminLayout() {
  const { admin, loading } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-20">
        <AdminSidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="relative h-full">
          <AdminSidebar />
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-md text-white/60 hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="lg:pl-56">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
