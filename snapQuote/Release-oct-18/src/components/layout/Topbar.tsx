import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const routeTitles: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/clients': 'Clients',
  '/app/quote-builder': 'Quote Builder',
  '/app/quotes': 'Quotes',
  '/app/services': 'Services',
  '/app/packages': 'Packages',
  '/app/settings': 'Settings',
  '/app/payments': 'Payments & Invoices',
  '/app/portfolio': 'Portfolio',
  '/app/analytics': 'Analytics',
};

interface TopbarProps {
  onMobileMenuOpen?: () => void;
}

export function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const title = routeTitles[pathname] || 'SnapQuote';

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-10">
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-raised transition-colors shrink-0"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-ink truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-600">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <span className="hidden sm:block text-sm text-ink-muted leading-none truncate max-w-[140px]">
          {profile?.full_name || ''}
        </span>
      </div>
    </header>
  );
}
