import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { QuotationEditorPage } from './pages/QuotationEditorPage';
import { QuotationDetailPage } from './pages/QuotationDetailPage';
import { ProformasPage } from './pages/ProformasPage';
import { ProformaEditorPage } from './pages/ProformaEditorPage';
import { ProformaDetailPage } from './pages/ProformaDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Verifying workstation session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicLoginRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

export const App: React.FC = () => {
  const isDesktop = typeof window !== 'undefined' && (window.location.protocol === 'file:' || Boolean(window.electronAPI?.isElectron));
  const RouterComponent = isDesktop ? HashRouter : BrowserRouter;

  return (
    <RouterComponent>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicLoginRoute />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="quotations/new" element={<QuotationEditorPage />} />
              <Route path="quotations/:id" element={<QuotationDetailPage />} />
              <Route path="quotations/:id/edit" element={<QuotationEditorPage />} />
              <Route path="proformas" element={<ProformasPage />} />
              <Route path="proformas/new" element={<ProformaEditorPage />} />
              <Route path="proformas/:id" element={<ProformaDetailPage />} />
              <Route path="proformas/:id/edit" element={<ProformaEditorPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </RouterComponent>
  );
};

export default App;
