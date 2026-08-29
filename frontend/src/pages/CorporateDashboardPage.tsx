import React, { useEffect, useState } from 'react';
import { getCorporateDrives } from '../api/corporateApi';
import { CorporateDrive } from '../types';
import { Building2, Calendar, Target, Award, Download, CheckCircle2 } from 'lucide-react';

export const CorporateDashboardPage: React.FC = () => {
  const [drives, setDrives] = useState<CorporateDrive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCorporateDrives()
      .then((data) => setDrives(data))
      .catch(() => setDrives([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purple-400" />
            Corporate CSR & Sustainability Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Enterprise CSR dashboard for corporate donation drives, employee involvement, and ESG compliance reports
          </p>
        </div>

        <button
          onClick={() => alert('Exporting ESG & CSR Audit Compliance PDF Report...')}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Corporate CSR Report
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          Loading corporate CSR campaign drives...
        </div>
      ) : drives.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-semibold text-base">No active corporate CSR drives</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Corporate accounts can create company-wide donation goals for employees.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {drives.map((drive) => {
            const progress = Math.min(100, Math.round((drive.collectedItemCount / drive.targetItemCount) * 100));
            return (
              <div
                key={drive.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                      {drive.companyName}
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1">{drive.campaignTitle}</h3>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>{drive.startDate} &mdash; {drive.endDate}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{drive.description}</p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Campaign Target Progress</span>
                    <span className="text-purple-400 font-bold">
                      {drive.collectedItemCount} / {drive.targetItemCount} Items ({progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400">Items Donated</div>
                    <div className="text-lg font-bold text-white">{drive.collectedItemCount}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400">CO₂ Offset</div>
                    <div className="text-lg font-bold text-emerald-400">{drive.collectedItemCount * 4.2} kg</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400">Status</div>
                    <div className="text-lg font-bold text-purple-400">ACTIVE DRIVE</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
