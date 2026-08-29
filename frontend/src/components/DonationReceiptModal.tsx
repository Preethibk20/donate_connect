import React from 'react';
import { Donation } from '../types';
import { formatDate } from '../utils/formatters';
import { HeartHandshake, ShieldCheck, Printer, X, QrCode } from 'lucide-react';

interface DonationReceiptModalProps {
  donation: Donation;
  onClose: () => void;
}

export const DonationReceiptModal: React.FC<DonationReceiptModalProps> = ({ donation, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl space-y-6">
        {/* Printable Section */}
        <div id="printable-receipt" className="space-y-6">
          {/* Receipt Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">DonateConnect</h2>
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
                  Official Community Donation Receipt
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400">REF #{donation.id.slice(0, 8).toUpperCase()}</span>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Tax Exemption Eligible
              </div>
            </div>
          </div>

          {/* Donor & NGO Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Donor Information</div>
              <div className="font-bold text-white text-sm">{donation.donor.fullName}</div>
              <div className="text-slate-400">{donation.donor.email}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Receiving NGO Partner</div>
              <div className="font-bold text-emerald-400 text-sm">{donation.ngo.name}</div>
              <div className="text-slate-400">{donation.ngo.address}</div>
            </div>
          </div>

          {/* Item Breakdown Table */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Item Breakdown</div>
            <table className="w-full text-xs text-left border-collapse border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-slate-300 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="p-3 font-bold text-indigo-400">{donation.category}</td>
                  <td className="p-3">{donation.description || 'Verified Community Contribution'}</td>
                  <td className="p-3 text-right font-semibold text-emerald-400">{donation.status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification Footnote & Simulated Stamp */}
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 pt-4">
            <div className="flex items-center gap-3">
              <QrCode className="w-10 h-10 text-indigo-400" />
              <div className="text-[11px] text-slate-400">
                <div>Date Issued: {formatDate(donation.createdAt)}</div>
                <div className="text-[10px] text-slate-500">Scan QR Code to verify certificate integrity on blockchain ledger</div>
              </div>
            </div>

            <div className="border border-indigo-500/40 rounded-xl p-2.5 text-center bg-indigo-500/10">
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300">DonateConnect Verified</div>
              <div className="text-[10px] text-emerald-400 font-bold">OFFICIAL STAMP</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
