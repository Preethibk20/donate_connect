import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Home,
  LogIn,
  UserPlus,
  Shield,
  Building2,
  BarChart3,
  MapPin,
  Truck,
  Lock,
  Cpu,
  Recycle,
  Mic,
  ChevronDown,
} from 'lucide-react';
import { HealthBadge } from './HealthBadge';
import { NotificationBell } from './NotificationBell';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import { ProfileDropdown } from './ProfileDropdown';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isNgo = user?.role === 'NGO';
  const isAdmin = user?.role === 'ADMIN';
  const isVolunteer = user?.role === 'VOLUNTEER';
  const isCorporate = user?.role === 'CORPORATE';

  const navLinkClass = (path: string) =>
    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
      isActive(path)
        ? 'bg-[#7567E8] text-white shadow-sm font-bold'
        : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F4F2FA]'
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#7567E8] flex items-center justify-center shadow-md shadow-[#7567E8]/20 group-hover:scale-105 transition-transform duration-200">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-[#111827]">
                  DonateConnect
                </span>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-[#7567E8] -mt-1">
                  {isAdmin
                    ? 'Admin Console'
                    : isNgo
                    ? 'NGO Portal'
                    : isVolunteer
                    ? 'Driver Console'
                    : isCorporate
                    ? 'CSR Console'
                    : 'Platform'}
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#F9FAFB] p-1.5 rounded-full border border-[#E5E7EB]">
              <Link to="/" className={navLinkClass('/')}>
                <Home className="w-3.5 h-3.5" /> Home
              </Link>

              <Link to="/map" className={navLinkClass('/map')}>
                <MapPin className="w-3.5 h-3.5" /> Map
              </Link>

              <Link to="/lockers" className={navLinkClass('/lockers')}>
                <Lock className="w-3.5 h-3.5" /> Lockers
              </Link>

              <Link to="/impact" className={navLinkClass('/impact')}>
                <BarChart3 className="w-3.5 h-3.5" /> Impact
              </Link>

              <Link to="/blockchain-ledger" className={navLinkClass('/blockchain-ledger')}>
                <Cpu className="w-3.5 h-3.5" /> Blockchain
              </Link>

              <Link to="/circular-market" className={navLinkClass('/circular-market')}>
                <Recycle className="w-3.5 h-3.5" /> Circular
              </Link>

              {isVolunteer && (
                <Link to="/driver-dashboard" className={navLinkClass('/driver-dashboard')}>
                  <Truck className="w-3.5 h-3.5" /> Driver
                </Link>
              )}

              {isCorporate && (
                <Link to="/csr-dashboard" className={navLinkClass('/csr-dashboard')}>
                  <Building2 className="w-3.5 h-3.5" /> CSR
                </Link>
              )}
            </nav>

            {/* User Auth & Voice Assistant Trigger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVoiceModal(true)}
                title="Voice AI Booking Assistant"
                className="p-2 rounded-xl bg-[#7567E8]/10 hover:bg-[#7567E8]/20 text-[#7567E8] border border-[#7567E8]/20 transition-colors"
              >
                <Mic className="w-4 h-4" />
              </button>

              {isAuthenticated && <NotificationBell />}
              <HealthBadge />

              {/* Divider */}
              <div className="w-px h-5 bg-[#E5E7EB] shrink-0" />

              {isAuthenticated && user ? (
                <div className="relative">
                  {/* Profile trigger button */}
                  <button
                    onClick={() => setProfileOpen((prev) => !prev)}
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                    title="Account menu"
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-[#F4F2FA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7567E8]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#7567E8] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                      {(user.fullName ? user.fullName : user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="block text-xs font-bold text-[#111827] leading-tight">
                        {user.fullName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7567E8] uppercase tracking-wider">
                        <Shield className="w-2.5 h-2.5" />
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#4B5563] transition-transform duration-150 ${
                        profileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown */}
                  <ProfileDropdown
                    isOpen={profileOpen}
                    onClose={() => setProfileOpen(false)}
                  />
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F9FAFB] text-[#111827] font-semibold text-xs transition-colors border border-[#E5E7EB] flex items-center gap-1.5 shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#4B5563]" />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-xl bg-[#7567E8] hover:bg-[#7567E8]/90 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showVoiceModal && <VoiceAssistantModal onClose={() => setShowVoiceModal(false)} />}
    </>
  );
};
