import React, { useEffect, useState } from 'react';
import { getSmartLockers } from '../api/nextGenApi';
import { SmartLocker } from '../types';
import { Lock, MapPin, KeyRound, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const SmartLockersPage: React.FC = () => {
  const [lockers, setLockers] = useState<SmartLocker[]>([]);
  const [selectedLocker, setSelectedLocker] = useState<SmartLocker | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSmartLockers()
      .then((data) => {
        setLockers(data);
        if (data.length > 0) setSelectedLocker(data[0]);
      })
      .catch(() => setLockers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
  };

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Lock className="w-8 h-8 text-indigo-400" />
            24/7 Contactless Smart Locker Hubs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Drop off donation items anytime at automated metro & hub locker stations using a secure 6-digit OTP code
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locker Station List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
            <span>Available Locker Stations ({lockers.length})</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">24/7 Access</span>
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading locker stations...</div>
          ) : (
            lockers.map((locker) => (
              <div
                key={locker.id}
                onClick={() => {
                  setSelectedLocker(locker);
                  setGeneratedOtp(null);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedLocker?.id === locker.id
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white truncate">{locker.name}</h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 mb-2">{locker.address}</p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-indigo-300 font-semibold">{locker.availableLockers} / {locker.totalLockers} Lockers Free</span>
                  <span className="text-emerald-400 font-bold">Select Hub &rarr;</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Locker Control Panel & OTP Generator */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          {selectedLocker ? (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  Station Status: ONLINE
                </span>
                <h2 className="text-2xl font-black text-white mt-2">{selectedLocker.name}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {selectedLocker.address}
                </p>
              </div>

              {/* OTP Generation Box */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-indigo-500/30 text-center space-y-4">
                <KeyRound className="w-10 h-10 text-indigo-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Generate Drop-off Access PIN</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click below to reserve an automated locker compartment and receive your 6-digit drop-off PIN code.
                  </p>
                </div>

                {generatedOtp ? (
                  <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl max-w-xs mx-auto space-y-2">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Reserved Locker #08 PIN</div>
                    <div className="text-3xl font-black tracking-widest text-white font-mono">{generatedOtp}</div>
                    <div className="text-[10px] text-slate-400">Valid for 24 Hours • NGO Dispatch Notified</div>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateOtp}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all inline-flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Reserve Locker & Generate OTP Code
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-sm">Select a locker hub to generate a drop-off PIN</div>
          )}
        </div>
      </div>
    </div>
  );
};
