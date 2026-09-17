import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  ReceiptText,
  FileCheck2,
  Users,
  Package,
  Layers,
  FileCode2,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { DEFAULT_LOGO } from '../../utils/assetResolver';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Quotations', icon: FileText, path: '/quotations' },
    { label: 'Create Quotation', icon: FilePlus2, path: '/quotations/new', highlight: true },
    { label: 'Proforma Invoices', icon: ReceiptText, path: '/proformas' },
    { label: 'Create Proforma', icon: FileCheck2, path: '/proformas/new', highlight: true },
    { label: 'Customers', icon: Users, path: '/customers' },
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Categories', icon: Layers, path: '/categories' },
    { label: 'Templates', icon: FileCode2, path: '/templates' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
    { label: 'Users & Roles', icon: ShieldCheck, path: '/users' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as UserRole);
  };

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-950 text-slate-200 select-none border-r border-slate-800">
      {/* Top Brand Logo Section */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white rounded-xl px-2.5 py-1.5 shadow-sm flex items-center justify-center border border-white/10">
              <img
                src={DEFAULT_LOGO}
                alt="Jubilant Metal and Alloys"
                className={collapsed ? "h-7 w-7 object-contain" : "h-8 w-auto max-w-[165px] object-contain shrink-0"}
              />
            </div>
          </div>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/30 font-semibold'
                      : item.highlight
                      ? 'text-red-400 hover:bg-slate-900 hover:text-red-300 font-semibold border border-red-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                    item.highlight ? 'text-red-500' : ''
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Role Switcher */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        {!collapsed && (
          <div className="mb-2 px-1">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-red-400" /> Demo Role
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <select
              value={user.role}
              onChange={handleRoleChange}
              className="w-full bg-slate-900 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="admin">Administrator (Full Access)</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="sales_executive">Sales Executive</option>
              <option value="viewer">Viewer (Read Only)</option>
            </select>
          </div>
        )}

        {/* User Card */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 ${
            collapsed ? 'flex-col gap-2 p-1.5' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-in-out z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`fixed top-0 bottom-0 left-0 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-200`}>
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
