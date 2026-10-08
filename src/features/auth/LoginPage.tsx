import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Activity,
  Users,
} from 'lucide-react';
import { useAuthStore } from './authStore';
import { SEED_USERS } from '../../api/seedData';
import { useToastStore } from '../../components/ui/Toast';
import { LanguageSelector } from '../../components/common/LanguageSelector';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('mohammedashraf@brandcrock.com');
  const [password, setPassword] = useState('••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const success = login(identifier);
      setIsLoading(false);
      if (success) {
        showToast({ type: 'success', message: 'Signed in successfully' });
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please select one of the demo accounts below.');
      }
    }, 350);
  };

  const handleSelectDemo = (userId: number) => {
    const user = SEED_USERS.find((u) => u.id === userId);
    if (!user) return;

    setIdentifier(user.email);
    setPassword('password123');
    setIsLoading(true);

    setTimeout(() => {
      login(user.id);
      setIsLoading(false);
      showToast({
        type: 'success',
        message: `Welcome ${user.name}! Signed in as ${user.role === 'HR_ADMIN' ? 'HR / Admin' : user.role.toLowerCase()}.`,
      });
      navigate('/dashboard');
    }, 250);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col md:flex-row select-none">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Sign In Form + Demo Accounts (Matching Video Frame 0) */}
      {/* ========================================================================= */}
      <div className="w-full md:w-[54%] lg:w-[50%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 z-10 bg-white">
        {/* Top-Left Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <img
            src="/brandcrock-logo.png"
            alt="BrandCrock Logo"
            className="h-10 sm:h-12 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
              BrandCrock
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-wide mt-1">
              Gateway To Digital Brand
            </span>
          </div>
        </div>

        {/* Form Center Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {/* brandhr Stylized Brand Mark */}
          <div className="flex flex-col items-center justify-center mb-6 text-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-sm">
                <img
                  src="/brandcrock-logo.png"
                  alt="BrandCrock"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="text-2xl font-bold tracking-tight text-teal-700 flex items-baseline">
                <span>brand</span>
                <span className="text-teal-900 font-black">hr</span>
                <span className="text-[11px] font-semibold text-emerald-600 ml-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200">
                  OKR Portal
                </span>
              </div>
            </div>
          </div>

          {/* Heading + Language Dropdown Row */}
          <div className="flex items-center justify-between mb-6 pb-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Welcome! Sign in to start
            </h1>
            <LanguageSelector theme="light" />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="mohammedashraf@brandcrock.com"
                  className="w-full h-12 px-4 rounded-xl bg-slate-100/70 border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 px-4 pr-11 rounded-xl bg-slate-100/70 border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() =>
                  showToast({
                    type: 'info',
                    message: 'Use one of the instant demo logins below to sign in immediately.',
                  })
                }
                className="text-xs font-medium text-[#2d8fd8] hover:text-[#1e88e5] hover:underline"
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#222222] hover:bg-[#111111] active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              {!isLoading && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          {/* ========================================================================= */}
          {/* DEMO LOGIN FOR THREE OF THEM (Requirement: "with demo login for three of em") */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Select Demo Account (1-Click Login)
              </span>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-semibold border border-teal-200">
                Live Prototype
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Demo Account 1: Mohammed Ashraf (Employee) */}
              <button
                type="button"
                onClick={() => handleSelectDemo(1)}
                className="w-full p-3 rounded-2xl border border-slate-200/90 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/40 transition-all text-left flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    MA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 flex items-center gap-2">
                      <span>Mohammed Ashraf</span>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        Employee
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      mohammedashraf@brandcrock.com · Sales Executive
                    </div>
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>

              {/* Demo Account 2: Ravi Menon (Manager) */}
              <button
                type="button"
                onClick={() => handleSelectDemo(2)}
                className="w-full p-3 rounded-2xl border border-slate-200/90 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/40 transition-all text-left flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    RM
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 flex items-center gap-2">
                      <span>Ravi Menon</span>
                      <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.2 rounded-full border border-sky-200">
                        Manager
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ravi.menon@brandcrock.com · Sales Team Lead (Approvals L1)
                    </div>
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>

              {/* Demo Account: Santhiya (Manager - Video Reference) */}
              <button
                type="button"
                onClick={() => handleSelectDemo(10)}
                className="w-full p-3 rounded-2xl border border-teal-200/90 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50/80 transition-all text-left flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-600 border border-teal-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    S
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900 flex items-center gap-2">
                      <span>Santhiya</span>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/90 px-2 py-0.2 rounded-full border border-teal-300">
                        Manager
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-800/80 mt-0.5">
                      santhiya@profitokrs.com · Strategy & Growth Lead
                    </div>
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-teal-600 group-hover:text-teal-800 transition-colors" />
              </button>

              {/* Demo Account 3: Priya Nair (HR/Admin) */}
              <button
                type="button"
                onClick={() => handleSelectDemo(3)}
                className="w-full p-3 rounded-2xl border border-slate-200/90 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/40 transition-all text-left flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    PN
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 flex items-center gap-2">
                      <span>Priya Nair</span>
                      <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.2 rounded-full border border-purple-200">
                        HR / Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      priya.nair@brandcrock.com · HR Manager (Cycles, Workflows & L2)
                    </div>
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 pt-4">
          BrandCrock HRMS &copy; 2026. All rights reserved. Enterprise OKR Platform.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Turquoise Gradient Panel with Floating UI Cards (Matching Video) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex md:w-[46%] lg:w-[50%] p-6 lg:p-8 relative overflow-hidden items-center justify-center bg-slate-100">
        <div
          className="w-full h-full rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-8 lg:p-12 shadow-2xl"
          style={{
            background:
              'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 25%, #0d9488 60%, #0f766e 100%)',
          }}
        >
          {/* Subtle Organic Background Curves (SVG Waves matching video background) */}
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 800 800"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="400" cy="200" r="300" stroke="white" strokeWidth="1.5" opacity="0.3" />
              <circle cx="400" cy="400" r="450" stroke="white" strokeWidth="1.5" opacity="0.2" />
              <path
                d="M -100 200 C 200 150, 400 450, 900 250"
                stroke="white"
                strokeWidth="2"
                opacity="0.4"
              />
              <path
                d="M -50 500 C 300 350, 500 700, 950 450"
                stroke="white"
                strokeWidth="2"
                opacity="0.3"
              />
            </svg>
          </div>

          {/* Floating UI Elements matching Video Frame 0 */}
          <div className="w-full max-w-md relative z-10 space-y-5">
            {/* Top Donut & Metric Floating Card */}
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl p-5 text-white shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Q4 Performance Progress</div>
                    <div className="text-[10px] text-white/70">Company-wide OKRs</div>
                  </div>
                </div>
                <span className="text-xs font-bold bg-white/25 px-2 py-0.5 rounded-full border border-white/30">
                  +18.4%
                </span>
              </div>

              {/* Progress Ring & Stats */}
              <div className="flex items-center justify-around py-1">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-white/20"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-white"
                      strokeDasharray="78, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-black">78%</span>
                    <span className="text-[8px] text-white/80 uppercase">Target</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                    <span className="text-white/90">Objectives Achieved: 24</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                    <span className="text-white/90">In Progress: 18</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                    <span className="text-white/90">Under Review: 6</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Performance Trend Card */}
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-5 text-white shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white/90">Key Results Velocity</span>
                <span className="text-[10px] text-white/70">Weekly Check-in Sync</span>
              </div>
              <div className="h-14 flex items-end gap-2 pt-2 px-1">
                {[45, 60, 52, 70, 68, 85, 92, 98].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-white/40 hover:bg-white rounded-t-md transition-all duration-300"
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Employee & HR Card */}
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl p-4 text-white shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/25 flex items-center justify-center font-bold text-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold">BrandCrock HRMS Integration</div>
                  <div className="text-[10px] text-white/80">Attendance, Leaves & OKRs Unified</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-950 bg-emerald-200/90 px-2.5 py-1 rounded-full shadow-sm">
                Active Sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
