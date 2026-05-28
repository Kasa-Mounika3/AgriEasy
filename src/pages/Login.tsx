import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chrome, Eye, EyeOff, Lock, Mail, Phone, Send } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import AuthShell from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  continueWithGoogle,
  getFriendlyAuthError,
  isEmail,
  isValidPhone,
  loginWithEmailOrPhone,
  normalizeEmail,
  sendResetLink,
} from '@/lib/authService';
import { auth } from '@/lib/firebase';

type LoginErrors = {
  identifier?: string;
  password?: string;
  resetEmail?: string;
};

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [resetEmail, setResetEmail] = React.useState('');
  const [errors, setErrors] = React.useState<LoginErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showReset, setShowReset] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/dashboard', { replace: true });
      setCheckingSession(false);
    });
    return unsubscribe;
  }, [navigate]);

  const validateLogin = () => {
    const nextErrors: LoginErrors = {};
    const value = identifier.trim();

    if (!value) nextErrors.identifier = 'Email or phone number is required.';
    else if (!isEmail(value) && !isValidPhone(value)) nextErrors.identifier = 'Enter a valid email address or 10-digit Indian mobile number.';
    if (!password) nextErrors.password = 'Password is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateLogin() || loading) return;

    setLoading(true);
    try {
      await loginWithEmailOrPhone(identifier, password);
      toast.success('Logged in successfully.');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await continueWithGoogle();
      toast.success('Logged in with Google.');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(getFriendlyAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const email = normalizeEmail(resetEmail);

    if (!email) {
      setErrors({ resetEmail: 'Email is required for password reset.' });
      return;
    }

    if (!isEmail(email)) {
      setErrors({ resetEmail: 'Enter a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      await sendResetLink(email);
      toast.success('Password reset link sent. Please check your inbox.');
      setShowReset(false);
      setResetEmail('');
      setErrors({});
    } catch (error: any) {
      toast.error(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <div className="min-h-screen bg-emerald-50 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>;
  }

  return (
    <AuthShell title="Welcome back" subtitle="Login to continue to your AgriEasy dashboard, bookings, crop plans, and market tools.">
      <form className="space-y-4" onSubmit={submitLogin} noValidate>
        <div className="space-y-2">
          <Label className="text-sm font-bold text-[#334155]">Email or phone number</Label>
          <div className="relative">
            {isValidPhone(identifier) ? (
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            ) : (
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            )}
            <Input
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setErrors((current) => ({ ...current, identifier: undefined }));
              }}
              placeholder="Email or 10-digit mobile number"
              className="h-11 rounded-lg border-emerald-100 bg-white pl-10"
              aria-invalid={!!errors.identifier}
            />
          </div>
          {errors.identifier && <p className="text-xs font-semibold text-rose-600">{errors.identifier}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-[#334155]">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="Enter your password"
              className="h-11 rounded-lg border-emerald-100 bg-white pl-10 pr-10"
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2D5A27]"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs font-semibold text-rose-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-end">
          <button type="button" className="text-sm font-bold text-[#2D5A27] hover:underline" onClick={() => setShowReset((value) => !value)}>
            Forgot Password?
          </button>
        </div>

        {showReset && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-amber-900">Reset password by email</Label>
              <div className="flex gap-2">
                <Input
                  value={resetEmail}
                  onChange={(event) => {
                    setResetEmail(event.target.value);
                    setErrors((current) => ({ ...current, resetEmail: undefined }));
                  }}
                  placeholder="registered@email.com"
                  className="h-10 rounded-lg border-amber-200 bg-white"
                  aria-invalid={!!errors.resetEmail}
                />
                <Button type="button" size="icon-lg" className="rounded-lg bg-[#E67E22] text-white hover:bg-[#c96a18]" disabled={loading} aria-label="Send reset link" onClick={submitReset}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {errors.resetEmail && <p className="text-xs font-semibold text-rose-600">{errors.resetEmail}</p>}
            </div>
          </div>
        )}

        <Button type="submit" className="h-11 w-full rounded-lg bg-[#2D5A27] text-white hover:bg-[#24491F]" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
          <div className="h-px flex-1 bg-slate-100" />
          or
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <Button type="button" variant="outline" className="h-11 w-full rounded-lg border-slate-200 bg-white" onClick={submitGoogle} disabled={loading}>
          <Chrome className="h-4 w-4 text-[#E67E22]" />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-[#2D5A27] hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
