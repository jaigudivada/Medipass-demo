import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AppHeaderProps {
  roleName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ roleName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2 group no-underline">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
              M
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              MediPass
            </span>
          </Link>
          
          {roleName && (
            <span className="text-xs text-slate-500 font-medium border-l border-slate-200 pl-3">
              {roleName} Portal
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-semibold text-slate-900 block">{user.name}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors py-1.5 px-3 rounded-lg border border-slate-200 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            !isHome && (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1.5 px-3 rounded-lg border border-blue-200 bg-blue-50 no-underline"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )
          )}
        </div>

      </div>
    </header>
  );
};

