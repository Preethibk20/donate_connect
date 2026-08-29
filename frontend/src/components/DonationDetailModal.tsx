import React, { useEffect, useState } from 'react';
import { getDonationById } from '../api/donationApi';
import { Donation, DonationStatus } from '../types';
import { formatDate } from '../utils/formatters';
import { getPhotoUrl } from '../utils/photoHelper';
import {
  X,
  Building2,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  Eye,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  MessageSquare,
  Navigation,
  Image as ImageIcon,
} from 'lucide-react';

interface DonationDetailModalProps {
  donationId: string;
  onClose: () => void;
  onOpenChat?: (donation: Donation) => void;
  onOpenTracker?: (donation: Donation) => void;
}

export const DonationDetailModal: React.FC<DonationDetailModalProps> = ({
  donationId,
  onClose,
  onOpenChat,
  onOpenTracker,
}) => {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDonationById(donationId);
      setDonation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve donation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [donationId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedPhoto]);

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

  const isRejected = donation?.status === 'REJECTED';

  const normalSteps: { status: DonationStatus; label: string; description: string }[] = [
    { status: 'REQUESTED', label: 'Request Submitted', description: 'Donation request sent to NGO' },
    { status: 'ACCEPTED', label: 'Accepted by NGO', description: 'NGO accepted & scheduling pickup' },
    { status: 'PICKED_UP', label: 'Picked Up', description: 'Logistics team collected items' },
    { status: 'DELIVERED', label: 'Delivered', description: 'Received & verified by NGO' },
  ];

  const rejectedSteps: { status: DonationStatus; label: string; description: string }[] = [
    { status: 'REQUESTED', label: 'Request Submitted', description: 'Donation request sent to NGO' },
    { status: 'REJECTED', label: 'Request Rejected', description: 'NGO was unable to accept this request' },
  ];

  const steps = isRejected ? rejectedSteps : normalSteps;

  const getStepState = (stepStatus: DonationStatus, currentStatus?: DonationStatus) => {
    if (!currentStatus) return 'pending';

    if (currentStatus === 'REJECTED') {
      if (stepStatus === 'REQUESTED') return 'completed';
      if (stepStatus === 'REJECTED') return 'rejected';
      return 'pending';
    }

    const order: DonationStatus[] = ['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E7EB] rounded-2xl max-w-2xl w-full p-6 relative flex flex-col space-y-6 my-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7567E8]/10 border border-[#7567E8]/20 flex items-center justify-center text-[#7567E8] font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-[#111827]">Donation Inspector</h3>
                {donation && (
                  <span
                    className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded border ${getStatusBadgeStyle(
                      donation.status
                    )}`}
                  >
                    {donation.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4B5563] mt-0.5">
                ID: <span className="font-mono text-[#111827]">{donationId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F9FAFB] text-[#4B5563] hover:text-[#111827] hover:bg-[#F4F2FA] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#7567E8] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#4B5563] text-sm font-medium">Loading donation details from backend...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-center space-y-3 text-[#DC2626] my-4">
            <AlertTriangle className="w-8 h-8 text-[#DC2626] mx-auto" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={fetchDetail}
              className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#DC2626]/90 text-white text-xs font-bold transition-colors flex items-center gap-2 mx-auto shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : donation ? (
          <div className="space-y-6">
            {/* Lifecycle Timeline */}
            <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-[#4B5563]">
                <Clock className="w-3.5 h-3.5 text-[#7567E8]" />
                Status Timeline & Lifecycle
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                {steps.map((step) => {
                  const state = getStepState(step.status, donation.status);
                  return (
                    <div key={step.status} className="relative flex items-start gap-3">
                      <div className="absolute -left-6 top-0.5 rounded-full bg-[#F9FAFB]">
                        {state === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-[#047857] fill-[#E6F4EA]" />
                        ) : state === 'current' ? (
                          <div className="w-5 h-5 rounded-full bg-[#7567E8] border-2 border-[#9186F2] animate-pulse flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        ) : state === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-[#DC2626] fill-[#FEE2E2]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#D1D5DB]" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-bold ${
                              state === 'completed'
                                ? 'text-[#047857]'
                                : state === 'current'
                                ? 'text-[#7567E8] font-extrabold'
                                : state === 'rejected'
                                ? 'text-[#DC2626]'
                                : 'text-[#6B7280]'
                            }`}
                          >
                            {step.label}
                          </span>

                          <span className="text-[11px] text-[#6B7280]">
                            {step.status === 'REQUESTED'
                              ? formatDate(donation.createdAt)
                              : state === 'current' && donation.updatedAt
                              ? formatDate(donation.updatedAt)
                              : state === 'completed'
                              ? 'Completed'
                              : state === 'rejected' && donation.updatedAt
                              ? formatDate(donation.updatedAt)
                              : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-[#4B5563] mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Meta Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NGO Information Card */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Assigned NGO</span>
                  {donation.ngo?.verified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E6F4EA] text-[#047857] border border-[#A7F3D0] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-bold text-base text-[#111827]">
                  <Building2 className="w-4.5 h-4.5 text-[#7567E8] shrink-0" />
                  <span>{donation.ngo?.name || 'NGO Partner'}</span>
                </div>
                {donation.ngo?.address && (
                  <p className="text-xs text-[#4B5563]">Address: {donation.ngo.address}</p>
                )}
                {donation.ngo?.phone && (
                  <p className="text-xs text-[#4B5563]">Phone: {donation.ngo.phone}</p>
                )}
              </div>

              {/* Category & Schedule Card */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2.5 shadow-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1 text-[#4B5563]">
                    Category
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7567E8]/10 text-[#7567E8] border border-[#7567E8]/20">
                    <Tag className="w-3.5 h-3.5" />
                    {donation.category}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1 text-[#4B5563]">
                    Pickup Schedule
                  </span>
                  {donation.pickupDate ? (
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[#111827]">
                      <Calendar className="w-3.5 h-3.5 text-[#7567E8]" />
                      {donation.pickupDate}
                    </span>
                  ) : (
                    <span className="text-xs text-[#6B7280]">No date specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Item Description</h4>
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs leading-relaxed whitespace-pre-wrap text-[#111827]">
                {donation.description || 'No detailed item description was provided.'}
              </div>
            </div>

            {/* Photos Gallery */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-[#4B5563]">
                <ImageIcon className="w-3.5 h-3.5 text-[#7567E8]" />
                Attached Photos
              </h4>

              {donation.photoUrls && donation.photoUrls.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {donation.photoUrls.map((url, idx) => {
                    const fullUrl = getPhotoUrl(url);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedPhoto(fullUrl)}
                        className="group relative rounded-xl overflow-hidden border border-[#E5E7EB] hover:border-[#7567E8] transition-colors shrink-0"
                      >
                        <img
                          src={fullUrl}
                          alt={`Donation attachment ${idx + 1}`}
                          className="w-24 h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-[#111827]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs p-3 rounded-xl border border-[#E5E7EB] italic bg-[#F9FAFB] text-[#6B7280]">
                  No photo attachments provided for this donation request.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E5E7EB] pt-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {donation && onOpenTracker && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTracker(donation);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-[#7567E8]/10 hover:bg-[#7567E8]/20 text-[#7567E8] border-[#7567E8]/20"
              >
                <Navigation className="w-3.5 h-3.5 text-[#7567E8]" />
                Live Driver GPS
              </button>
            )}

            {donation && onOpenChat && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChat(donation);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white hover:bg-[#F4F2FA] text-[#111827] border-[#E5E7EB] shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#7567E8]" />
                Chat with NGO
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl font-bold text-xs transition-colors bg-[#F9FAFB] hover:bg-[#F4F2FA] text-[#111827] border border-[#E5E7EB]"
          >
            Close Inspector
          </button>
        </div>
      </div>

      {/* Lightbox Photo Overlay */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-[#111827]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto}
              alt="Enlarged attachment"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-[#E5E7EB] shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-4 -right-4 p-2 rounded-full bg-white text-[#111827] border border-[#E5E7EB] shadow-lg hover:bg-[#F9FAFB]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
