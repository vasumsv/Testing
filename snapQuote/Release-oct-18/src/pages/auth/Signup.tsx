import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error: err, needsConfirmation } = await signUp(email, password, fullName);
    setLoading(false);

    if (err) {
      setError(err.message);
    } else if (needsConfirmation) {
      setConfirmed(true);
    } else {
      navigate('/app/dashboard');
    }
  }

  if (confirmed) {
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
          </div>
          <div className="bg-white rounded-xl border border-border shadow-elevated p-7 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-ink mb-2">Check your email</h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-1">
              We sent a confirmation link to
            </p>
            <p className="text-sm font-semibold text-ink mb-4">{email}</p>
            <p className="text-sm text-ink-muted leading-relaxed">
              Click the link in the email to activate your account, then come back to sign in.
            </p>
          </div>
          <p className="text-center text-sm text-ink-muted mt-5">
            Already confirmed?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
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
          <h1 className="text-[1.3125rem] font-bold text-ink tracking-tight">Create your account</h1>
          <p className="text-sm text-ink-muted mt-1">Start your free studio workspace</p>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-elevated p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 leading-snug">{error}</p>
              </div>
            )}
            <Input
              label="Full name"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              hint="At least 6 characters"
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
            <div className="pt-1">
              <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
                Create account
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-4 flex items-center justify-center gap-5">
          {['No credit card', '14-day trial', 'Cancel anytime'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-success shrink-0" />
              <span className="text-xs text-ink-muted">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-ink-muted mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-ink-subtle mt-4">
          By signing up, you agree to our{' '}
          <span className="text-primary-600 cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-primary-600 cursor-pointer hover:underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
