import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Camera,
  Package,
  Settings,
  LogOut,
  PenLine,
  Lock,
  BarChart2,
  Images,
  Receipt,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigationGuard } from '../../contexts/NavigationGuardContext';
import { isBusinessPlan } from '../../types';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  locked?: boolean;
  onNavigate: (path: string) => void;
  currentPath: string;
  onClose?: () => void;
}

function NavItem({ to, icon, children, locked, onNavigate, currentPath, onClose }: NavItemProps) {
  const isActive = currentPath === to || currentPath.startsWith(to + '/');

  return (
    <button
      onClick={() => { onNavigate(to); onClose?.(); }}
      className={`sidebar-link w-full text-left ${isActive ? 'active' : ''}`}
    >
      {icon}
      {children}
      {locked && (
        <span className="ml-auto">
          <Lock className="w-3 h-3 text-ink-subtle opacity-60" />
        </span>
      )}
    </button>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { quota } = useSubscription(profile?.studio_id);
  const plan = quota?.plan ?? 'trial';
  const hasBusinessAccess = isBusinessPlan(plan);
  const navigate = useNavigate();
  const location = useLocation();
  const guard = useNavigationGuard();

  function handleNavigate(path: string) {
    if (guard.isProcessing()) return;
    if (guard.isDirty()) {
      guard.setPendingNav(path);
      guard.onConfirmLeave.current = (dest: string) => {
        guard.setDirty(false);
        navigate(dest);
      };
    } else {
      navigate(path);
    }
  }

  const navContent = (
    <>
      <div className="h-14 flex items-center px-5 shrink-0 justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="https://raw.githubusercontent.com/vasumsv/Testing/refs/heads/main/snapQuote/snapquote%20logo%20new.png"
            alt="SnapQuote"
            className="h-9 w-auto object-contain"
          />
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="h-px bg-border" />

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <NavItem to="/app/dashboard" icon={<LayoutDashboard className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Dashboard
        </NavItem>

        <NavItem to="/app/clients" icon={<Users className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} locked={!hasBusinessAccess} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Clients
        </NavItem>

        <NavItem to="/app/quote-builder" icon={<PenLine className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Quote Builder
        </NavItem>

        <NavItem to="/app/quotes" icon={<FileText className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Quotes
        </NavItem>

        <NavItem to="/app/payments" icon={<Receipt className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Payments
        </NavItem>

        <NavItem to="/app/invoices" icon={<BookOpen className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Invoices
        </NavItem>

        <NavItem to="/app/services" icon={<Camera className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Services
        </NavItem>

        <NavItem to="/app/portfolio" icon={<Images className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Portfolio
        </NavItem>

        <NavItem to="/app/packages" icon={<Package className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} locked={!hasBusinessAccess} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Packages
        </NavItem>

        <NavItem to="/app/analytics" icon={<BarChart2 className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} locked={!hasBusinessAccess} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
          Analytics
        </NavItem>

        <div className="pt-3 mt-2">
          <div className="h-px bg-border mb-3" />
          <NavItem to="/app/settings" icon={<Settings className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />} onNavigate={handleNavigate} currentPath={location.pathname} onClose={onMobileClose}>
            Settings
          </NavItem>
        </div>
      </nav>

      <div className="h-px bg-border" />

      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-slate-100 cursor-pointer group transition-colors duration-100">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-slate-600">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.75rem] font-semibold text-ink truncate leading-tight">{profile?.full_name || 'Studio User'}</p>
            <p className="text-[0.6875rem] text-ink-subtle truncate leading-tight mt-0.5">{profile?.email || ''}</p>
          </div>
          <button
            onClick={signOut}
            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-100 text-ink-subtle hover:text-ink p-2 rounded"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[220px] bg-white border-r border-border flex-col z-20">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-[260px] bg-white border-r border-border flex flex-col z-40 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
