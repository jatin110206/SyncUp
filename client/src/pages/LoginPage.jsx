import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      await login({ email, password });
      navigate('/app');
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-dark-950 flex flex-col md:flex-row overflow-hidden">
      {/* Left Hero Branding Section */}
      <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-950 to-brand-950/40 border-r border-white/10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-violet/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-violet flex items-center justify-center shadow-lg shadow-brand-600/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-wider">SyncUp</span>
        </div>

        {/* Tagline Hero */}
        <div className="my-12 md:my-0 z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-300">
            <span>✨ Real-Time Communication Platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Connect. <br />
            Communicate. <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-accent-cyan bg-clip-text text-transparent">
              SyncUp.
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md leading-relaxed">
            Experience lightning-fast 1-on-1 chats, group collaboration, media sharing, and instant presence tracking.
          </p>
        </div>

        {/* Footer Quote */}
        <div className="text-xs text-slate-500 z-10">
          © {new Date().getFullYear()} SyncUp Inc. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="w-full md:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-dark-950 relative">
        <div className="w-full max-w-md space-y-8 glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your account</p>
          </div>

          {(error || localError) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 font-semibold hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
