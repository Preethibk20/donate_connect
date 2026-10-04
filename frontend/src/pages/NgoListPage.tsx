import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getVerifiedNgos } from '../api/ngoApi';
import { NGOProfile } from '../types';
import { Building2, Search, ShieldCheck, MapPin, Phone, ArrowRight, HeartHandshake, Filter, Navigation, Compass, Star } from 'lucide-react';

const CATEGORIES = [
  'FOOD', 'CLOTHING', 'MEDICAL', 'EDUCATION', 'FURNITURE', 'OTHER'
];

export const NgoListPage: React.FC = () => {
  const navigate = useNavigate();
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [needsRightNowFilter, setNeedsRightNowFilter] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  const fetchNgos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVerifiedNgos({
        category: categoryFilter,
        city: cityFilter,
        needsRightNow: needsRightNowFilter,
        donorLat: userLoc?.lat,
        donorLng: userLoc?.lng
      });
      setNgos(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load NGO partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, [categoryFilter, cityFilter, needsRightNowFilter, userLoc]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation error:", err)
      );
    }
  };

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

      {/* Search & Filters */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by NGO name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 min-w-[140px]"
          >
            <option value="">Any Category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="City filter..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={needsRightNowFilter}
              onChange={(e) => setNeedsRightNowFilter(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-indigo-500/20"
            />
            Needs Right Now
          </label>

          <button 
            onClick={requestLocation}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${userLoc ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Navigation className="w-4 h-4" />
            {userLoc ? 'Sorted by Distance' : 'Sort by Distance'}
          </button>
        </div>
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

                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {ngo.name}
                  </h2>
                  {(ngo.averageRating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-amber-500 font-bold text-xs">{ngo.averageRating?.toFixed(1)}</span>
                      <span className="text-amber-500/60 text-[10px]">({ngo.ratingCount})</span>
                    </div>
                  )}
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {ngo.description || 'Verified non-profit partner committed to community support.'}
                </p>

                {ngo.urgentNeeds && ngo.urgentNeeds.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Urgent Needs:</span>
                    <div className="flex flex-wrap gap-2">
                      {ngo.urgentNeeds.slice(0, 3).map(need => (
                        <span key={need.id} className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-1 rounded-md flex items-center gap-1.5">
                          {need.title} <span className="text-[10px] bg-rose-500/20 px-1 rounded">{need.quantity || 'Any'}</span>
                        </span>
                      ))}
                      {ngo.urgentNeeds.length > 3 && (
                        <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded-md">
                          +{ngo.urgentNeeds.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{ngo.address} {ngo.city ? `(${ngo.city})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{ngo.phone}</span>
                  </div>
                  {ngo.distanceKm !== undefined && (
                    <div className="flex items-center gap-2 text-indigo-300">
                      <Compass className="w-3.5 h-3.5 shrink-0" />
                      <span>{ngo.distanceKm.toFixed(1)} km away</span>
                    </div>
                  )}
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
