import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';

interface AuthContextValue {
  user: User;
  users: User[];
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: PermissionKey) => boolean;
}

export type PermissionKey =
  | 'create_quotation'
  | 'edit_quotation'
  | 'delete_quotation'
  | 'view_quotations'
  | 'manage_products'
  | 'manage_customers'
  | 'manage_settings'
  | 'manage_users'
  | 'view_reports';

const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: [
    'create_quotation',
    'edit_quotation',
    'delete_quotation',
    'view_quotations',
    'manage_products',
    'manage_customers',
    'manage_settings',
    'manage_users',
    'view_reports',
  ],
  sales_manager: [
    'create_quotation',
    'edit_quotation',
    'view_quotations',
    'manage_products',
    'manage_customers',
    'view_reports',
  ],
  sales_executive: [
    'create_quotation',
    'edit_quotation',
    'view_quotations',
  ],
  viewer: [
    'view_quotations',
    'view_reports',
  ],
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => storage.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());

  useEffect(() => {
    storage.setCurrentUser(user);
  }, [user]);

  const login = (email: string, role?: UserRole): boolean => {
    const allUsers = storage.getUsers();
    let found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found && role) {
      found = allUsers.find((u) => u.role === role);
    }
    if (found) {
      setUser(found);
      storage.setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    // switch to first viewer or default
    const viewers = users.find((u) => u.role === 'viewer') || users[0];
    setUser(viewers);
    storage.setCurrentUser(viewers);
  };

  const switchRole = (role: UserRole) => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setUser(targetUser);
      storage.setCurrentUser(targetUser);
    }
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, switchRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
