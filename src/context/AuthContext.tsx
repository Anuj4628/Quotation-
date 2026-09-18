import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthResponse } from '../types';
import { storage } from '../services/storage';

interface AuthContextValue {
  user: User;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  switchRole?: (role: UserRole) => void;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify persistent session on application start
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const token = storage.getAuthToken();
        if (token) {
          const verification = await storage.authVerifySession(token);
          if (isMounted) {
            if (verification.valid && verification.user) {
              setUser(verification.user);
              setIsAuthenticated(true);
              setUsers(storage.getUsers());
            } else {
              storage.setAuthToken(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          if (isMounted) {
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    const res = await storage.authLogin({ username, password });
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      setUsers(storage.getUsers());
    }
    return res;
  };

  const logout = async (): Promise<void> => {
    await storage.authLogout();
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
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
