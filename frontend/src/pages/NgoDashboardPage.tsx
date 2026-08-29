import React, { useEffect, useState } from 'react';
import { getNgoAssignedDonations, updateDonationStatusByNgo } from '../api/donationApi';
import { Donation, DonationStatus } from '../types';
import { formatDate } from '../utils/formatters';
import { LiveDriverTrackerModal } from '../components/LiveDriverTrackerModal';
import { getPhotoUrl } from '../utils/photoHelper';
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  User,
  Calendar,
  Tag,
  Filter,
  Inbox,
  Navigation
} from 'lucide-react';

import { useToast } from '../context/ToastContext';

export const NgoDashboardPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTrackerDonation, setActiveTrackerDonation] = useState<Donation | null>(null);

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse = await getNgoAssignedDonations(0, 100);
      const data = pageResponse.content;
      // Sort newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setDonations(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned donations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: DonationStatus) => {
    setActionLoadingId(id);
    try {
      const updated = await updateDonationStatusByNgo(id, newStatus);
      setDonations((prev) => prev.map((d) => (d.id === id ? updated : d)));
      showSuccess(`Donation status updated to ${newStatus}`);
    } catch (err: any) {
      showError('Status update failed: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

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

  const filteredDonations = donations.filter(
    (d) => statusFilter === 'ALL' || d.status === statusFilter
  );

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" />
            NGO Assigned Donations
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage incoming donation requests and update pickup & delivery status
          </p>
        </div>

        <button
          onClick={fetchDonations}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 text-xs font-semibold self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
        {['ALL', 'REQUESTED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'REJECTED'].map((status) => {
          const count =
            status === 'ALL'
              ? donations.length
              : donations.filter((d) => d.status === status).length;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{status}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-950/60 text-[10px] font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Section: Skeletons, Error, Empty State, or List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-5 bg-slate-800 rounded-full" />
                <div className="w-16 h-5 bg-slate-800 rounded" />
              </div>
              <div className="w-3/4 h-6 bg-slate-800 rounded" />
              <div className="w-full h-12 bg-slate-800/60 rounded" />
              <div className="border-t border-slate-800 pt-4 flex justify-between">
                <div className="w-24 h-4 bg-slate-800 rounded" />
                <div className="w-24 h-4 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
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
          <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-semibold text-lg">No assigned donations</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {donations.length === 0
              ? 'No donors have assigned donation requests to your NGO profile yet.'
              : `No donations matching status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((donation) => (
            <div
              key={donation.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {donation.category}
                  </span>
                  <span
                    className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded border ${getStatusBadgeStyle(
                      donation.status
                    )}`}
                  >
                    {donation.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold text-sm">
                  <User className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Donor: {donation.donor?.fullName || 'Anonymous'}</span>
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {donation.description || 'No item description provided.'}
                </p>

                 {donation.photoUrls && donation.photoUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                    {donation.photoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={getPhotoUrl(url)}
                        alt="Donation attachment"
                        className="w-14 h-14 object-cover rounded-lg border border-slate-800"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Requested: {formatDate(donation.createdAt)}</span>
                  </div>
                  {donation.pickupDate && (
                    <span className="text-indigo-300 font-medium">Pickup: {donation.pickupDate}</span>
                  )}
                </div>

                {/* Uber-Style Live GPS Driver Tracking Button */}
                <button
                  onClick={() => setActiveTrackerDonation(donation)}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  Track Driver Live GPS Location &rarr;
                </button>

                {/* Workflow Actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
                  {actionLoadingId === donation.id ? (
                    <div className="w-full py-2 text-center text-xs text-indigo-400 font-semibold flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      Updating status...
                    </div>
                  ) : donation.status === 'REQUESTED' ? (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(donation.id, 'ACCEPTED')}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold text-xs transition-colors border border-emerald-500/30 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(donation.id, 'REJECTED')}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold text-xs transition-colors border border-rose-500/30 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  ) : donation.status === 'ACCEPTED' ? (
                    <button
                      onClick={() => handleStatusUpdate(donation.id, 'PICKED_UP')}
                      className="w-full py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-semibold text-xs transition-colors border border-amber-500/30 flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      Mark Picked Up
                    </button>
                  ) : donation.status === 'PICKED_UP' ? (
                    <button
                      onClick={() => handleStatusUpdate(donation.id, 'DELIVERED')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold text-xs transition-colors border border-emerald-500/30 flex items-center justify-center gap-2"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Mark Delivered
                    </button>
                  ) : donation.status === 'DELIVERED' ? (
                    <div className="w-full py-1.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      ✓ Complete & Delivered
                    </div>
                  ) : (
                    <div className="w-full py-1.5 text-center text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
                      ✗ Donation Rejected
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uber-Style Live Driver Tracker Modal */}
      {activeTrackerDonation && (
        <LiveDriverTrackerModal
          donationTitle={`${activeTrackerDonation.category} (Donor: ${activeTrackerDonation.donor?.fullName || 'Anonymous'})`}
          driverName="Vikram Singh (Volunteer Logistics Coordinator)"
          driverPhone="+91 98765 43210"
          onClose={() => setActiveTrackerDonation(null)}
        />
      )}
    </div>
  );
};
