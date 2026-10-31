import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDonationById, getLiveLocation, getDeliveryByDonationId, completeDelivery } from '../api/donationApi';
import { Donation, DeliveryDto } from '../types';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  RefreshCw, 
  Compass, 
  CheckCircle, 
  Upload, 
  ExternalLink,
  Zap,
  ChevronDown,
  ChevronUp,
  Truck,
  StopCircle,
  Home,
  Building2
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { OtpInput } from '../components/OtpInput';
import { getWsUrl } from '../utils/urlUtils';

// Types for Route Maneuvers
export interface RouteStep {
  instruction: string;
  distanceM: number;
  durationS: number;
  modifier?: string;
  type?: string;
  name?: string;
}

// Convert OSRM raw step maneuvers into friendly directions
const formatManeuver = (step: any): string => {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier;
  const street = step?.name ? ` onto ${step.name}` : (step?.ref ? ` onto ${step.ref}` : '');

  if (type === 'depart') return `Head out${street}`;
  if (type === 'arrive') return 'Arrive at destination';
  if (type === 'turn') {
    if (modifier === 'left') return `Turn left${street}`;
    if (modifier === 'right') return `Turn right${street}`;
    if (modifier === 'slight left') return `Slight left${street}`;
    if (modifier === 'slight right') return `Slight right${street}`;
    if (modifier === 'sharp left') return `Sharp left${street}`;
    if (modifier === 'sharp right') return `Sharp right${street}`;
    if (modifier === 'uturn') return `Make a U-turn${street}`;
    return `Turn ${modifier || ''}${street}`;
  }
  if (type === 'new name') return `Continue${street}`;
  if (type === 'continue') return `Continue straight${street}`;
  if (type === 'fork') return `Keep ${modifier || 'straight'} at fork${street}`;
  if (type === 'roundabout') return `Take roundabout exit${street}`;
  if (modifier) return `Head ${modifier}${street}`;
  return street ? `Proceed${street}` : 'Continue on current road';
};

