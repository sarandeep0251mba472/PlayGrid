import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { firebaseUser, authReady, isAdmin, isAccountDeactivated, logout } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading PlayGrid...
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (isAccountDeactivated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 dark:border-red-900/60 dark:bg-slate-900">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Account Deactivated
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your PlayGrid account has been deactivated by a campus administrator. Contact DGU student sports support if you believe this is a mistake.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
