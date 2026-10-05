import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDonationById, getLiveLocation, getDeliveryByDonationId, completeDelivery } from '../api/donationApi';
import { Donation, DeliveryDto } from '../types';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Navigation, Clock, ShieldCheck, MapPin, AlertTriangle, RefreshCw, Compass, CheckCircle, Upload, KeyRound } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { OtpInput } from '../components/OtpInput';
import { getWsUrl } from '../utils/urlUtils';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233967.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

export const TrackDeliveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [donation, setDonation] = useState<Donation | null>(null);
  const [delivery, setDelivery] = useState<DeliveryDto | null>(null);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [path, setPath] = useState<[number, number][]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // OSRM Route & ETA State
  const [osrmPath, setOsrmPath] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<string | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [lastOsrmRefresh, setLastOsrmRefresh] = useState<Date | null>(null);

  // Proof of delivery state
  const [otp, setOtp] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  // Poll fallback interval
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    
    // Fetch Donation to get NGO/Donor info
    getDonationById(id).then((d) => setDonation(d)).catch(console.error);
    getDeliveryByDonationId(id).then((d) => setDelivery(d)).catch(console.error);

    // Initial Location fetch
    const fetchLoc = async () => {
      try {
        const loc = await getLiveLocation(id);
        if (loc.lat && loc.lng) {
          setCurrentLoc({ lat: loc.lat, lng: loc.lng });
          setPath((prev) => [...prev, [loc.lat, loc.lng]]);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Failed to fetch initial location', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoc();

    // Setup STOMP WebSocket
    const client = new Client({
      webSocketFactory: () => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        return new SockJS(getWsUrl(baseUrl));
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {},
      onConnect: () => {
        client.subscribe(`/topic/donation/${id}`, (msg) => {
          const loc = JSON.parse(msg.body);
          if (loc.lat && loc.lng) {
            setCurrentLoc({ lat: loc.lat, lng: loc.lng });
            setPath((prev) => {
              const last = prev[prev.length - 1];
              if (last && last[0] === loc.lat && last[1] === loc.lng) return prev;
              return [...prev, [loc.lat, loc.lng]];
            });
            setLastUpdated(new Date());
            setIsOffline(false);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      },
    });

    client.activate();

    // Fallback polling
    pollInterval.current = setInterval(async () => {
      if (!client.connected) {
        try {
          const loc = await getLiveLocation(id);
          if (loc.lat && loc.lng) {
            setCurrentLoc({ lat: loc.lat, lng: loc.lng });
            setPath((prev) => {
              const last = prev[prev.length - 1];
              if (last && last[0] === loc.lat && last[1] === loc.lng) return prev;
              return [...prev, [loc.lat, loc.lng]];
            });
            setLastUpdated(new Date());
          }
        } catch (e) {
          console.error('Polling failed', e);
        }
      }
    }, 10000);

    return () => {
      client.deactivate();
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [id, token]);

  // Offline checker
  useEffect(() => {
    const checkOffline = setInterval(() => {
      setLastUpdated(prev => {
        if (prev) {
          const diff = (Date.now() - prev.getTime()) / 1000;
          setIsOffline(diff > 30);
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(checkOffline);
  }, []);

  // OSRM Route & ETA fetch (Refreshes every 30 seconds)
  useEffect(() => {
    if (!currentLoc || !donation?.ngo) return;
    if (donation.status === 'DELIVERED' || donation.status === 'REJECTED') return;

    const isRoutingToPickup = delivery?.status === 'ASSIGNED' || delivery?.status === 'ACCEPTED_BY_VOLUNTEER' || delivery?.status === 'EN_ROUTE_TO_PICKUP';
    
    const targetLat = isRoutingToPickup && donation.pickupLat ? donation.pickupLat : (donation.ngo.latitude || currentLoc.lat + 0.03);
    const targetLng = isRoutingToPickup && donation.pickupLng ? donation.pickupLng : (donation.ngo.longitude || currentLoc.lng + 0.03);

    const fetchRoute = async () => {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${currentLoc.lng},${currentLoc.lat};${targetLng},${targetLat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distKm = (route.distance / 1000).toFixed(1);
          const mins = Math.round(route.duration / 60);

          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );

          setOsrmPath(coords);
          setDistanceKm(distKm);
          setEtaMinutes(mins);
          setLastOsrmRefresh(new Date());
        }
      } catch (err) {
        console.error('OSRM route fetch failed:', err);
      }
    };

    // Fetch immediately
    fetchRoute();

    // Refresh OSRM route every 30 seconds
    const interval = setInterval(fetchRoute, 30000);
    return () => clearInterval(interval);
  }, [currentLoc?.lat, currentLoc?.lng, donation?.ngo?.latitude, donation?.ngo?.longitude, donation?.status]);

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
        <Navigation className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium">Initializing live map tracker...</p>
      </div>
    );
  }

  const pickupPoint: [number, number] = [
    donation?.pickupLat || (path.length > 0 ? path[0][0] : 28.6139),
    donation?.pickupLng || (path.length > 0 ? path[0][1] : 77.2090)
  ];
  const ngoLat = donation?.ngo?.latitude || (currentLoc ? currentLoc.lat + 0.03 : 28.6439);
  const ngoLng = donation?.ngo?.longitude || (currentLoc ? currentLoc.lng + 0.03 : 77.2390);
  const ngoPoint: [number, number] = [ngoLat, ngoLng];
  const isRoutingToPickup = delivery?.status === 'ASSIGNED' || delivery?.status === 'ACCEPTED_BY_VOLUNTEER' || delivery?.status === 'EN_ROUTE_TO_PICKUP';

  const handleCompleteDelivery = async () => {
    if (!delivery || !otp || !proofImage) {
      setProofError('OTP and Proof Image are required');
      return;
    }
    if (otp.length !== 6) {
      setProofError('OTP must be 6 digits');
      return;
    }
    try {
      setSubmittingProof(true);
      setProofError(null);
      await completeDelivery(delivery.id, otp, proofImage);
      // Refresh page data
      const updatedDonation = await getDonationById(id as string);
      setDonation(updatedDonation);
    } catch (err: any) {
      setProofError(err.response?.data?.message || err.message || 'Failed to complete delivery');
    } finally {
      setSubmittingProof(false);
    }
  };

  const isVolunteer = user?.role === 'VOLUNTEER';
  const showProofForm = isVolunteer && donation?.status === 'PICKED_UP';

  return (
    <div className="py-6 space-y-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Navigation className="w-6 h-6 text-indigo-600" />
              Live Delivery Tracking
            </h1>
            <p className="text-sm text-slate-500">
              Donation Category: <span className="font-semibold text-slate-700">{donation?.category}</span>
            </p>
          </div>
        </div>

        {/* 30s Refresh Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-700">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          OSRM Route auto-refreshed (30s)
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance to {isRoutingToPickup ? 'Pickup' : 'NGO'}</p>
            <p className="text-xl font-black text-slate-900">
              {distanceKm ? `${distanceKm} km` : 'Calculating...'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated ETA</p>
            <p className="text-xl font-black text-slate-900">
              {etaMinutes !== null ? `${etaMinutes} mins` : 'Calculating...'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Destination</p>
            <p className="text-sm font-bold text-slate-900 truncate">{isRoutingToPickup ? 'Pickup Location' : (donation?.ngo?.name || 'NGO Destination')}</p>
            <p className="text-[11px] text-slate-500 truncate">{isRoutingToPickup ? donation?.pickupAddress || 'Address not provided' : donation?.ngo?.address}</p>
          </div>
        </div>
      </div>

      {/* Proof of Delivery Panel */}
      {showProofForm && (
        <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-lg border border-indigo-800">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="text-emerald-400 w-6 h-6" />
                Complete Delivery
              </h2>
              <p className="text-indigo-200 text-sm">
                You have reached the NGO! To finalize this delivery, ask the NGO receiver to enter the OTP shown below, and upload a photo of the handed-over items.
              </p>
              

            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xl w-full md:w-[400px] text-slate-800">
              <h3 className="font-bold mb-4 text-slate-900 border-b pb-2">Verification Form</h3>
              
              {proofError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{proofError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enter NGO OTP</label>
                  <div className="flex justify-center bg-slate-900 rounded-xl p-3 border border-slate-800 shadow-inner">
                    <OtpInput value={otp} onChange={setOtp} length={6} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery Photo</label>
                  <label className="flex items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-colors bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                      <Upload className="w-6 h-6 mb-2 text-indigo-400" />
                      <p className="text-sm font-semibold">{proofImage ? proofImage.name : 'Tap to upload photo'}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <button
                  onClick={handleCompleteDelivery}
                  disabled={submittingProof || !otp || !proofImage || otp.length !== 6}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md shadow-indigo-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {submittingProof ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {submittingProof ? 'Verifying...' : 'Complete Delivery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="bg-slate-900 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <img src="https://cdn-icons-png.flaticon.com/512/3233/3233967.png" alt="truck" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                {donation?.status === 'DELIVERED' ? (
                  <span className="text-emerald-400">Delivery Completed</span>
                ) : donation?.status === 'REJECTED' ? (
                  <span className="text-rose-400">Delivery Cancelled</span>
                ) : (
                  'Volunteer En Route'
                )}
                {donation?.status === 'DELIVERED' ? (
                  <span className="text-[10px] font-bold bg-emerald-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Delivered
                  </span>
                ) : isOffline ? (
                  <span className="text-[10px] font-bold bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Offline
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" /> Live GPS
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {donation?.status === 'DELIVERED'
                  ? 'Live location tracking ended.'
                  : `Last GPS Signal: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Waiting for signal...'}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-400" /> Pickup Location</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> {donation?.ngo?.name || 'NGO Hub'}</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[520px] w-full z-0 relative bg-slate-100">
          {currentLoc ? (
            <MapContainer
              center={[currentLoc.lat, currentLoc.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Pickup Marker */}
              {pickupPoint && (
                <Marker position={pickupPoint as [number, number]}>
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-slate-900">Pickup Location</p>
                      <p className="text-xs text-slate-600">{donation?.pickupAddress || 'No exact address'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination NGO Marker */}
              <Marker position={ngoPoint}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-slate-900">{donation?.ngo?.name}</p>
                    <p className="text-xs text-slate-600">{donation?.ngo?.address}</p>
                  </div>
                </Popup>
              </Marker>

              {/* OSRM Route Polyline (Planned route to NGO) */}
              {osrmPath.length > 0 && (
                <Polyline positions={osrmPath} color="#6366f1" weight={6} opacity={0.85} dashArray="8, 8" />
              )}

              {/* Traveled GPS History Path Polyline */}
              {path.length > 1 && (
                <Polyline positions={path} color="#10b981" weight={4} opacity={0.9} />
              )}

              {/* Driver Truck Marker */}
              <Marker position={[currentLoc.lat, currentLoc.lng]} icon={truckIcon}>
                <Popup>Volunteer Current Location</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <Navigation className="w-12 h-12 animate-pulse text-indigo-300" />
              <p className="font-semibold">Waiting for GPS signal from driver...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
