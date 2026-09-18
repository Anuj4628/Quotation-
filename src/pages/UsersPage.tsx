import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit3,
  UserCheck,
  Check,
  X,
  Mail,
  Phone,
  Shield,
  Trash2,
} from 'lucide-react';
import { storage } from '../services/storage';
import { User, UserRole } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [isActive, setIsActive] = useState(true);

  const users = useMemo(() => storage.getUsers(), [refreshKey]);

  const permissionMatrix: Record<
    UserRole,
    { label: string; desc: string; permissions: string[] }
  > = {
    admin: {
      label: 'Administrator',
      desc: 'Complete full access to all quotations, company profile, database, and settings',
      permissions: [
        'Create & Edit Quotations',
        'Delete Quotations',
        'Manage Products Catalog',
        'Manage Customers CRM',
        'Configure Company & GST',
        'Manage Users & Roles',
        'Export Data & Financial Reports',
      ],
    },
    sales_manager: {
      label: 'Sales Manager',
      desc: 'Supervises sales team, manages quotations, customers, and views reports',
      permissions: [
        'Create & Edit Quotations',
        'Manage Products Catalog',
        'Manage Customers CRM',
        'Change Quotation Status',
        'View Commercial Reports',
      ],
    },
    sales_executive: {
      label: 'Sales Executive',
      desc: 'Drafts and issues quotations to customers based on catalog rates',
      permissions: [
        'Create New Quotations',
        'Edit Draft Quotations',
        'Print & Share Quotations',
        'View Products Catalog',
      ],
    },
    viewer: {
      label: 'Viewer / Auditor',
      desc: 'Read-only access to view quotations and reports without editing capability',
      permissions: ['View Quotations', 'View Reports', 'Download Official PDFs'],
    },
  };

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('admin');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(u.role);
    setIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      error('Validation Error', 'Name and Email are required');
      return;
    }

    if (editingUser) {
      storage.updateUser(editingUser.id, { name, email, phone, role, isActive });
      success('User Updated', `Updated profile for ${name}`);
    } else {
      storage.createUser({ name, email, phone, role, isActive });
      success('User Added', `Created user account for ${name}`);
    }

    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            User Roles & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Role-based security controls for sales executives, managers, and administrators.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Team Member</span>
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Active Team Accounts</h2>
          <p className="text-xs text-slate-500">Authorized operators of the quotation software</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = Boolean(currentUser && u.id === currentUser.id);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{u.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold text-[9px] rounded uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">ID: {u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{u.email}</td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit user details"
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Matrix Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Role Capabilities Matrix</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {Object.entries(permissionMatrix).map(([roleKey, details]) => (
            <div
              key={roleKey}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{details.label}</span>
                <ShieldCheck className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-slate-500 text-[11px] min-h-[32px]">{details.desc}</p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                {details.permissions.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit User Account' : 'Add Team Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@jubilantmetal.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role & Permissions</label>
                <select
                  value={role}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold outline-none cursor-not-allowed"
                >
                  <option value="admin">Administrator (Full System Access)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="userActive" className="font-semibold text-slate-700 cursor-pointer">
                  Account is Active
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
