import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, AlertCircle, Loader2, ShieldCheck, User } from 'lucide-react';

interface LoginPageProps {
  navigate: (view: string, param?: string | number) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('home');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign in to Smart Civic</h1>
        <p className="text-xs text-slate-500">
          Access your citizen complaints or municipal administration console.
        </p>
      </div>

      {/* Quick Demo Logins for Examiner / Tester */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
        <div className="font-semibold text-blue-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>Quick Evaluation Credentials:</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => fillQuickDemo('citizen.rahul@smartcivic.gov.in', 'Citizen@2026')}
            className="p-2 bg-white rounded border border-blue-200 hover:border-blue-400 text-left cursor-pointer transition-colors"
          >
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-600" />
              <span>Citizen Demo</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate font-mono">citizen.rahul@...</div>
          </button>

          <button
            type="button"
            onClick={() => fillQuickDemo('admin@smartcivic.gov.in', 'Admin@2026')}
            className="p-2 bg-white rounded border border-blue-200 hover:border-blue-400 text-left cursor-pointer transition-colors"
          >
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>Admin Officer</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate font-mono">admin@smartcivic...</div>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 pl-9 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 pl-9 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Don't have a citizen account yet?{' '}
        <button
          onClick={() => navigate('register')}
          className="font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          Register here
        </button>
      </div>
    </div>
  );
};
