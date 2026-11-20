import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      navigate(user.role === 'admin' ? '/dashboard' : '/welcome', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-card p-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF0FF] text-[#1E3A8A] flex items-center justify-center mb-3">
            <Boxes className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
            Inventory Management System
          </span>
          <h1 className="text-2xl font-semibold text-[#111827] mt-1">Sign in to IMS</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Enter your admin-assigned credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-[10px] border border-[#DC2626]/30 bg-[#FFF1F2] px-3.5 py-2.5 text-xs text-[#DC2626]"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-username" className="block text-xs font-medium text-[#374151] mb-1.5">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-[10px] border border-[#E5E7EB] pl-10 pr-3.5 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-[#374151] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-[10px] border border-[#E5E7EB] pl-10 pr-10 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1E3A8A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 rounded-[10px] bg-[#1E3A8A] hover:bg-[#172E6E] text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
