import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSosStatus } from '../api/nextGenApi';
import { SosStatus } from '../types';
import { AlertOctagon, HeartHandshake } from 'lucide-react';

export const EmergencySosBanner: React.FC = () => {
  const [sos, setSos] = useState<SosStatus | null>(null);

  useEffect(() => {
    getSosStatus()
      .then((data) => setSos(data))
      .catch(() => setSos(null));
  }, []);

  if (!sos || !sos.active) return null;

  return (
    <div className="w-full bg-[#DC2626] py-3 px-4 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-white shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white">
              🚨 EMERGENCY DISASTER SOS MODE ACTIVE &mdash; {sos.disasterTitle}
            </div>
            <p className="text-xs text-white/90 mt-0.5">{sos.priorityMessage}</p>
          </div>
        </div>

        <Link
          to="/donate/new?category=CLOTHES"
          className="px-4 py-1.5 rounded-xl bg-white text-[#DC2626] font-bold text-xs hover:bg-white/95 transition-all shadow-sm shrink-0 flex items-center gap-1.5"
        >
          <HeartHandshake className="w-4 h-4 text-[#DC2626]" /> Priority Emergency Kit Donation &rarr;
        </Link>
      </div>
    </div>
  );
};
