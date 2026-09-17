import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';
import { DEFAULT_LOGO } from '../utils/assetResolver';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@jubilantmetal.com');
  const [password, setPassword] = useState('password123');
  const { login, switchRole } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Error', 'Please enter your work email');
      return;
    }
    const loggedIn = login(email);
    if (loggedIn) {
      success('Welcome back', `Logged in successfully to Jubilant ERP`);
      navigate('/dashboard');
    } else {
      error('Login failed', 'User with this email not found. Please select a quick demo user.');
    }
  };

  const handleQuickLogin = (role: UserRole, demoEmail: string) => {
    switchRole(role);
    success('Quick Role Switched', `Logged in as ${role.replace('_', ' ').toUpperCase()}`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        {/* Brand Logo */}
        <div className="inline-block p-4 bg-white/95 rounded-2xl shadow-2xl mb-4 backdrop-blur-md border border-slate-700/50">
          <img
            src={DEFAULT_LOGO}
            alt="Jubilant Metal and Alloys"
            className="h-14 w-auto max-w-[280px] object-contain mx-auto"
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
          Quotation & Billing Management System
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Internal B2B Commercial Enterprise Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-950/90 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800 backdrop-blur-xl">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jubilantmetal.com"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-red-500 mr-2"
                />
                Remember this workstation
              </label>
              <span className="text-red-400 hover:text-red-300 cursor-pointer">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all hover:shadow-red-600/50"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick 1-Click Evaluation Logins:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin@jubilantmetal.com')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-200">Administrator</p>
                  <p className="text-[10px] text-slate-500">Full System Access</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-red-500" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales_manager', 'vikram.m@jubilantmetal.com')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-200">Sales Manager</p>
                  <p className="text-[10px] text-slate-500">Quotes & Catalog</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales_executive', 'anjali.d@jubilantmetal.com')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-200">Sales Executive</p>
                  <p className="text-[10px] text-slate-500">Quotes & Drafting</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer', 'viewer@jubilantmetal.com')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-200">Auditor / Viewer</p>
                  <p className="text-[10px] text-slate-500">Read-only Reports</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Jubilant Metal and Alloys. All rights reserved.
        </p>
      </div>
    </div>
  );
};
