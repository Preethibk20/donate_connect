import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <h1 className="text-3xl font-extrabold text-white">403 - Access Denied</h1>

      <p className="text-slate-400 text-sm leading-relaxed">
        You do not have the required role or permissions to access this page. Please contact an administrator or sign in with an authorized account.
      </p>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Switch Account
        </Link>
      </div>
    </div>
  );
};
