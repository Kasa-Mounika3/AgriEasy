import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import AuthShell from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  completePasswordReset,
  getFriendlyAuthError,
  PASSWORD_MIN_LENGTH,
  verifyResetCode,
} from '@/lib/authService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') || '';
  const mode = searchParams.get('mode') || '';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    const verify = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setError('This password reset link is invalid. Please request a new link.');
        setLoading(false);
        return;
      }

      try {
        const resetEmail = await verifyResetCode(oobCode);
        setEmail(resetEmail);
      } catch (error: any) {
        setError(getFriendlyAuthError(error));
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [mode, oobCode]);

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await completePasswordReset(oobCode, password);
      toast.success('Password updated. Please login with your new password.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      setError(getFriendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="Create a new secure password for your AgriEasy account." showBack>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : error && !email ? (
        <div className="space-y-5 rounded-lg border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <Button className="h-10 rounded-lg bg-[#2D5A27] text-white" onClick={() => navigate('/login')}>
            Back to login
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submitReset} noValidate>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4" />
              Verified reset link
            </div>
            <p className="mt-1 text-xs">{email}</p>
          </div>

          <PasswordField
            label="New password"
            value={password}
            shown={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            onChange={(value) => {
              setPassword(value);
              setError('');
            }}
          />

          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            shown={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            onChange={(value) => {
              setConfirmPassword(value);
              setError('');
            }}
          />

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <Button type="submit" className="h-11 w-full rounded-lg bg-[#2D5A27] text-white hover:bg-[#24491F]" disabled={submitting}>
            {submitting ? 'Updating password...' : 'Update password'}
          </Button>

          <p className="text-center text-sm text-slate-600">
            Remembered your password?{' '}
            <Link to="/login" className="font-bold text-[#2D5A27] hover:underline">
              Login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

function PasswordField({
  label,
  value,
  shown,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  shown: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-[#334155]">{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
        <Input
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Minimum 8 characters"
          className="h-11 rounded-lg border-emerald-100 bg-white pl-10 pr-10"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2D5A27]"
          onClick={onToggle}
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
