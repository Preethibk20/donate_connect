import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, HeartHandshake, LogOut, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DonorProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-[#E5E7EB]">
          <div className="w-24 h-24 rounded-full bg-[#7567E8] flex items-center justify-center text-white font-bold text-4xl shadow-md shadow-[#7567E8]/20 shrink-0">
            {initial}
          </div>
          <div className="text-center sm:text-left pt-2">
            <h1 className="text-3xl font-extrabold text-[#111827] mb-2">{user.fullName || 'Generous Donor'}</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7567E8]/10 text-[#7567E8] font-bold text-xs uppercase tracking-wider border border-[#7567E8]/20">
              <Shield className="w-3.5 h-3.5" />
              {user.role}
            </span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-[#4B5563] mb-1">
              <User className="w-5 h-5 text-[#7567E8]" />
              <span className="text-sm font-semibold uppercase tracking-wider">Full Name</span>
            </div>
            <p className="text-lg font-bold text-[#111827] pl-8">{user.fullName || 'Not provided'}</p>
          </div>

          <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-[#4B5563] mb-1">
              <Mail className="w-5 h-5 text-[#7567E8]" />
              <span className="text-sm font-semibold uppercase tracking-wider">Email Address</span>
            </div>
            <p className="text-lg font-bold text-[#111827] pl-8">{user.email}</p>
          </div>
        </div>

        {/* Quick Links / Actions */}
        <div className="pt-6 border-t border-[#E5E7EB]">
          <h2 className="text-lg font-bold text-[#111827] mb-4">Quick Links</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/donations" 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F4F2FA] hover:bg-[#EAE6F5] text-[#7567E8] font-bold rounded-xl transition-colors border border-[#7567E8]/20"
            >
              <HeartHandshake className="w-5 h-5" />
              View My Donations
              <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
            </Link>
            
            <button 
              onClick={() => logout()}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FEE2E2] text-[#DC2626] font-bold rounded-xl transition-colors border border-[#DC2626]/20 shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
