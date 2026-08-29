import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createDonation, uploadDonationPhoto } from '../api/donationApi';
import { getVerifiedNgos } from '../api/ngoApi';
import { CreateDonationRequest, NGOProfile } from '../types';
import { HeartHandshake, ArrowLeft, Send, Building2, UploadCloud, X, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PHOTOS = 5;

const getTodayInputValue = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
};

interface UploadedPhoto {
  previewUrl: string; // local object URL for preview
  serverUrl: string;  // URL returned by backend storage endpoint
}

export const CreateDonationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedNgoId = searchParams.get('ngoId') || '';
  const { showSuccess, showError } = useToast();

  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loadingNgos, setLoadingNgos] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const todayInputValue = getTodayInputValue();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateDonationRequest>({
    defaultValues: {
      ngoId: preselectedNgoId,
      category: 'CLOTHES',
    },
  });

  useEffect(() => {
    getVerifiedNgos()
      .then((data) => {
        setNgos(data);
        if (preselectedNgoId && data.some((n) => n.id === preselectedNgoId)) {
          setValue('ngoId', preselectedNgoId);
        }
      })
      .catch(() => setNgos([]))
      .finally(() => setLoadingNgos(false));
  }, [preselectedNgoId, setValue]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoError(null);
    const incomingFiles = Array.from(files);
    const remainingSlots = MAX_PHOTOS - photos.length;

    if (remainingSlots <= 0) {
      setPhotoError(`You can upload up to ${MAX_PHOTOS} photos.`);
      e.target.value = '';
      return;
    }

    const validFiles: File[] = [];

    for (const file of incomingFiles.slice(0, remainingSlots)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setPhotoError('Photos must be PNG, JPG, or WEBP images.');
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setPhotoError('Each photo must be 10 MB or smaller.');
        continue;
      }
      validFiles.push(file);
    }

    if (incomingFiles.length > remainingSlots) {
      setPhotoError(`Only ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'} can be added.`);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setUploadingPhotos(true);
    const uploaded: UploadedPhoto[] = [];

    for (const file of validFiles) {
      try {
        const previewUrl = URL.createObjectURL(file);
        const serverUrl = await uploadDonationPhoto(file);
        uploaded.push({ previewUrl, serverUrl });
      } catch (err: any) {
        setPhotoError(err.message || 'Failed to upload one or more photos.');
      }
    }

    setPhotos((prev) => [...prev, ...uploaded]);
    setUploadingPhotos(false);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setPhotoError(null);
  };

  const onSubmit = async (data: CreateDonationRequest) => {
    if (photos.length === 0) {
      setPhotoError('Please upload at least one clear photo of the items.');
      return;
    }

    setSubmitting(true);
    setServerError(null);
    setPhotoError(null);
    try {
      await createDonation({
        ...data,
        description: data.description?.trim(),
        photoUrls: photos.map((p) => p.serverUrl),
      });
      showSuccess('Donation request submitted successfully!');
      navigate('/donations');
    } catch (err: any) {
      const msg = err.message || 'Failed to submit donation.';
      setServerError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Donation Request</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Select a verified NGO partner and specify the items you wish to donate
            </p>
          </div>
        </div>

        {serverError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* NGO Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select NGO Partner *
            </label>
            {loadingNgos ? (
              <div className="text-xs text-slate-500 p-3 bg-slate-950 rounded-xl border border-slate-800">
                Loading verified NGOs...
              </div>
            ) : ngos.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>No verified NGOs available yet. Please check back soon or contact Admin.</span>
              </div>
            ) : (
              <select
                {...register('ngoId', { required: 'Please select an NGO' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Choose Verified NGO --</option>
                {ngos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.address})
                  </option>
                ))}
              </select>
            )}
            {errors.ngoId && (
              <p className="text-rose-400 text-xs mt-1">{errors.ngoId.message}</p>
            )}
          </div>

          {/* Category & Pickup Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="CLOTHES">CLOTHES</option>
                <option value="FOOD">FOOD</option>
                <option value="BOOKS">BOOKS</option>
                <option value="STATIONERY">STATIONERY</option>
                <option value="TOYS">TOYS</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Preferred Pickup Date
              </label>
              <input
                type="date"
                min={todayInputValue}
                {...register('pickupDate', {
                  required: 'Preferred pickup date is required',
                  validate: (value) =>
                    !value || value >= todayInputValue || 'Pickup date cannot be in the past',
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {errors.pickupDate && (
                <p className="text-rose-400 text-xs mt-1">{errors.pickupDate.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Item Description & Condition *
            </label>
            <textarea
              rows={4}
              placeholder="Describe the items being donated (e.g. 5 winter jackets in good condition, sizes M and L)..."
              {...register('description', {
                required: 'Item description is required',
                validate: (value) => {
                  const trimmed = value?.trim() || '';
                  if (trimmed.length < 20) {
                    return 'Description must be at least 20 characters';
                  }
                  if (trimmed.length > 2000) {
                    return 'Description must be 2000 characters or fewer';
                  }
                  return true;
                },
              })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {errors.description && (
              <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Item Photos *
            </label>
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-950/40">
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                disabled={uploadingPhotos}
                className="hidden"
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <UploadCloud className="w-8 h-8 text-indigo-400" />
                <span className="text-xs text-slate-300 font-medium">Click to upload photo attachments</span>
                <span className="text-[10px] text-slate-500">PNG, JPG, WEBP only. Up to {MAX_PHOTOS} photos, 10 MB each.</span>
              </label>
            </div>
            {photoError && <p className="text-rose-400 text-xs mt-1">{photoError}</p>}

            {/* Upload Progress Indicator */}
            {uploadingPhotos && (
              <div className="flex items-center gap-2 text-xs text-indigo-300 mt-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading photo to server...
              </div>
            )}

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-700">
                    <img src={photo.previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-rose-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingPhotos || ngos.length === 0}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Request...
                </>
              ) : uploadingPhotos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading Photos...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Donation Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
