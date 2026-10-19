import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailUnconfirmed, setEmailUnconfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEmailUnconfirmed(false);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        setEmailUnconfirmed(true);
      } else {
        setError(err.message);
      }
    } else {
      navigate('/app/dashboard');
    }
  }

  async function handleResend() {
    setResendLoading(true);
    await supabase.auth.resend({ type: 'signup', email });
    setResendLoading(false);
    setResendSent(true);
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-7">
          <div className="mb-4">
            <img
              src="https://raw.githubusercontent.com/vasumsv/Testing/refs/heads/main/snapQuote/snapquote%20logo%20new.png"
              alt="SnapQuote"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-[1.3125rem] font-bold text-ink tracking-tight">Welcome back</h1>
          <p className="text-sm text-ink-muted mt-1">Sign in to your SnapQuote account</p>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-elevated p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 leading-snug">{error}</p>
              </div>
            )}
            {emailUnconfirmed && (
              <div className="flex flex-col gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-snug font-medium">
                    Email not confirmed yet
                  </p>
                </div>
                <p className="text-xs text-amber-700 leading-snug pl-6">
                  Check your inbox for the confirmation link we sent when you signed up.
                </p>
                {resendSent ? (
                  <p className="text-xs text-emerald-700 font-medium pl-6">Confirmation email resent!</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-xs text-amber-700 font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors pl-6 text-left disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                )}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink leading-none">Password</label>
                <button type="button" className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors py-2 px-1">
                  Forgot password?
                </button>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="text-ink-subtle hover:text-ink transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>
            <div className="pt-1">
              <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
                Sign in
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-ink-muted mt-5">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            Create one free
          </Link>
        </p>
        <p className="text-center text-xs text-ink-subtle mt-3">
          Need help?{' '}
          <a
            href="mailto:contact@snapquote.in"
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            contact@snapquote.in
          </a>
        </p>
      </div>
    </div>
  );
}
