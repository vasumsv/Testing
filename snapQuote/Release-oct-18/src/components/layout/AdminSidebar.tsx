import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/studios', icon: Building2, label: 'Studios' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminSidebar() {
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <aside className="h-full w-56 bg-[#0F172A] flex flex-col z-20">
      <div className="h-[54px] flex items-center px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="https://raw.githubusercontent.com/vasumsv/Testing/refs/heads/main/snapQuote/snapquote%20logo%20new.png"
            alt="SnapQuote"
            className="h-7 w-auto object-contain brightness-0 invert"
          />
          <span className="text-[0.5625rem] font-semibold text-white/35 tracking-[0.12em] uppercase">Admin</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-px">
        <p className="px-2 pt-1 pb-2 text-[0.625rem] font-semibold text-white/30 uppercase tracking-[0.12em]">Management</p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[0.8125rem] font-medium transition-[background-color,color] duration-150 ${
                isActive
                  ? 'bg-white/12 text-white font-semibold [box-shadow:inset_2px_0_0_0_rgba(255,255,255,0.6)]'
                  : 'text-white/55 hover:bg-white/7 hover:text-white/90'
              }`
            }
          >
            <Icon className="w-[14px] h-[14px] shrink-0" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2.5 py-3 border-t border-white/10 space-y-px">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer group mt-1">
          <div className="w-6 h-6 rounded-full bg-primary-600/25 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary-400">
              {admin?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.75rem] font-medium text-white/75 truncate leading-tight">{admin?.full_name || 'Admin'}</p>
            <p className="text-[0.6875rem] text-white/35 truncate leading-tight mt-0.5">@{admin?.username || 'admin'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-white/35 hover:text-red-400 p-2 rounded"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
