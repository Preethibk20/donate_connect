import React, { useEffect, useState } from 'react';
import { Truck, Navigation, Phone, ShieldCheck, MapPin, X, CheckCircle2, Clock } from 'lucide-react';

interface LiveDriverTrackerModalProps {
  donationTitle: string;
  driverName: string;
  driverPhone: string;
  onClose: () => void;
}

export const LiveDriverTrackerModal: React.FC<LiveDriverTrackerModalProps> = ({
  donationTitle,
  driverName,
  driverPhone,
  onClose,
}) => {
  // Simulated GPS Coordinates animating towards destination
  const [progress, setProgress] = useState(25); // Percentage completed along route
  const [etaMinutes, setEtaMinutes] = useState(8);
  const [driverSpeed, setDriverSpeed] = useState(32); // km/h

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });

      setEtaMinutes((prev) => (prev > 1 ? prev - 1 : 1));
      setDriverSpeed(Math.floor(28 + Math.random() * 10));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-6 relative shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Live Uber-Style GPS Driver Tracker</h3>
              <p className="text-xs text-slate-400">Real-time driver location stream for NGO & Donor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulated GPS Radar Map Canvas */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-2xl h-56 overflow-hidden p-4 flex flex-col justify-between">
          {/* Grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Top Status Overlay */}
          <div className="relative z-10 flex items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE GPS STREAMING &bull; {driverSpeed} km/h
            </div>
            <div className="text-slate-300 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> ETA: <span className="text-white font-bold">{progress >= 100 ? 'ARRIVED!' : `${etaMinutes} Mins`}</span>
            </div>
          </div>

          {/* Animated Route Line & Moving Driver Pin */}
          <div className="relative z-10 my-auto py-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
              <span className="flex items-center gap-1 text-slate-200"><MapPin className="w-3.5 h-3.5 text-rose-400" /> Pickup Point</span>
              <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3.5 h-3.5" /> NGO Hub Destination</span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-3 bg-slate-800 rounded-full relative overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Live Moving Vehicle Icon */}
            <div
              className="relative -mt-6 transition-all duration-700 ease-out flex flex-col items-center"
              style={{ left: `calc(${Math.min(progress, 92)}% - 16px)` }}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white text-white flex items-center justify-center shadow-lg shadow-indigo-600/50">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded border border-indigo-500/30 mt-0.5 whitespace-nowrap">
                {driverName.split(' ')[0]} (Live)
              </span>
            </div>
          </div>

          {/* Bottom GPS Coordinates readout */}
          <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/80 pt-2">
            <span>Lat: 28.6139° N, Long: 77.2090° E</span>
            <span className="text-indigo-400 font-semibold">{progress}% Route Completed</span>
          </div>
        </div>

        {/* Driver Info Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
              {driverName.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {driverName}
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">Verified Driver</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Assigned to: {donationTitle}</p>
            </div>
          </div>

          <a
            href={`tel:${driverPhone}`}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Phone className="w-3.5 h-3.5" /> Call Driver
          </a>
        </div>
      </div>
    </div>
  );
};
