import React, { useEffect, useState } from 'react';
import { getAdminDonations } from '../api/donationApi';
import { getVerifiedNgos } from '../api/ngoApi';
import { Donation, DonationStatus, NGOProfile, PageResponse } from '../types';
import { formatDate } from '../utils/formatters';
import { PackageCheck, RefreshCw, ChevronLeft, ChevronRight, User, Building2, Tag } from 'lucide-react';

export const AdminDonationsPage: React.FC = () => {
  const [pageData, setPageData] = useState<PageResponse<Donation> | null>(null);
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedNgoId, setSelectedNgoId] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDonations(
        selectedCategory || undefined,
        selectedStatus || undefined,
        selectedNgoId || undefined,
        page,
        pageSize
      );
      setPageData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load donations audit table.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getVerifiedNgos().then(setNgos).catch(() => setNgos([]));
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [selectedCategory, selectedStatus, selectedNgoId, page]);

  const getStatusBadgeStyle = (status: DonationStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'PICKED_UP':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DELIVERED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'REQUESTED':
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <PackageCheck className="w-8 h-8 text-indigo-400" />
            All Donations Audit
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit system-wide donation requests across all NGO partners with server-side pagination
          </p>
        </div>

        <button
          onClick={fetchDonations}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 text-xs font-semibold self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Table
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status Filter</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="PICKED_UP">PICKED_UP</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Category Filter</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="CLOTHES">CLOTHES</option>
            <option value="FOOD">FOOD</option>
            <option value="BOOKS">BOOKS</option>
            <option value="STATIONERY">STATIONERY</option>
            <option value="TOYS">TOYS</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        {/* NGO Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">NGO Filter</label>
          <select
            value={selectedNgoId}
            onChange={(e) => {
              setSelectedNgoId(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All NGOs</option>
            {ngos.map((ngo) => (
              <option key={ngo.id} value={ngo.id}>
                {ngo.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Fetching audit records...</p>
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
      ) : !pageData || pageData.content.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
          <PackageCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-semibold text-lg">No audit records match your filters</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Try clearing or adjusting your status, category, or NGO dropdown filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Donor Name</th>
                    <th className="px-6 py-4">Target NGO</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Pickup Date</th>
                    <th className="px-6 py-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pageData.content.map((donation) => (
                    <tr key={donation.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-400" />
                          <span>{donation.donor?.fullName || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-400" />
                          <span>{donation.ngo?.name || 'NGO Partner'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <Tag className="w-3 h-3" />
                          {donation.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded border ${getStatusBadgeStyle(
                            donation.status
                          )}`}
                        >
                          {donation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {donation.pickupDate || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {formatDate(donation.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <div>
              Showing Page <span className="font-semibold text-white">{pageData.number + 1}</span> of{' '}
              <span className="font-semibold text-white">{pageData.totalPages}</span> ({pageData.totalElements} total entries)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={pageData.number === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
                disabled={pageData.number >= pageData.totalPages - 1}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
