import React, { useState } from 'react';
import { Award, Share2, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';

export const GamificationBadges: React.FC = () => {
  const [showShareModal, setShowShareModal] = useState(false);

  const badges = [
    { id: 'b1', title: 'First Gift Pioneer', desc: 'Submitted first verified donation request', icon: '🎁', unlocked: true },
    { id: 'b2', title: 'Green Earth Hero', desc: 'Prevented 50+ kg CO2 emissions through reuse', icon: '🌱', unlocked: true },
    { id: 'b3', title: 'Multi-NGO Supporter', desc: 'Donated to 3 or more verified NGO partners', icon: '🏛️', unlocked: true },
    { id: 'b4', title: '5-Star Champion', desc: 'Received 5-star rating from partner organization', icon: '⭐', unlocked: true },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Donor Impact Badges & Achievements
        </h3>
        <button
          onClick={() => setShowShareModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Social Impact Card
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {badges.map((b) => (
          <div key={b.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="text-2xl">{b.icon}</span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                {b.title}
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 line-clamp-1">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl relative">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                🌱 Verified Impact Milestone Card
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">I Just Made a Difference on DonateConnect!</h3>
              <p className="text-xs text-slate-300">
                "Donated essential clothes & books to verified NGOs. Saved 45 kg of CO₂ emissions and supported local communities!"
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>🏆 <strong>Badges Earned:</strong> Green Earth Hero, Multi-NGO Supporter</div>
              <div>📍 <strong>Platform:</strong> DonateConnect Verified Directory</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Impact card copied to clipboard for social sharing!');
                  setShowShareModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" /> Copy Share Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
