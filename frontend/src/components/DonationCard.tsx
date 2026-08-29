import React from 'react';
import { Donation, DonationStatus } from '../types';
import { formatDate, getCategoryBadgeColor } from '../utils/formatters';
import { Tag, User, Building2 } from 'lucide-react';
import { getPhotoUrl } from '../utils/photoHelper';

interface DonationCardProps {
  donation: Donation;
  onStatusChange?: (id: string, newStatus: DonationStatus) => void;
  isNgoView?: boolean;
}

export const DonationCard: React.FC<DonationCardProps> = ({ donation, onStatusChange, isNgoView }) => {
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

  return (
    <div className="group bg-white border border-[#E5E7EB] rounded-2xl p-5 hover:bg-[#F4F2FA] hover:border-[#7567E8] transition-all duration-300 shadow-[0_10px_15px_-3px_rgba(17,24,39,0.04)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${getCategoryBadgeColor(
              donation.category
            )}`}
          >
            <Tag className="w-3 h-3" />
            {donation.category}
          </span>
          <span className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded border ${getStatusBadgeStyle(donation.status)}`}>
            {donation.status}
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-[#111827] mb-1 group-hover:text-[#7567E8] transition-colors">
          {donation.category} Donation Request
        </h3>

        <p className="text-[#4B5563] text-sm mb-4 line-clamp-3 leading-relaxed">
          {donation.description || 'No detailed description provided.'}
        </p>

        {donation.photoUrls && donation.photoUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {donation.photoUrls.map((url, idx) => (
              <img
                key={idx}
                src={getPhotoUrl(url)}
                alt="Donation attachment"
                className="w-14 h-14 object-cover rounded-lg border border-[#E5E7EB]"
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E7EB] pt-4 mt-2 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#111827]">
            <Building2 className="w-3.5 h-3.5 text-[#7567E8]" />
            <span className="font-extrabold">{donation.ngo?.name || 'NGO Partner'}</span>
          </div>

          <div className="flex items-center gap-1 text-[#4B5563]">
            <User className="w-3.5 h-3.5 text-[#7567E8]" />
            <span>{donation.donor?.fullName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
          <span>Created: {formatDate(donation.createdAt)}</span>
          {donation.pickupDate && <span>Pickup: {donation.pickupDate}</span>}
        </div>

        {isNgoView && onStatusChange && (
          <div className="pt-2 flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#4B5563] uppercase">Update Status:</span>
            <select
              value={donation.status}
              onChange={(e) => onStatusChange(donation.id, e.target.value as DonationStatus)}
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1 text-xs text-[#7567E8] font-bold focus:outline-none focus:border-[#7567E8]"
            >
              <option value="REQUESTED">REQUESTED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="PICKED_UP">PICKED_UP</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
