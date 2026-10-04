import React, { useState, useEffect } from 'react';
import { X, Star, Loader2, CheckCircle } from 'lucide-react';
import { Donation, DeliveryDto } from '../types';
import { addNgoRating } from '../api/ngoApi';
import { addVolunteerRating } from '../api/volunteerApi';
import { apiClient } from '../api/client'; // Assuming standard axios instance

interface RatingModalProps {
  donation: Donation;
  onClose: () => void;
  onSuccess: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ donation, onClose, onSuccess }) => {
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [delivery, setDelivery] = useState<DeliveryDto | null>(null);
  
  const [ngoRating, setNgoRating] = useState(0);
  const [ngoReview, setNgoReview] = useState('');
  
  const [volunteerRating, setVolunteerRating] = useState(0);
  const [volunteerReview, setVolunteerReview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await apiClient.get(`/deliveries/donation/${donation.id}`);
        setDelivery(res.data.data);
      } catch (err) {
        console.warn('No delivery found or failed to fetch', err);
      } finally {
        setLoadingDelivery(false);
      }
    };
    fetchDelivery();
  }, [donation.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ngoRating === 0) {
      setError('Please provide a rating for the NGO.');
      return;
    }
    if (delivery?.volunteerId && volunteerRating === 0) {
      setError('Please provide a rating for the volunteer.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Rate NGO
      await addNgoRating(donation.ngo.id, { rating: ngoRating, review: ngoReview });
      
      // Rate Volunteer if applicable
      if (delivery?.volunteerId) {
        await addVolunteerRating(delivery.volunteerId, { rating: volunteerRating, review: volunteerReview });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ratings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, setRating: (val: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`p-1 transition-colors ${rating >= star ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
          >
            <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Thank You!</h3>
          <p className="text-slate-500 text-sm">Your feedback helps improve our community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Rate Your Experience</h3>
            <p className="text-xs text-slate-500 mt-0.5">Donation to {donation.ngo.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loadingDelivery ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">
                  Rate the NGO ({donation.ngo.name})
                </label>
                {renderStars(ngoRating, setNgoRating)}
                <textarea
                  placeholder="Share your experience with the NGO (optional)"
                  value={ngoReview}
                  onChange={(e) => setNgoReview(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  rows={2}
                  maxLength={1000}
                />
              </div>

              {delivery?.volunteerId && (
                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700">
                    Rate the Volunteer
                  </label>
                  {renderStars(volunteerRating, setVolunteerRating)}
                  <textarea
                    placeholder="How was the pickup/delivery experience? (optional)"
                    value={volunteerReview}
                    onChange={(e) => setVolunteerReview(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    rows={2}
                    maxLength={1000}
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || ngoRating === 0 || (!!delivery?.volunteerId && volunteerRating === 0)}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
