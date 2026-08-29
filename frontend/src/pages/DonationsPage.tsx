import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyDonations, getNgoAssignedDonations, updateDonationStatusByNgo } from '../api/donationApi';
import { Donation, DonationStatus } from '../types';
import { DonationCard } from '../components/DonationCard';
import { PlusCircle, Search, Filter, RefreshCw, HeartHandshake, ShieldCheck } from 'lucide-react';

export const DonationsPage: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const isNgo = user?.role === 'NGO';
  const isDonor = user?.role === 'DONOR';

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isNgo) {
        const pageResponse = await getNgoAssignedDonations(0, 100);
        setDonations(pageResponse.content);
      } else {
        const pageResponse = await getMyDonations(0, 100);
        setDonations(pageResponse.content);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [user]);

  const handleStatusChange = async (id: string, newStatus: DonationStatus) => {
    try {
      const updated = await updateDonationStatusByNgo(id, newStatus);
      setDonations((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(donations.map((d) => d.category)))];

  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
      (d.donor?.fullName && d.donor.fullName.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || d.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {isNgo ? 'NGO Assigned Donations' : 'My Donation History'}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Role: {user?.role}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {isNgo
              ? 'Role-isolated view showing donations assigned exclusively to your NGO'
              : 'Donations submitted under your donor account'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDonations}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isDonor && (
            <Link
              to="/donations/new"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              New Donation
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by category, description, or donor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading role-isolated donations...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-400 space-y-3">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchDonations}
            className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
          <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-semibold text-lg">No donations found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {isNgo
              ? 'No donors have assigned donation requests to your NGO profile yet.'
              : 'You have not submitted any donation requests yet.'}
          </p>
          {isDonor && (
            <Link
              to="/donations/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
            >
              Create Donation
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((donation) => (
            <DonationCard
              key={donation.id}
              donation={donation}
              isNgoView={isNgo}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
