import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createDonation, uploadDonationPhoto } from '../api/donationApi';
import { getVerifiedNgos } from '../api/ngoApi';
import { CreateDonationRequest, NGOProfile } from '../types';
import { HeartHandshake, ArrowLeft, Send, Building2, UploadCloud, X, Loader2, MapPin, Search, Navigation } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

function ChangeView({ center }: { center: L.LatLngExpression }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

function LocationPicker({ position, onLocationSelect }: { position: L.LatLngExpression | null, onLocationSelect: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export const CreateDonationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedNgoId = searchParams.get('ngoId') || '';
  const { showSuccess, showError } = useToast();

  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loadingNgos, setLoadingNgos] = useState(true);
  
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [hasPromptedLocation, setHasPromptedLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const todayInputValue = getTodayInputValue();
  const [mapPosition, setMapPosition] = useState<L.LatLng | null>(null);

  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([12.9716, 77.5946]);
  const [geocoding, setGeocoding] = useState(false);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
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

  const addressValue = watch('pickupAddress');

  useEffect(() => {
    if (!addressValue || addressValue.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!isTyping) return;

    const timer = setTimeout(async () => {
      try {
        let cLat = 12.9716;
        let cLng = 77.5946;
        if (Array.isArray(mapCenter)) {
          cLat = mapCenter[0] as number;
          cLng = mapCenter[1] as number;
        } else if ((mapCenter as any).lat) {
          cLat = (mapCenter as any).lat;
          cLng = (mapCenter as any).lng;
        }
        const viewbox = `${cLng - 0.5},${cLat + 0.5},${cLng + 0.5},${cLat - 0.5}`;
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressValue)}&limit=5&countrycodes=in&viewbox=${viewbox}&bounded=1&accept-language=en`);
        const data = await response.json();
        if (data && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions');
      }
    }, 1000); // 1s debounce to respect Nominatim limits

    return () => clearTimeout(timer);
  }, [addressValue, isTyping]);

  const handleSuggestionClick = (suggestion: any) => {
    setIsTyping(false);
    setValue('pickupAddress', suggestion.display_name, { shouldValidate: true });
    
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    const newPos = new L.LatLng(lat, lon);
    
    setMapCenter(newPos);
    setMapPosition(newPos);
    setShowSuggestions(false);
    showSuccess('Location pinned!');
  };

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

  const handleFindOnMap = async () => {
    const address = getValues('pickupAddress');
    if (!address) {
      showError('Please type an address first before finding on map.');
      return;
    }
    
    setGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&accept-language=en`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const newPos = new L.LatLng(lat, lon);
        setMapCenter(newPos);
        setMapPosition(newPos);
        showSuccess('Location found! Pin updated on map.');
      } else {
        showError('Could not find that address on the map. Please move the pin manually.');
      }
    } catch (err) {
      showError('Map search failed. Please tap the map manually to pin your location.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser.');
      return;
    }
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const newPos = new L.LatLng(lat, lon);
        setMapCenter(newPos);
        setMapPosition(newPos);
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
          const data = await response.json();
          if (data && data.display_name) {
            setValue('pickupAddress', data.display_name, { shouldValidate: true });
          }
          showSuccess('Current location pinned!');
        } catch (err) {
          showSuccess('Pinned location on map, but could not fetch address name.');
        } finally {
          setGeocoding(false);
        }
      },
      (error) => {
        setGeocoding(false);
        console.error("Geolocation error:", error);
        showError(`Unable to retrieve location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleMapClick = async (pos: L.LatLng) => {
    setMapPosition(pos);
    setGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&accept-language=en`);
      const data = await response.json();
      if (data && data.display_name) {
        setValue('pickupAddress', data.display_name, { shouldValidate: true });
        showSuccess('Address updated from map pin!');
      }
    } catch (err) {
      console.error('Failed to reverse geocode clicked location');
    } finally {
      setGeocoding(false);
    }
  };

  const onSubmit = async (data: CreateDonationRequest) => {
    if (photos.length === 0) {
      setPhotoError('Please upload at least one clear photo of the items.');
      return;
    }
    if (!mapPosition) {
      setServerError('Please select a pickup location on the map.');
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
        pickupLat: mapPosition.lat,
        pickupLng: mapPosition.lng,
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
            <label htmlFor="ngo-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
                id="ngo-select"
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
              <label htmlFor="category-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                id="category-select"
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
              <label htmlFor="pickup-date" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Preferred Pickup Date
              </label>
              <input
                id="pickup-date"
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

            <div>
              <label htmlFor="time-slot" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Preferred Time Slot
              </label>
              <select
                id="time-slot"
                {...register('pickupTimeSlot', { required: 'Time slot is required' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Choose Time Slot --</option>
                <option value="MORNING_9_12">Morning (9 AM - 12 PM)</option>
                <option value="AFTERNOON_12_4">Afternoon (12 PM - 4 PM)</option>
                <option value="EVENING_4_8">Evening (4 PM - 8 PM)</option>
              </select>
              {errors.pickupTimeSlot && (
                <p className="text-rose-400 text-xs mt-1">{errors.pickupTimeSlot.message}</p>
              )}
            </div>
          </div>

          {/* Pickup Address & Location */}
          <div className="space-y-4">
            <div>
              <label htmlFor="pickup-address" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Pickup Address *
              </label>
              <div className="flex gap-3 relative">
                <div className="flex-1">
                  <input
                    id="pickup-address"
                    type="text"
                    placeholder="Enter complete pickup address (e.g. 123 Main St, Apt 4B...)"
                    {...(() => {
                      const { onChange, onBlur, name, ref } = register('pickupAddress', { required: 'Pickup address is required' });
                      return {
                        name,
                        ref,
                        onChange: (e: any) => {
                          setIsTyping(true);
                          onChange(e);
                        },
                        onFocus: () => {
                          if (!hasPromptedLocation && !getValues('pickupAddress')) {
                            setHasPromptedLocation(true);
                            setShowLocationPrompt(true);
                          }
                        },
                        onBlur: (e: any) => {
                          setTimeout(() => setShowSuggestions(false), 200);
                          onBlur(e);
                        }
                      };
                    })()}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  
                  {/* Location Prompt Popup */}
                  {showLocationPrompt && (
                    <div className="absolute bottom-full mb-3 left-0 right-0 bg-slate-900 border border-indigo-500/50 p-4 rounded-xl shadow-2xl z-[1200] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-sm text-slate-200 font-medium flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        Would you like to use your current GPS location for the pickup address?
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button" 
                          onClick={() => setShowLocationPrompt(false)} 
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-white transition-colors"
                        >
                          No, I'll type it
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { 
                            setShowLocationPrompt(false); 
                            handleUseCurrentLocation(); 
                          }} 
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-colors"
                        >
                          Yes, use GPS
                        </button>
                      </div>
                    </div>
                  )}

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[1100] max-h-60 overflow-y-auto">
                      {suggestions.map((s, idx) => (
                        <div
                          key={idx}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur before click registers
                            handleSuggestionClick(s);
                          }}
                          className="px-4 py-3 hover:bg-[#7567E8] group cursor-pointer border-b border-slate-800/50 last:border-0 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 mt-0.5 text-indigo-400 group-hover:text-white shrink-0 transition-colors" />
                            <span className="text-sm text-slate-200 group-hover:text-white transition-colors">{s.display_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.pickupAddress && (
                    <p className="text-rose-400 text-xs mt-1">{errors.pickupAddress.message}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={geocoding}
                    title="Use Current Location"
                    className="p-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {geocoding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleFindOnMap}
                    disabled={geocoding}
                    title="Find Typed Address on Map"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {geocoding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                Pin Location on Map *
              </label>
              <div className="h-[250px] w-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <ChangeView center={mapCenter} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <LocationPicker position={mapPosition} onLocationSelect={handleMapClick} />
                </MapContainer>
                {!mapPosition && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center pointer-events-none z-[1000]">
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold border border-slate-700 shadow-xl">
                      Tap map to pin exact location
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Item Description & Condition *
            </label>
            <textarea
              id="description"
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
