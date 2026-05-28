import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Globe, Lock, Mail, MapPin, Phone, User, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import AuthShell from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { indiaData } from '@/lib/indiaData';
import {
  continueWithGoogle,
  getFriendlyAuthError,
  isEmail,
  isValidPhone,
  languages,
  normalizeEmail,
  PASSWORD_MIN_LENGTH,
  registerWithEmailPassword,
} from '@/lib/authService';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  state: string;
  district: string;
  language: string;
};

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

const initialForm: RegisterForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  state: '',
  district: '',
  language: 'English',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState<RegisterForm>(initialForm);
  const [errors, setErrors] = React.useState<RegisterErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(true);

  const states = React.useMemo(() => Object.keys(indiaData).sort(), []);
  const districts = form.state ? indiaData[form.state] || [] : [];

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/dashboard', { replace: true });
      setCheckingSession(false);
    });
    return unsubscribe;
  }, [navigate]);

  const updateField = (field: keyof RegisterForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'state' ? { district: '' } : {}),
    }));
    setErrors((current) => ({ ...current, [field]: undefined, ...(field === 'state' ? { district: undefined } : {}) }));
  };

  const validate = (includePassword = true) => {
    const nextErrors: RegisterErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!isEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';
    else if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (includePassword) {
      if (!form.password) nextErrors.password = 'Password is required.';
      else if (form.password.length < PASSWORD_MIN_LENGTH) nextErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
      if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
      else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!form.state) nextErrors.state = 'Select your state.';
    if (!form.district) nextErrors.district = 'Select your district.';
    if (!form.language) nextErrors.language = 'Select your preferred language.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const profile = {
    name: form.name.trim(),
    email: normalizeEmail(form.email),
    phone: form.phone,
    state: form.state,
    district: form.district,
    language: form.language,
  };

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate(true) || loading) return;

    setLoading(true);
    try {
      await registerWithEmailPassword(profile, form.password);
      toast.success('Welcome to AgriEasy. Your account is ready.');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    if (!validate(false) || loading) return;

    setLoading(true);
    try {
      await continueWithGoogle(profile);
      toast.success('Google sign-in complete.');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(getFriendlyAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <div className="min-h-screen bg-emerald-50 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>;
  }

  return (
    <AuthShell title="Create your account" subtitle="Register once and keep your AgriEasy dashboard, bookings, profile, and market tools synced." showBack>
      <form className="space-y-4" onSubmit={submitRegister} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name} className="sm:col-span-2">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Enter your full name" className="h-11 rounded-lg border-emerald-100 bg-white pl-10" aria-invalid={!!errors.name} />
          </Field>

          <Field label="Email" error={errors.email}>
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Input value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" className="h-11 rounded-lg border-emerald-100 bg-white pl-10" aria-invalid={!!errors.email} />
          </Field>

          <Field label="Phone number" error={errors.phone}>
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="9876543210" inputMode="tel" className="h-11 rounded-lg border-emerald-100 bg-white pl-10" aria-invalid={!!errors.phone} />
          </Field>

          <Field label="Password" error={errors.password}>
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Minimum 8 characters" className="h-11 rounded-lg border-emerald-100 bg-white pl-10 pr-10" aria-invalid={!!errors.password} />
            <PasswordToggle shown={showPassword} onClick={() => setShowPassword((value) => !value)} />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword}>
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} placeholder="Re-enter password" className="h-11 rounded-lg border-emerald-100 bg-white pl-10 pr-10" aria-invalid={!!errors.confirmPassword} />
            <PasswordToggle shown={showConfirmPassword} onClick={() => setShowConfirmPassword((value) => !value)} />
          </Field>

          <Field label="State" error={errors.state}>
            <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Select value={form.state} onValueChange={(value) => updateField('state', value)}>
              <SelectTrigger className="h-11 w-full rounded-lg border-emerald-100 bg-white pl-10" aria-invalid={!!errors.state}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {states.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="District" error={errors.district}>
            <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Select value={form.district} onValueChange={(value) => updateField('district', value)} disabled={!form.state}>
              <SelectTrigger className="h-11 w-full rounded-lg border-emerald-100 bg-white pl-10" aria-invalid={!!errors.district}>
                <SelectValue placeholder={form.state ? 'Select district' : 'Select state first'} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {districts.map((district) => <SelectItem key={district} value={district}>{district}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Preferred language" error={errors.language} className="sm:col-span-2">
            <Globe className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-700" />
            <Select value={form.language} onValueChange={(value) => updateField('language', value)}>
              <SelectTrigger className="h-11 w-full rounded-lg border-emerald-100 bg-white pl-10" aria-invalid={!!errors.language}>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Button type="submit" className="h-11 w-full rounded-lg bg-[#2D5A27] text-white hover:bg-[#24491F]" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
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
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#2D5A27] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-bold text-[#334155]">{label}</Label>
      <div className="relative">{children}</div>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

function PasswordToggle({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2D5A27]" onClick={onClick} aria-label={shown ? 'Hide password' : 'Show password'}>
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
