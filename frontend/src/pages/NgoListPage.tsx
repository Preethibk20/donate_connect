import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getVerifiedNgos } from '../api/ngoApi';
import { NGOProfile } from '../types';
import { Building2, Search, ShieldCheck, MapPin, Phone, ArrowRight, HeartHandshake } from 'lucide-react';

export const NgoListPage: React.FC = () => {
  const navigate = useNavigate();
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchNgos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVerifiedNgos();
      setNgos(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load NGO partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, []);

  const filteredNgos = ngos.filter(
    (ngo) =>
      ngo.name.toLowerCase().includes(search.toLowerCase()) ||
      (ngo.description && ngo.description.toLowerCase().includes(search.toLowerCase())) ||
      ngo.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" />
            Verified NGO Partners
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse verified non-profit organizations accepting community donations
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by NGO name, location, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
        />
      </div>

      {/* NGO Grid */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Fetching verified NGO profiles...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-400 space-y-3">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchNgos}
            className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredNgos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-semibold text-lg">No verified NGOs found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {ngos.length === 0
              ? 'No verified NGO profiles are registered in the system yet.'
              : 'Try clearing or modifying your search filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map((ngo) => (
            <div
              key={ngo.id}
              onClick={() => navigate(`/ngos/${ngo.id}`)}
              className="group cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified NGO
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  {ngo.name}
                </h2>

                <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {ngo.description || 'Verified non-profit partner committed to community support.'}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{ngo.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{ngo.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-indigo-400 group-hover:underline flex items-center gap-1">
                    View Profile & Donate <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <Link
                    to={`/donate/new?ngoId=${ngo.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold text-xs transition-colors border border-indigo-500/30 flex items-center gap-1"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Donate
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
