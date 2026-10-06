import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import {
  Menu,
  Search,
  Plus,
  Building2,
  Bell,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const company = storage.getCompany();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="lg:hidden flex items-center gap-2">
              <span className="font-display font-bold text-sm text-slate-900 tracking-tight">
                Quotation Billing Software
              </span>
            </div>

            {/* Global Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/90 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 transition-all border border-slate-200 text-xs w-64 md:w-80 justify-between group"
            >
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-[#0D5C46] transition-colors" />
                <span>Search quotations, clients, alloys...</span>
              </span>
              <kbd className="font-mono text-[10px] font-semibold bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200 text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons & Primary CTA */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Company Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-[#0D5C46]" />
              <span>GST: {company.gstin}</span>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/proformas/new')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-soft transition-all"
                title="Create Commercial Proforma Invoice"
              >
                <Plus className="w-3.5 h-3.5 text-[#BC9647]" />
                <span>New Proforma</span>
              </button>

              <button
                onClick={() => navigate('/quotations/new')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D5C46] hover:bg-[#084434] active:bg-[#052F24] text-white font-semibold text-xs shadow-md shadow-[#0D5C46]/20 transition-all hover:shadow-lg hover:shadow-[#0D5C46]/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">New Quotation</span>
              </button>
            </div>

            {/* Current Role Badge */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Administrator'}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0D5C46] bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                  {user?.role ? user.role.replace('_', ' ') : 'Administrator'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Keyboard Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
