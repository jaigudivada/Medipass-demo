import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Building2, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

interface RequireAuthProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { firebaseUser, role, isHospitalInactive, logout, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-medium text-slate-500">Verifying session...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Block staff from accessing operational dashboard if their hospital is inactive
  if (isHospitalInactive && role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Hospital Inactive</span>
            </h2>
            <p className="text-base font-semibold text-red-300">
              Your Hospital is currently inactive on MediPass.
            </p>
            <p className="text-xs text-slate-400">
              Please contact your hospital administrator to re-activate service.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="w-full bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Authenticated user trying to access wrong role's dashboard -> redirect to their own dashboard
    const routeMap: Record<UserRole, string> = {
      patient: '/patient',
      doctor: '/doctor',
      receptionist: '/reception',
      admin: '/admin',
    };
    return <Navigate to={routeMap[role] || '/'} replace />;
  }

  return children;
};
