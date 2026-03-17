import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Palmtree, Mail, Lock, User, Calendar, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    hireDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email address';
    }
    if (!form.hireDate) errs.hireDate = 'Hire date is required';

    for (const rule of passwordRules) {
      if (!rule.test(form.password)) {
        errs.password = 'Password does not meet requirements';
        break;
      }
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grain min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0b0d13] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e5a142" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="relative z-10 text-center px-16">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8">
            <Palmtree className="h-10 w-10 text-[#f0b85a]" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#e8eaf0] mb-4">
            Join the<br />
            <span className="text-[#f0b85a]">Team.</span>
          </h1>
          <p className="text-[#8a8f9f] text-lg leading-relaxed max-w-md mx-auto">
            Create your account and start managing your time off in seconds.
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 text-[#3d4254]">
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-[#b0b5c3]">18</div>
              <div className="text-xs tracking-wider uppercase mt-1">Developers</div>
            </div>
            <div className="w-px h-10 bg-[#1a1d27]" />
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-[#b0b5c3]">3</div>
              <div className="text-xs tracking-wider uppercase mt-1">PTO Types</div>
            </div>
            <div className="w-px h-10 bg-[#1a1d27]" />
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-[#b0b5c3]">0</div>
              <div className="text-xs tracking-wider uppercase mt-1">HR Dept</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Palmtree className="h-5 w-5 text-amber-400" />
            </div>
            <span className="font-display font-bold tracking-wider text-amber-400">PTO TRACKER</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-100 mb-2">
              Create account
            </h2>
            <p className="text-sm text-slate-500">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                value={form.firstName}
                onChange={updateField('firstName')}
                icon={<User className="h-4 w-4" />}
                error={errors.firstName}
                required
                autoComplete="given-name"
              />
              <Input
                label="Last Name"
                type="text"
                placeholder="Doe"
                value={form.lastName}
                onChange={updateField('lastName')}
                error={errors.lastName}
                required
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={updateField('email')}
              icon={<Mail className="h-4 w-4" />}
              error={errors.email}
              required
              autoComplete="email"
            />

            <Input
              label="Hire Date"
              type="date"
              value={form.hireDate}
              onChange={updateField('hireDate')}
              icon={<Calendar className="h-4 w-4" />}
              error={errors.hireDate}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={updateField('password')}
              icon={<Lock className="h-4 w-4" />}
              error={errors.password}
              required
              autoComplete="new-password"
            />

            {/* Password strength indicators */}
            {form.password && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1">
                {passwordRules.map((rule) => {
                  const passes = rule.test(form.password);
                  return (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      <Check
                        className={`h-3 w-3 ${passes ? 'text-emerald-400' : 'text-slate-600'}`}
                      />
                      <span
                        className={`text-[11px] ${passes ? 'text-emerald-400' : 'text-slate-500'}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              icon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            {serverError && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-400">{serverError}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