// Custom Leaflet Icons
const driverIcon = L.divIcon({
  className: 'custom-driver-icon',
  html: `<div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
    <div style="position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(99,102,241,0.35); animation:pulse 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:relative; width:34px; height:34px; border-radius:50%; background:#4f46e5; border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.35);">
      <img src="https://cdn-icons-png.flaticon.com/512/3233/3233967.png" style="width:20px; height:20px;" />
    </div>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

const donorMarkerIcon = L.divIcon({
  className: 'custom-donor-icon',
  html: `<div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
    <div style="width:36px; height:36px; border-radius:10px; background:#f59e0b; border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(245,158,11,0.4);">
      <span style="font-size:18px;">🏠</span>
    </div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const ngoMarkerIcon = L.divIcon({
  className: 'custom-ngo-icon',
  html: `<div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
    <div style="width:36px; height:36px; border-radius:10px; background:#10b981; border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(16,185,129,0.4);">
      <span style="font-size:18px;">🏛️</span>
    </div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
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

  // 2-Leg Multi-Waypoint Routing States
  const [leg1Path, setLeg1Path] = useState<[number, number][]>([]);
  const [leg2Path, setLeg2Path] = useState<[number, number][]>([]);
  const [leg1DistKm, setLeg1DistKm] = useState<string>('2.5');
  const [leg1EtaMins, setLeg1EtaMins] = useState<number>(8);
  const [leg2DistKm, setLeg2DistKm] = useState<string>('12.9');
  const [leg2EtaMins, setLeg2EtaMins] = useState<number>(37);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  // Live Driving Simulation
  const [isSimulatingLocally, setIsSimulatingLocally] = useState<boolean>(false);
  const [simulationStage, setSimulationStage] = useState<'IDLE' | 'TO_DONOR' | 'AT_DONOR' | 'TO_NGO' | 'AT_NGO'>('IDLE');
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Proof of delivery state
  const [otp, setOtp] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  // Poll fallback interval
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    
    getDonationById(id).then((d) => {
      setDonation(d);
      const defaultDonorLat = d.pickupLat || 12.9716;
      const defaultDonorLng = d.pickupLng || 77.5946;
      const initialDriverLat = defaultDonorLat - 0.02;
      const initialDriverLng = defaultDonorLng - 0.02;
      
      setCurrentLoc((prev) => prev || { lat: initialDriverLat, lng: initialDriverLng });
      setPath((prev) => prev.length > 0 ? prev : [[initialDriverLat, initialDriverLng]]);
    }).catch(console.error);

    getDeliveryByDonationId(id).then((d) => setDelivery(d)).catch(console.error);

    const fetchLoc = async () => {
      try {
        const loc = await getLiveLocation(id);
        if (loc && loc.lat && loc.lng) {
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
  }, [id]);

  // STOMP WebSocket for Live Driver Position Updates
  useEffect(() => {
    if (!id) return;

    const socketUrl = getWsUrl('/ws');
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/delivery/${id}/location`, (message) => {
        try {
          const loc = JSON.parse(message.body);
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
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      });
    };

    client.activate();

    // Fallback polling every 5s
    pollInterval.current = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          const loc = await getLiveLocation(id);
          if (loc && loc.lat && loc.lng) {
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
    }, 5000);

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

  // Compute 2-Leg Routes (Leg 1: Driver -> Donor, Leg 2: Donor -> NGO)
  useEffect(() => {
    if (!currentLoc) return;

    const donorLat = donation?.pickupLat || 12.9716;
    const donorLng = donation?.pickupLng || 77.5946;
    const ngoLat = donation?.ngo?.latitude || 12.9899;
    const ngoLng = donation?.ngo?.longitude || 77.5534;
    const driverLat = currentLoc.lat;
    const driverLng = currentLoc.lng;

    const generateFallback = (sLat: number, sLng: number, eLat: number, eLng: number, steps = 30): [number, number][] => {
      const pts: [number, number][] = [];
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        pts.push([sLat + (eLat - sLat) * t, sLng + (eLng - sLng) * t]);
      }
      return pts;
    };

    const fetchBothLegs = async () => {
      try {
        // Leg 1: Driver -> Donor Pickup
        const url1 = `https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${donorLng},${donorLat}?overview=full&geometries=geojson&steps=true`;
        const res1 = await fetch(url1);
        const data1 = await res1.json();

        let l1Steps: RouteStep[] = [];
        if (data1.code === 'Ok' && data1.routes?.[0]) {
          const r1 = data1.routes[0];
          const distKm = (r1.distance / 1000).toFixed(1);
          const eta = Math.max(Math.round((r1.distance / 1000 / 20) * 60), Math.round(r1.duration / 60));
          setLeg1DistKm(distKm);
          setLeg1EtaMins(eta);
          setLeg1Path(r1.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));

          l1Steps = (r1.legs?.[0]?.steps || []).map((s: any) => ({
            instruction: `[Leg 1 to Donor] ${formatManeuver(s)}`,
            distanceM: Math.round(s.distance || 0),
            durationS: Math.round(s.duration || 0),
          }));
        } else {
          setLeg1Path(generateFallback(driverLat, driverLng, donorLat, donorLng));
        }

        // Leg 2: Donor Pickup -> NGO Hub
        const url2 = `https://router.project-osrm.org/route/v1/driving/${donorLng},${donorLat};${ngoLng},${ngoLat}?overview=full&geometries=geojson&steps=true`;
        const res2 = await fetch(url2);
        const data2 = await res2.json();

        let l2Steps: RouteStep[] = [];
        if (data2.code === 'Ok' && data2.routes?.[0]) {
          const r2 = data2.routes[0];
          const distKm = (r2.distance / 1000).toFixed(1);
          const eta = Math.max(Math.round((r2.distance / 1000 / 20) * 60), Math.round(r2.duration / 60));
          setLeg2DistKm(distKm);
          setLeg2EtaMins(eta);
          setLeg2Path(r2.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));

          l2Steps = (r2.legs?.[0]?.steps || []).map((s: any) => ({
            instruction: `[Leg 2 to NGO] ${formatManeuver(s)}`,
            distanceM: Math.round(s.distance || 0),
            durationS: Math.round(s.duration || 0),
          }));
        } else {
          setLeg2Path(generateFallback(donorLat, donorLng, ngoLat, ngoLng));
        }

        setRouteSteps([...l1Steps, ...l2Steps]);
      } catch (e) {
        console.warn('OSRM multi-leg fetch failed, using fallback', e);
        setLeg1Path(generateFallback(driverLat, driverLng, donorLat, donorLng));
        setLeg2Path(generateFallback(donorLat, donorLng, ngoLat, ngoLng));
      }
    };

    fetchBothLegs();
  }, [donation?.pickupLat, donation?.pickupLng, donation?.ngo?.latitude, donation?.ngo?.longitude]);

  // Live 2-Leg Driving Simulation
  const start2LegSimulation = () => {
    if (isSimulatingLocally) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      setIsSimulatingLocally(false);
      setSimulationStage('IDLE');
      return;
    }

    const fullRoute = [...leg1Path, ...leg2Path];
    if (fullRoute.length === 0) return;

    setIsSimulatingLocally(true);
    setSimulationStage('TO_DONOR');

    let idx = 0;
    const leg1Length = leg1Path.length;

    simulationTimerRef.current = setInterval(() => {
      if (idx >= fullRoute.length) {
        if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
        setIsSimulatingLocally(false);
        setSimulationStage('AT_NGO');
        return;
      }

      const [lat, lng] = fullRoute[idx];
      setCurrentLoc({ lat, lng });
      setPath(prev => [...prev, [lat, lng]]);
      setLastUpdated(new Date());

      if (idx < leg1Length) {
        setSimulationStage('TO_DONOR');
      } else if (idx === leg1Length) {
        setSimulationStage('AT_DONOR');
      } else {
        setSimulationStage('TO_NGO');
      }

      if (delivery?.id) {
        import('../api/volunteerApi').then(({ sendLocationUpdate }) => {
          sendLocationUpdate(delivery.id, {
            deliveryId: delivery.id,
            lat,
            lng,
            speed: 35,
            heading: 0,
            timestamp: new Date().toISOString()
          }).catch(() => {});
        });
      }

      idx++;
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  const donorLat = donation?.pickupLat || 12.9716;
  const donorLng = donation?.pickupLng || 77.5946;
  const ngoLat = donation?.ngo?.latitude || 12.9899;
  const ngoLng = donation?.ngo?.longitude || 77.5534;
  const donorPoint: [number, number] = [donorLat, donorLng];
  const ngoPoint: [number, number] = [ngoLat, ngoLng];

  const handleOpenGoogleMaps = () => {
    const originStr = currentLoc ? `${currentLoc.lat},${currentLoc.lng}` : '';
    const destStr = `${ngoLat},${ngoLng}`;
    const waypointStr = `${donorLat},${donorLng}`;
    const url = originStr 
      ? `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&waypoints=${waypointStr}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${destStr}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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

  const totalDistKm = (parseFloat(leg1DistKm || '0') + parseFloat(leg2DistKm || '0')).toFixed(1);
  const totalEtaMins = (leg1EtaMins || 0) + (leg2EtaMins || 0);

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
        <Navigation className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium">Initializing live 2-leg map tracker...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Live 2-Leg Delivery Route & GPS Tracker
            </h1>
            <p className="text-sm text-slate-500">
              Trip: <span className="font-semibold text-indigo-600">Volunteer</span> ──▶ <span className="font-semibold text-amber-600">Donor Pickup</span> ──▶ <span className="font-semibold text-emerald-600">{donation?.ngo?.name || 'NGO Hub'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={start2LegSimulation}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isSimulatingLocally
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/30'
            }`}
          >
            {isSimulatingLocally ? (
              <>
                <StopCircle className="w-4 h-4" /> Stop Driving Simulation
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 animate-spin text-indigo-200" style={{ animationDuration: '3s' }} />
                Simulate Live Driving (2-Leg Journey)
              </>
            )}
          </button>

          <button
            onClick={handleOpenGoogleMaps}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            title="Open 2-leg turn-by-turn route in Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Google Maps
          </button>
        </div>
      </div>

      {/* 2-Leg Journey Status Visualizer Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Leg 1 Box */}
        <div className={`p-4 rounded-2xl border transition-all ${
          simulationStage === 'TO_DONOR'
            ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/30'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
              Leg 1: To Donor Pickup
            </span>
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
              {leg1DistKm} km &bull; ~{leg1EtaMins} min
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate">{donation?.pickupAddress || 'Indiranagar 100ft Road, Bengaluru'}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-amber-400" />
            {simulationStage === 'TO_DONOR' ? '🚚 Volunteer is currently driving to pickup' : simulationStage === 'AT_DONOR' ? '✅ Arrived at Donor Pickup' : 'Assigned Pickup Point'}
          </p>
        </div>

        {/* Leg 2 Box */}
        <div className={`p-4 rounded-2xl border transition-all ${
          simulationStage === 'TO_NGO' || simulationStage === 'AT_DONOR'
            ? 'bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
              Leg 2: To Verified NGO
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              {leg2DistKm} km &bull; ~{leg2EtaMins} min
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate">{donation?.ngo?.name || 'Akshaya Patra Foundation'}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            {simulationStage === 'TO_NGO' ? '🚚 Volunteer carrying supplies to NGO' : simulationStage === 'AT_NGO' ? '🎉 Arrived at NGO! Ready for OTP' : donation?.ngo?.address || 'Chord Road, Rajajinagar, Bengaluru'}
          </p>
        </div>

        {/* Total Summary Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Route Overview</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
              Live Optimized
            </span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">{totalDistKm} km</span>
            <span className="text-xs text-indigo-300 font-semibold ml-2">(Est. {totalEtaMins} mins total)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" /> Leg 1: Driver ➔ Donor
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2" /> Leg 2: Donor ➔ NGO
          </div>
        </div>
      </div>

      {/* Proof of Delivery Form (if picked up) */}
      {showProofForm && (
        <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-lg border border-indigo-800">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="text-emerald-400 w-6 h-6" />
                Complete Delivery & Handover
              </h2>
              <p className="text-indigo-200 text-sm">
                You have reached the NGO! Enter the 6-digit OTP provided by the NGO receiver and snap a photo of the handed-over supplies.
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
                  <label className="flex items-center justify-center w-full h-20 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Upload className="w-5 h-5 mb-1 text-indigo-400" />
                      <p className="text-xs font-semibold">{proofImage ? proofImage.name : 'Tap to upload photo'}</p>
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
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submittingProof ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {submittingProof ? 'Verifying...' : 'Complete Delivery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Map Header Status */}
        <div className="bg-slate-900 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <img src="https://cdn-icons-png.flaticon.com/512/3233/3233967.png" alt="truck" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                {simulationStage === 'AT_NGO' ? (
                  <span className="text-emerald-400">Arrived at NGO Destination</span>
                ) : simulationStage === 'AT_DONOR' ? (
                  <span className="text-amber-400">Arrived at Donor Pickup</span>
                ) : isSimulatingLocally ? (
                  <span className="text-indigo-400 animate-pulse">Live Route Simulation in Progress</span>
                ) : (
                  'Active Volunteer Dispatch'
                )}
                <span className="text-[10px] font-bold bg-emerald-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" /> Live Map
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Last GPS Signal: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Connected'} &bull; Real-time OpenStreetMap Routing
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-3 h-3 rounded-full bg-indigo-500 border border-white inline-block" /> Driver
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white inline-block" /> Donor Pickup
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block" /> NGO Hub
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[540px] w-full z-0 relative bg-slate-100">
          {currentLoc ? (
            <MapContainer
              center={[currentLoc.lat, currentLoc.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Leg 1 Polyline (Driver to Donor) */}
              {leg1Path.length > 0 && (
                <Polyline 
                  positions={leg1Path} 
                  color="#6366f1" 
                  weight={6} 
                  opacity={0.85} 
                  dashArray="6, 8" 
                />
              )}

              {/* Leg 2 Polyline (Donor to NGO) */}
              {leg2Path.length > 0 && (
                <Polyline 
                  positions={leg2Path} 
                  color="#10b981" 
                  weight={6} 
                  opacity={0.9} 
                />
              )}

              {/* Traveled History Path */}
              {path.length > 1 && (
                <Polyline positions={path} color="#06b6d4" weight={4} opacity={0.9} />
              )}

              {/* Marker 1: Donor Pickup Location */}
              <Marker position={donorPoint} icon={donorMarkerIcon}>
                <Popup>
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Step 1: Donor Pickup
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-1">Donor Pickup Doorstep</p>
                    <p className="text-xs text-slate-600">{donation?.pickupAddress || 'Indiranagar 100ft Road, Bengaluru'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Distance from Driver: ~{leg1DistKm} km</p>
                  </div>
                </Popup>
              </Marker>

              {/* Marker 2: Destination NGO Location */}
              <Marker position={ngoPoint} icon={ngoMarkerIcon}>
                <Popup>
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Step 2: NGO Destination
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-1">{donation?.ngo?.name || 'Verified NGO Hub'}</p>
                    <p className="text-xs text-slate-600">{donation?.ngo?.address || 'Chord Road, Rajajinagar, Bengaluru'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Distance from Donor: ~{leg2DistKm} km</p>
                  </div>
                </Popup>
              </Marker>

              {/* Marker 3: Volunteer Driver Live Location */}
              <Marker position={[currentLoc.lat, currentLoc.lng]} icon={driverIcon}>
                <Popup>
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Live Delivery Volunteer
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-1">Volunteer Driver (Live GPS)</p>
                    <p className="text-xs text-slate-600">
                      Current Target: {simulationStage === 'TO_DONOR' ? 'Heading to Donor' : simulationStage === 'AT_DONOR' ? 'At Donor Doorstep' : 'Heading to NGO Hub'}
                    </p>
                    <p className="text-[11px] text-indigo-600 font-mono">Live Telemetry Active</p>
                  </div>
                </Popup>
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

      {/* Turn-by-Turn Route Guidance Panel */}
      {routeSteps.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden transition-all">
          <div 
            onClick={() => setShowSteps(!showSteps)}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Turn-by-Turn 2-Leg Maneuver Guidance</span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    {routeSteps.length} Steps
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {routeSteps[0] ? `Next: ${routeSteps[0].instruction}` : 'Step-by-step navigation directions'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                {showSteps ? 'Hide Directions' : 'Show All Directions'}
              </span>
              {showSteps ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </div>
          </div>

          {showSteps && (
            <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50 max-h-80 overflow-y-auto space-y-2.5">
              {routeSteps.map((step, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-800">{step.instruction}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {step.distanceM > 1000 ? `${(step.distanceM / 1000).toFixed(1)} km` : `${step.distanceM} m`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
