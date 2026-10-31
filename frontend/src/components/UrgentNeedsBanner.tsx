import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveUrgentNeeds } from '../api/ngoApi';
import { NgoUrgentNeed } from '../types';

const INITIAL_URGENT_NEEDS: NgoUrgentNeed[] = [
  {
    id: "56713c94-8fe4-441e-ae7c-bfa601da2343",
    ngoId: "6d72f778-6bc7-4127-83a1-2d3c00360022",
    ngoName: "Akshaya Patra Foundation",
    ngoCity: "Bengaluru Hub",
    title: "Emergency Relief Drive: Basmati Rice, Wheat Flour & Lentils Needed for Wayanad Relief Camps",
    description: "Our community kitchens are preparing 5,000 daily hot meals for flood displaced families. Contributions of staple grains requested urgently.",
    category: "FOOD" as any,
    active: true,
  } as any,
  {
    id: "2f12de4e-7d97-4442-a01a-ce8102f9611b",
    ngoId: "73c6b3db-3728-4685-a15e-9c2090d1691e",
    ngoName: "HelpAge India Relief Society",
    ngoCity: "Himachal Relief",
    title: "Urgent Appeal: 200 Woolen Blankets & Tarpaulins for Himachal Hill Shelter Drive",
    description: "Severe winter frost has affected elderly residents in Himachal shelters. We urgently need thermal blankets, shawls, and tarps.",
    category: "CLOTHES" as any,
    active: true,
  } as any,
];

export const UrgentNeedsBanner: React.FC = () => {
  const [urgentNeeds, setUrgentNeeds] = useState<NgoUrgentNeed[]>(INITIAL_URGENT_NEEDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getActiveUrgentNeeds()
      .then((data) => {
        if (data && data.length > 0) {
          setUrgentNeeds(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || urgentNeeds.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-purple-950/80 border-y border-rose-500/30 py-6 px-4 mb-8 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              🚨 Urgent NGO Appeal Drives
            </h3>
          </div>
          <span className="text-xs font-semibold text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
            {urgentNeeds.length} Active Urgent Campaigns
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgentNeeds.map((need) => (
            <div
              key={need.id}
              className="bg-slate-900/90 p-4 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                    {need.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium truncate">
                    {need.ngoName || 'NGO Partner'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">{need.title}</h4>
                <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">{need.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">📍 {need.ngoCity || 'Verified NGO'}</span>
                <Link
                  to={`/donate/new?ngoId=${need.ngoId}&category=${need.category}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-all"
                >
                  Donate Now &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
