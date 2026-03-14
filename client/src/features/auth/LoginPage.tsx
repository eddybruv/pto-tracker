import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palmtree, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const demoAccounts = [
  { email: 'admin@company.com', password: 'admin123', role: 'Admin' },
  { email: 'lead@company.com', password: 'admin123', role: 'Tech Lead' },
  { email: 'dev@company.com', password: 'admin123', role: 'Developer' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="grain min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-center justify-center overflow-hidden">
        {/* Geometric pattern */}
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
        {/* Amber gradient orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="relative z-10 text-center px-16">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8">
            <Palmtree className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-100 mb-4">
            Time Off,<br />
            <span className="text-amber-400">Tracked.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
            Simple PTO management for teams that would rather be building things.
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 text-slate-600">
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-slate-300">18</div>
              <div className="text-xs tracking-wider uppercase mt-1">Developers</div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-slate-300">3</div>
              <div className="text-xs tracking-wider uppercase mt-1">PTO Types</div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-slate-300">0</div>
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
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">Sign in to manage your time off</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
              Sign In
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-600 mb-3">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {demoAccounts.map((acct) => (
                <button
                  key={acct.email}
                  onClick={() => fillDemo(acct)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-amber-500/30 hover:bg-slate-800 transition-all duration-150 group cursor-pointer"
                >
                  <span className="text-xs text-slate-400 font-mono group-hover:text-slate-300 transition-colors">
                    {acct.email}
                  </span>
                  <span className="text-[10px] font-display tracking-wider uppercase text-slate-600 group-hover:text-amber-400 transition-colors">
                    {acct.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
