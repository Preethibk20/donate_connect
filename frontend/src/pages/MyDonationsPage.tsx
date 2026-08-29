import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyDonations } from '../api/donationApi';
import { Donation, DonationStatus, PageResponse } from '../types';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { CommentThread } from '../components/CommentThread';
import { LiveDriverTrackerModal } from '../components/LiveDriverTrackerModal';
import { DonationDetailModal } from '../components/DonationDetailModal';
import {
  PlusCircle,
  RefreshCw,
  HeartHandshake,
  Tag,
  Building2,
  Calendar,
  Filter,
  MessageSquare,
  X,
  Navigation,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export const MyDonationsPage: React.FC = () => {
  const { user } = useAuth();
  const [pageData, setPageData] = useState<PageResponse<Donation> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Donation for Modals
  const [activeChatDonation, setActiveChatDonation] = useState<Donation | null>(null);
  const [activeTrackerDonation, setActiveTrackerDonation] = useState<Donation | null>(null);
  const [detailDonationId, setDetailDonationId] = useState<string | null>(null);

  const fetchDonations = async (currentPage = page, pageSize = size) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse = await getMyDonations(currentPage, pageSize);
      setPageData(pageResponse);
    } catch (err: any) {
      setError(err.message || 'Unable to load donation history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations(page, size);
  }, [page, size]);

  const getStatusBadgeStyle = (status: DonationStatus) => {
    switch (status) {
      case 'ACCEPTED':
      case 'DELIVERED':
        return 'bg-[#E6F4EA] text-[#047857] border-[#A7F3D0]';
      case 'REJECTED':
        return 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]';
      case 'PICKED_UP':
      case 'REQUESTED':
      default:
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
    }
  };

  const rawDonations = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  const filteredDonations = rawDonations.filter(
    (d) => statusFilter === 'ALL' || d.status === statusFilter
  );

  const totalDonationsCount = totalElements;
  const uniqueNgosCount = new Set(rawDonations.map((d) => d.ngo?.id || d.ngo?.name)).size;
  const deliveredCount = rawDonations.filter((d) => d.status === 'DELIVERED').length;

  return (
    <div className="space-y-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight flex items-center gap-3">
            <HeartHandshake className="w-8 h-8 text-[#7567E8]" />
            My Donations
          </h1>
          <p className="text-[#4B5563] text-sm mt-1">
            View and track your complete donation history
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDonations(page, size)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white text-[#4B5563] hover:text-[#111827] hover:bg-[#F4F2FA] transition-colors border border-[#E5E7EB] shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/donate/new"
            className="px-4 py-2.5 rounded-xl bg-[#7567E8] hover:bg-[#7567E8]/90 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            New Donation Request
          </Link>
        </div>
      </div>

      {/* Summary Metrics Section */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex items-center gap-4 shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)]">
            <div className="w-12 h-12 rounded-xl bg-[#7567E8]/10 border border-[#7567E8]/20 flex items-center justify-center text-[#7567E8]">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#4B5563]">Total Donations</p>
              <h3 className="text-2xl font-extrabold text-[#111827] mt-0.5">{totalDonationsCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex items-center gap-4 shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)]">
            <div className="w-12 h-12 rounded-xl bg-[#7567E8]/10 border border-[#7567E8]/20 flex items-center justify-center text-[#7567E8]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#4B5563]">NGOs Supported</p>
              <h3 className="text-2xl font-extrabold text-[#111827] mt-0.5">{uniqueNgosCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex items-center gap-4 shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)]">
            <div className="w-12 h-12 rounded-xl bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center text-[#059669]">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#4B5563]">Delivered Donations</p>
              <h3 className="text-2xl font-extrabold text-[#111827] mt-0.5">{deliveredCount}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Bar */}
      {!loading && !error && totalElements > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-[#6B7280] shrink-0" />
          {['ALL', 'REQUESTED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                statusFilter === status
                  ? 'bg-[#7567E8] text-white border-[#9186F2] shadow-sm'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F4F2FA] hover:text-[#111827]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton State */
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)] space-y-4">
          <div className="w-10 h-10 border-3 border-[#7567E8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#4B5563] text-sm font-medium">Loading your donation history...</p>
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="p-8 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-center space-y-4 max-w-md mx-auto my-8">
          <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Unable to load donation history.</h3>
            <p className="text-[#4B5563] text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchDonations(page, size)}
            className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Please try again (Retry)
          </button>
        </div>
      ) : totalElements === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#7567E8]/10 flex items-center justify-center mx-auto text-[#7567E8]">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-xl text-[#111827]">No donations yet</h3>
            <p className="text-[#4B5563] text-sm max-w-sm mx-auto">
              Your donation history will appear here once you make your first donation.
            </p>
          </div>
          <Link
            to="/donate/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7567E8] hover:bg-[#7567E8]/90 text-white font-bold text-sm transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            Start a Donation
          </Link>
        </div>
      ) : (
        /* Data Presentation */
        <div className="space-y-6">
          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)]">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase font-extrabold border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">NGO</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 max-w-xs">Description</th>
                  <th className="py-3.5 px-4">Pickup Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#111827]">
                {filteredDonations.map((donation) => (
                  <tr
                    key={donation.id}
                    className="hover:bg-[#F4F2FA] transition-colors cursor-pointer"
                    onClick={() => setDetailDonationId(donation.id)}
                  >
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-[#4B5563]">
                      {formatDate(donation.createdAt)}
                    </td>
                    <td className="py-4 px-4 font-extrabold max-w-[180px] break-words text-[#111827]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#7567E8] shrink-0" />
                        <span className="truncate">{donation.ngo?.name || 'NGO Partner'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7567E8]/10 text-[#7567E8] border border-[#7567E8]/20">
                        <Tag className="w-3 h-3" />
                        {donation.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs max-w-xs break-words line-clamp-2 text-[#4B5563]">
                      {donation.description || 'No description provided.'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-xs">
                      {donation.pickupDate ? (
                        <span className="inline-flex items-center gap-1 text-[#111827] font-semibold">
                          <Calendar className="w-3 h-3 text-[#7567E8]" />
                          {donation.pickupDate}
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded border ${getStatusBadgeStyle(
                          donation.status
                        )}`}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailDonationId(donation.id)}
                          className="p-2 rounded-lg transition-colors border bg-white hover:bg-[#F4F2FA] text-[#111827] border-[#E5E7EB] shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-[#7567E8]" />
                        </button>
                        <button
                          onClick={() => setActiveTrackerDonation(donation)}
                          className="p-2 rounded-lg transition-colors border bg-[#7567E8]/10 hover:bg-[#7567E8]/20 text-[#7567E8] border-[#7567E8]/20"
                          title="Live Driver GPS"
                        >
                          <Navigation className="w-4 h-4 text-[#7567E8]" />
                        </button>
                        <button
                          onClick={() => setActiveChatDonation(donation)}
                          className="p-2 rounded-lg transition-colors border bg-white hover:bg-[#F4F2FA] text-[#111827] border-[#E5E7EB] shadow-sm"
                          title="Chat with NGO"
                        >
                          <MessageSquare className="w-4 h-4 text-[#4B5563]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-4">
            {filteredDonations.map((donation) => (
              <div
                key={donation.id}
                className="border border-[#E5E7EB] rounded-2xl p-5 space-y-4 bg-white shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 bg-[#7567E8]/10 text-[#7567E8] border-[#7567E8]/20">
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

                <div>
                  <div className="flex items-center gap-2 font-extrabold text-base mb-1 text-[#111827]">
                    <Building2 className="w-4 h-4 text-[#7567E8] shrink-0" />
                    <span className="break-words">{donation.ngo?.name || 'NGO Partner'}</span>
                  </div>
                  <p className="text-xs leading-relaxed break-words line-clamp-3 text-[#4B5563]">
                    {donation.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E7EB] text-[#4B5563]">
                  <span>Requested: {formatDate(donation.createdAt)}</span>
                  {donation.pickupDate && (
                    <span className="flex items-center gap-1 text-[#7567E8] font-bold">
                      <Calendar className="w-3 h-3" />
                      {donation.pickupDate}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => setDetailDonationId(donation.id)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border bg-white hover:bg-[#F4F2FA] text-[#111827] border-[#E5E7EB] shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#7567E8]" />
                    Inspect
                  </button>
                  <button
                    onClick={() => setActiveTrackerDonation(donation)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border bg-[#7567E8]/10 hover:bg-[#7567E8]/20 text-[#7567E8] border-[#7567E8]/20"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#7567E8]" />
                    GPS
                  </button>
                  <button
                    onClick={() => setActiveChatDonation(donation)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border bg-white hover:bg-[#F4F2FA] text-[#111827] border-[#E5E7EB] shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#4B5563]" />
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
              <div className="text-xs text-[#4B5563]">
                Page <span className="font-extrabold text-[#111827]">{page + 1}</span> of{' '}
                <span className="font-extrabold text-[#111827]">{totalPages}</span> ({totalElements} total items)
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-[#111827] hover:bg-[#F4F2FA] border-[#E5E7EB]"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-[#111827] hover:bg-[#F4F2FA] border-[#E5E7EB]"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>

                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="border text-xs font-semibold rounded-xl px-2.5 py-1.5 bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:border-[#7567E8]"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Donation Detail Inspector Modal */}
      {detailDonationId && (
        <DonationDetailModal
          donationId={detailDonationId}
          onClose={() => setDetailDonationId(null)}
          onOpenChat={(donation) => setActiveChatDonation(donation)}
          onOpenTracker={(donation) => setActiveTrackerDonation(donation)}
        />
      )}

      {/* Live Driver Tracker Modal */}
      {activeTrackerDonation && (
        <LiveDriverTrackerModal
          donationTitle={`${activeTrackerDonation.category} (${activeTrackerDonation.ngo?.name || 'NGO'})`}
          driverName="Vikram Singh (Volunteer Logistics)"
          driverPhone="+91 98765 43210"
          onClose={() => setActiveTrackerDonation(null)}
        />
      )}

      {/* Direct Chat Modal */}
      {activeChatDonation && (
        <div className="fixed inset-0 z-50 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border border-[#E5E7EB] rounded-2xl max-w-xl w-full p-6 relative flex flex-col space-y-4 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2 text-[#111827]">
                  <Building2 className="w-4 h-4 text-[#7567E8]" />
                  Chat with {activeChatDonation.ngo?.name}
                </h3>
                <p className="text-xs text-[#4B5563]">
                  Donation #{activeChatDonation.id.slice(0, 8)} ({activeChatDonation.category})
                </p>
              </div>
              <button
                onClick={() => setActiveChatDonation(null)}
                className="p-1.5 rounded-lg transition-colors bg-[#F9FAFB] text-[#4B5563] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CommentThread donationId={activeChatDonation.id} currentUserId={user?.id} />
          </div>
        </div>
      )}
    </div>
  );
};
