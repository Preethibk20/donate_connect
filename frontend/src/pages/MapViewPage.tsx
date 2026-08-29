import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVerifiedNgos } from '../api/ngoApi';
import { NGOProfile } from '../types';
import { MapPin, Phone, Building2, ShieldCheck, HeartHandshake, Navigation } from 'lucide-react';

export const MapViewPage: React.FC = () => {
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [selectedNgo, setSelectedNgo] = useState<NGOProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVerifiedNgos()
      .then((data) => {
        setNgos(data);
        if (data.length > 0) setSelectedNgo(data[0]);
      })
      .catch(() => setNgos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-indigo-400" />
            Interactive Indian NGO & Pickup Hub Map
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Discover verified Indian non-profit partners and collection centers across New Delhi, Mumbai, Bengaluru, and Chennai
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NGO Directory Sidebar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[520px]">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
            <span>Verified Indian NGO Partners ({ngos.length})</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Live</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-400">Loading map markers...</div>
            ) : ngos.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">No verified NGOs found.</div>
            ) : (
              ngos.map((ngo) => (
                <div
                  key={ngo.id}
                  onClick={() => setSelectedNgo(ngo)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedNgo?.id === ngo.id
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{ngo.name}</h4>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-2">{ngo.address}</p>
                  <div className="flex items-center justify-between text-[11px] text-indigo-300">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {ngo.phone}</span>
                    <span className="font-semibold text-emerald-400">Verified Hub &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Visual Simulated Map Display */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[520px]">
          {/* Simulated Map Canvas */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Top Info Header */}
          <div className="relative z-10 flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedNgo ? `Active Pin: ${selectedNgo.name}` : 'Select an NGO from directory'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">GPS Grid: 28.6139° N, 77.2090° E (India Metro Grid)</span>
          </div>

          {/* Interactive Pin Showcase Canvas */}
          <div className="relative z-10 flex-1 bg-slate-950/80 rounded-xl border border-slate-800/80 p-6 flex flex-col justify-center items-center text-center space-y-4">
            {selectedNgo ? (
              <div className="max-w-md w-full bg-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Verified Relief Center
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-2 mb-1">{selectedNgo.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{selectedNgo.description}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                  <div>📍 <strong>Address:</strong> {selectedNgo.address}</div>
                  <div>📞 <strong>Phone:</strong> {selectedNgo.phone}</div>
                </div>

                <Link
                  to={`/donate/new?ngoId=${selectedNgo.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all"
                >
                  <HeartHandshake className="w-4 h-4" />
                  Schedule Direct Donation Pickup &rarr;
                </Link>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Select an NGO pin on the left to view details</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
