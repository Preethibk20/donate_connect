import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';
import { LoginRequest } from '../types';
import { LogIn, Mail, Lock, HeartHandshake, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'DONOR' | 'NGO' | 'ADMIN' | 'VOLUNTEER'>('DONOR');
  
  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginRequest>();

  const handleRoleSelect = (role: 'DONOR' | 'NGO' | 'ADMIN' | 'VOLUNTEER') => {
    setSelectedRole(role);
    // Auto-fill demo credentials to make testing easier
    if (role === 'DONOR') {
      setValue('email', 'priya.patel@gmail.com');
      setValue('password', 'donor123');
    } else if (role === 'NGO') {
      setValue('email', 'contact@goonj.org');
      setValue('password', 'password123');
    } else if (role === 'ADMIN') {
      setValue('email', 'admin@donateconnect.in');
      setValue('password', 'admin123');
    } else if (role === 'VOLUNTEER') {
      setValue('email', 'delivery@example.com');
      setValue('password', 'driver123');
    }
  };

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await login(data);
      if (res.requiresOtp) {
        setShowOtp(true);
        setLoginEmail(data.email);
      } else {
        routeUser(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await verifyOtp({ email: loginEmail, otp: otpCode });
      routeUser(user);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const routeUser = (user: any) => {
      if (user.role === 'DONOR') {
        navigate('/donations');
      } else if (user.role === 'NGO') {
        navigate('/ngo-dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'VOLUNTEER') {
        navigate('/driver-dashboard');
      } else if (user.role === 'CORPORATE') {
        navigate('/csr-dashboard');
      } else {
        navigate('/');
      }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <HeartHandshake className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {showOtp ? 'Verify OTP' : selectedRole === 'ADMIN' ? 'Admin Portal' : selectedRole === 'NGO' ? 'NGO Portal' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {showOtp ? `Enter the 6-digit code sent to ${loginEmail}` : 'Sign in to your DonateConnect account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {!showOtp ? (
          <>
            {/* Role Selector Tabs */}
            <div className="flex p-1 bg-slate-950/50 rounded-xl mb-8 border border-slate-800/50">
              <button
                type="button"
                onClick={() => handleRoleSelect('DONOR')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'DONOR'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('NGO')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'NGO'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                NGO
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('VOLUNTEER')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'VOLUNTEER'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('ADMIN')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('password', { required: 'Password is required' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                {errors.password && (
                  <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-400 font-semibold hover:underline inline-flex items-center gap-0.5">
                  Register as Donor <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                6-Digit OTP Code
              </label>
              <div className="relative pt-2">
                <OtpInput value={otpCode} onChange={setOtpCode} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Verify & Login'
              )}
            </button>
            <button
              type="button"
              onClick={() => { setShowOtp(false); setError(null); }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all flex items-center justify-center mt-2"
            >
              Cancel & Go Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
