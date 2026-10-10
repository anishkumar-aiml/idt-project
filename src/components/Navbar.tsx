import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  PlusCircle,
  Search,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  navigate: (view: string, param?: string | number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, navigate }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    navigate(view);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('home');
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight block leading-tight">
                Smart Civic
              </span>
              <span className="text-[11px] font-medium text-emerald-700 tracking-wide uppercase block">
                Complaint System
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNav('home')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'home'
                  ? 'text-blue-700 bg-blue-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNav('report')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentView === 'report'
                  ? 'text-blue-700 bg-blue-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Report a Problem</span>
            </button>

            <button
              onClick={() => handleNav('track')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentView === 'track'
                  ? 'text-blue-700 bg-blue-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Track Complaint</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={() => handleNav(isAdmin ? 'admin-dashboard' : 'citizen-dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  currentView === 'citizen-dashboard' || currentView === 'admin-dashboard'
                    ? 'text-blue-700 bg-blue-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-700" />
                <span>{isAdmin ? 'Admin Console' : 'My Complaints'}</span>
              </button>
            )}
          </nav>

          {/* Right Action / Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1.5">
                    {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />}
                    <span>{user?.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    {user?.role} Portal
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all shadow-blue-600/10"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Home
          </button>
          <button
            onClick={() => handleNav('report')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Report a Problem</span>
          </button>
          <button
            onClick={() => handleNav('track')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span>Track Complaint</span>
          </button>
          {isAuthenticated && (
            <button
              onClick={() => handleNav(isAdmin ? 'admin-dashboard' : 'citizen-dashboard')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-700" />
              <span>{isAdmin ? 'Admin Console' : 'My Complaints Dashboard'}</span>
            </button>
          )}

          <div className="pt-3 border-t border-slate-100 mt-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 text-xs text-slate-500">
                  Signed in as <strong className="text-slate-800">{user?.name}</strong> ({user?.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2 text-center text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full py-2 text-center text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
