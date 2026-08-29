import React, { useEffect, useState } from 'react';
import { getActiveResourceTrades } from '../api/nextGenApi';
import { NgoResourceTrade } from '../types';
import { RefreshCw, Repeat, Building2, Recycle, CheckCircle2 } from 'lucide-react';

export const CircularMarketplacePage: React.FC = () => {
  const [trades, setTrades] = useState<NgoResourceTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveResourceTrades()
      .then((data) => setTrades(data))
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Recycle className="w-8 h-8 text-emerald-400" />
            Zero-Waste Circular Exchange & Inter-NGO Trade Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            B2B resource exchange board for NGOs to swap surplus items and divert textile/e-waste from landfills
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-xl font-extrabold text-emerald-400">1,240 kg</div>
          <div className="text-xs text-slate-400">Textiles Diverted from Landfill</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-xl font-extrabold text-indigo-400">450 Units</div>
          <div className="text-xs text-slate-400">E-Waste Upcycled</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-xl font-extrabold text-purple-400">12 Active</div>
          <div className="text-xs text-slate-400">Inter-NGO Surplus Trades</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          Loading inter-NGO trade listings...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trades.map((t) => (
            <div key={t.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  {t.offeringNgo.name}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Active Trade Offer
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Offering Surplus</div>
                  <div className="text-sm font-bold text-indigo-400">{t.offeredQuantity}x {t.offeredCategory}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Requesting in Exchange</div>
                  <div className="text-sm font-bold text-purple-400">{t.requestedQuantity}x {t.requestedCategory}</div>
                </div>
              </div>

              <button
                onClick={() => alert(`Initiated trade request with ${t.offeringNgo.name}!`)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Repeat className="w-4 h-4" /> Propose Resource Exchange &rarr;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
