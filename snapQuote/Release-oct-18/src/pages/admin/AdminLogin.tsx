import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, admin } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (admin) {
    navigate('/admin', { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(username, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate('/admin', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://raw.githubusercontent.com/vasumsv/Testing/refs/heads/main/snapQuote/snapquote%20logo%20new.png"
            alt="SnapQuote"
            className="h-12 w-auto mb-5 object-contain"
          />
          <h1 className="text-[1.3125rem] font-bold text-white tracking-tight">Admin Access</h1>
          <p className="text-sm text-white/45 mt-1">Sign in to the SnapQuote admin panel</p>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 leading-snug">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/70">Username</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/25 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/70">Password</label>
              <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/25 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#0F172A] font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" />
                )}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          SnapQuote Admin Panel — Restricted Access
        </p>
      </div>
    </div>
  );
}
