import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getNgoById } from '../api/ngoApi';
import { NGOProfile } from '../types';
import { Building2, ShieldCheck, MapPin, Phone, Mail, ArrowLeft, HeartHandshake, Calendar } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const NgoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ngo, setNgo] = useState<NGOProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getNgoById(id)
      .then(setNgo)
      .catch((err) => setError(err.message || 'Failed to load NGO profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading NGO profile...</p>
      </div>
    );
  }

  if (error || !ngo) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-400 space-y-4">
        <p className="font-semibold">{error || 'NGO profile not found.'}</p>
        <button
          onClick={() => navigate('/ngos')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
        >
          Back to All NGOs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <button
        onClick={() => navigate('/ngos')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to NGO Directory
      </button>

      {/* Main Profile Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{ngo.name}</h1>
                {ngo.verified && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Registered Partner &bull; Member since {formatDate(ngo.createdAt)}
              </p>
            </div>
          </div>

          <Link
            to={`/donate/new?ngoId=${ngo.id}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <HeartHandshake className="w-5 h-5" />
            Donate to this NGO
          </Link>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs">About the NGO</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {ngo.description || 'This organization has not provided a detailed description yet.'}
            </p>
          </div>

          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Location</h2>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Address</span>
                  <span>{ngo.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Phone</span>
                  <span>{ngo.phone}</span>
                </div>
              </div>

              {ngo.user?.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Email</span>
                    <span>{ngo.user.email}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Joined</span>
                  <span>{formatDate(ngo.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
