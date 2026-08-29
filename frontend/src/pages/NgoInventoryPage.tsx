import React, { useEffect, useState } from 'react';
import { getNgoAssignedDonations } from '../api/donationApi';
import { Category, Donation } from '../types';
import { PackageCheck, Shirt, Utensils, BookOpen, PenTool, Gamepad2, Box, RefreshCw, BarChart3 } from 'lucide-react';

export const NgoInventoryPage: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse = await getNgoAssignedDonations(0, 100);
      const data = pageResponse.content;
      // Filter strictly for DELIVERED items
      setDonations(data.filter((d) => d.status === 'DELIVERED'));
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const categoriesList: { category: Category; label: string; icon: React.FC<{ className?: string }> }[] = [
    { category: 'CLOTHES', label: 'Clothes & Apparel', icon: Shirt },
    { category: 'FOOD', label: 'Food & Groceries', icon: Utensils },
    { category: 'BOOKS', label: 'Books & Educational Material', icon: BookOpen },
    { category: 'STATIONERY', label: 'School & Office Supplies', icon: PenTool },
    { category: 'TOYS', label: 'Toys & Children Items', icon: Gamepad2 },
    { category: 'OTHER', label: 'Other Contributions', icon: Box },
  ];

  const getCountByCategory = (cat: Category) => {
    return donations.filter((d) => d.category === cat).length;
  };

  const totalDelivered = donations.length;

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <PackageCheck className="w-8 h-8 text-emerald-400" />
            Delivered Inventory Summary
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Overview of all delivered items received by your NGO, grouped by category
          </p>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 text-xs font-semibold self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Total Items Received</span>
          <div className="text-4xl font-extrabold text-white">{totalDelivered}</div>
          <p className="text-xs text-slate-400">Completed & verified donations</p>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
          <BarChart3 className="w-8 h-8 text-emerald-400 shrink-0" />
          <span>Real-time category breakdown based on verified delivered donations</span>
        </div>
      </div>

      {/* Loading / Error / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-400 space-y-3">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchInventory}
            className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categoriesList.map(({ category, label, icon: Icon }) => {
            const count = getCountByCategory(category);
            const percentage = totalDelivered > 0 ? Math.round((count / totalDelivered) * 100) : 0;

            return (
              <div
                key={category}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-200">{label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{category}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Share</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
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
