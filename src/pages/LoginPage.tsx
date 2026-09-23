import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, addToast } from '@/context/AppContext';
import { Eye, EyeOff } from 'lucide-react';
import shellLogo from '@/assets/shell-logo.png';
import loginHeroBg from '@/assets/login-hero-bg.jpg';

const VALID_EMAIL = 'user@upstreamai.com';
const VALID_PASSWORD = 'W!pr0';

export default function LoginPage() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      dispatch({ type: 'LOGIN' });
      addToast(dispatch, 'success', 'Welcome to Shell AI Factory', 'Signed in successfully');
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Section — dark left panel */}
      <div
        className="lg:w-[55%] relative flex flex-col justify-center px-8 lg:px-16 py-16 lg:py-0 min-h-[40vh] lg:min-h-screen overflow-hidden"
      >
        {/* Background image */}
        <img src={loginHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1280} height={1920} />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-[hsl(240,28%,14%)]/70" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src={shellLogo} alt="Shell" className="w-10 h-10 object-contain" />
            <span className="text-xl font-semibold tracking-tight text-white">Shell AI Factory</span>
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            Powering<br />
            <span style={{ color: 'hsl(49, 97%, 51%)' }}>AI INNOVATION</span>
          </h1>

          <p className="text-lg text-white/70 max-w-lg mb-10 leading-relaxed">
            Enterprise-grade AI lifecycle management — from ideation to production deployment, governed by Shell's operational excellence standards.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[hsl(152,64%,29%)]" />
              Use Case Lifecycle
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[hsl(224,53%,37%)]" />
              Model Lab & Experiments
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[hsl(49,97%,51%)]" />
              Governance & Compliance
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel — Login form */}
      <div className="lg:w-[45%] flex flex-col justify-center px-8 lg:px-12 py-12 bg-background">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold text-foreground text-left mb-1">Shell AI Factory</h2>
          <p className="text-muted-foreground text-left mb-8">Sign in to access the platform</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@upstreamai.com"
                required
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-[hsl(224,53%,37%)]"
                />
                <span className="text-sm text-foreground">Remember Me</span>
              </label>
              <button type="button" className="text-sm text-[hsl(224,53%,37%)] hover:underline font-medium">
                Forgot Password?
              </button>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg text-sm font-semibold tracking-wider transition-all duration-200 bg-[hsl(240,28%,14%)] text-white hover:bg-[hsl(240,28%,20%)]"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Don't have access?{' '}
            <button type="button" className="text-[hsl(224,53%,37%)] hover:underline font-medium">
              Request Access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
