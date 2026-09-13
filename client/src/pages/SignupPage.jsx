import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, Upload, Check } from 'lucide-react';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, login, isLoading, error } = useAuthStore();

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-indigo-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!firstname || !lastname || !email || !password) {
      setLocalError('First name, last name, email, and password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signup({ firstname, lastname, username, email, password, profileImage });
      // Automatically log in after registration
      await login({ email, password });
      navigate('/app');
    } catch (err) {
      setLocalError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-dark-950 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-violet flex items-center justify-center shadow-lg shadow-brand-600/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create your SyncUp Account</h2>
              <p className="text-xs text-slate-400">Join real-time conversations in seconds</p>
            </div>
          </div>
        </div>

        {(error || localError) && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image Upload Preview */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
              {profileImage ? (
                <img src={profileImage} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-white block">Profile Picture (Optional)</span>
              <span className="text-[11px] text-slate-400 block">PNG, JPG up to 5MB</span>
            </div>
            <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white cursor-pointer transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Name Fields Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          {/* Custom Unique User ID Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Unique User ID (Optional)</span>
              <span className="text-[10px] text-slate-400 font-mono">Custom Handle</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jatin_dev (auto-assigned if empty)"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono text-white"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm"
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Strength:</span>
                <span className="font-semibold text-white">{strength.label}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
