import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVerifiedNgos } from '../api/ngoApi';
import { NGOProfile } from '../types';
import { UrgentNeedsBanner } from '../components/UrgentNeedsBanner';
import {
  HeartHandshake,
  ArrowRight,
  Zap,
  Building2,
  ShieldCheck,
  MapPin,
  Phone
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVerifiedNgos()
      .then((data: NGOProfile[]) => setNgos(data.slice(0, 3)))
      .catch(() => setNgos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getVerifiedNgos()
      .then((data: NGOProfile[]) => setNgos(data.slice(0, 3)))
      .catch(() => setNgos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12 py-8">
      {/* Urgent Appeal Campaigns Banner */}
      <UrgentNeedsBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/90 via-slate-900 to-slate-900 border border-slate-800 p-8 sm:p-12 lg:p-16">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold" style={{ color: '#A5B4FC' }}>
            <Zap className="w-3.5 h-3.5 text-indigo-300" />
            <span>Verified NGO & Community Relief Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight" style={{ color: '#FFFFFF' }}>
            Connecting Generosity With{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-rose-300 bg-clip-text text-transparent" style={{ color: '#C084FC' }}>
              Verified NGOs
            </span>
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium" style={{ color: '#E2E8F0' }}>
            DonateConnect helps donors share essential items with verified NGO partners, track requests, and support community needs with confidence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/donate/new"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all flex items-center gap-2"
              style={{ color: '#FFFFFF' }}
            >
              <HeartHandshake className="w-5 h-5 text-white" />
              Donate Now
            </Link>
            <Link
              to="/impact"
              className="px-6 py-3.5 rounded-xl bg-white text-[#111827] font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-md"
              style={{ color: '#111827' }}
            >
              View Impact Analytics <ArrowRight className="w-4 h-4 text-[#111827]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Verified NGOs Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-400" />
              Verified NGO Partners
            </h2>
            <p className="text-slate-400 text-sm">Public verified organizations accepting donations</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading verified NGOs...</p>
          </div>
        ) : ngos.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-slate-300 font-semibold">No verified NGOs registered yet</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Admins can register and verify NGO partners from the admin dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ngos.map((ngo) => (
              <div key={ngo.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified NGO
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{ngo.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                    {ngo.description || 'Verified non-governmental partner organization.'}
                  </p>
                </div>
                <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{ngo.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{ngo.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
