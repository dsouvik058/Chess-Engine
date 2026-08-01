import React, { useState } from 'react';
import { Hammer, Lock, User as UserIcon, Mail, Sparkles, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import type { User, GoogleAuthPayload } from '../../types/auth';
import { authApi } from '../../services/authApi';
import { GoogleOAuthButton } from './GoogleOAuthButton';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Login form state
  const [loginUserOrEmail, setLoginUserOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginUserOrEmail.trim() || !loginPassword) {
      setErrorMessage('Please fill in both username/email and password.');
      return;
    }

    setIsLoading(true);
    const res = await authApi.login({
      usernameOrEmail: loginUserOrEmail.trim(),
      password: loginPassword,
    });
    setIsLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      setErrorMessage(res.message || 'Invalid username or password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regUsername.trim() || !regPassword) {
      setErrorMessage('Username and password are required.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    const res = await authApi.register({
      username: regUsername.trim(),
      name: regName.trim() || regUsername.trim(),
      email: regEmail.trim() || `${regUsername.trim()}@chess.io`,
      password: regPassword,
    });
    setIsLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      setErrorMessage(res.message || 'Registration failed.');
    }
  };

  const handleGoogleSuccess = async (payload: GoogleAuthPayload) => {
    setErrorMessage(null);
    setIsLoading(true);
    const res = await authApi.googleLogin(payload);
    setIsLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      setErrorMessage(res.message || 'Google OAuth sign-in failed.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    // Demo account credentials registered in AuthService
    const res = await authApi.login({
      usernameOrEmail: 'grandmaster',
      password: 'demo_secret_pass',
    });
    setIsLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      // Fallback guest user
      const guestUser: User = {
        id: 'guest-' + Date.now(),
        username: 'guest_player',
        email: 'guest@chess.io',
        name: 'Guest Player',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
        provider: 'LOCAL',
        eloRating: 1500,
        gamesPlayed: 5,
        wins: 3,
      };
      onAuthSuccess(guestUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Neon Grid Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-xl shadow-cyan-500/25 mb-2 group">
            <Hammer className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            GRANDMASTER'S <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">FORGE</span>
          </h1>
          <p className="text-slate-400 text-xs font-mono tracking-wider uppercase">
            UCI STOCKFISH 18 • BATTLE PLATFORM
          </p>
        </div>

        {/* Card Frame */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-slate-800 text-cyan-400 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-slate-800 text-cyan-400 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="grandmaster or name@email.com"
                    value={loginUserOrEmail}
                    onChange={(e) => setLoginUserOrEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all flex items-center justify-center gap-2 group active:scale-[0.99] disabled:opacity-50"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="chess_master99"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Magnus Carlsen"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="player@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 4 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all flex items-center justify-center gap-2 group active:scale-[0.99] disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : 'Register & Enter Arena'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 bg-slate-900 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
              OR CONNECT WITH OAUTH
            </span>
          </div>

          {/* Google OAuth Section */}
          <div className="space-y-3">
            <GoogleOAuthButton onSuccess={handleGoogleSuccess} isLoading={isLoading} />

            {/* Quick Demo Guest Login */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl text-xs font-semibold transition-all hover:border-indigo-500/50"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Quick Access as Demo Grandmaster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
