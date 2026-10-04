import React, { useState, useEffect, useRef } from 'react';
import { sendLocationUpdate } from '../api/volunteerApi';
import { useToast } from '../context/ToastContext';
import { Navigation, AlertTriangle, StopCircle, Lock } from 'lucide-react';

import { Donation } from '../types';

interface Props {
    deliveryId: string;
    status: string;
    donation?: Donation;
}

export const LiveLocationTracker: React.FC<Props> = ({ deliveryId, status, donation }) => {
    const [isSharing, setIsSharing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [permissionError, setPermissionError] = useState('');
    const [lastShared, setLastShared] = useState<Date | null>(null);
    const [isBackground, setIsBackground] = useState(false);
    
    const watchIdRef = useRef<number | null>(null);
    const latestPosRef = useRef<GeolocationPosition | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { showError } = useToast();

    // Check visibility
    useEffect(() => {
        const handleVisibility = () => {
            setIsBackground(document.visibilityState === 'hidden');
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    // Stop tracking automatically if delivered, completed, or cancelled
    useEffect(() => {
        if (status === 'COMPLETED' || status === 'DELIVERED' || status === 'CANCELLED' || status === 'REJECTED') {
            stopTracking();
        }
    }, [status]);

    const startTracking = () => {
        if (status === 'COMPLETED' || status === 'DELIVERED' || status === 'CANCELLED' || status === 'REJECTED') {
            showError('Location sharing is disabled for inactive deliveries');
            return;
        }

        if (!navigator.geolocation) {
            setPermissionError('Geolocation is not supported by your browser');
            return;
        }

        setPermissionError('');
        setIsSharing(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                latestPosRef.current = pos;
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionError('Location permission denied. Please enable it in browser settings.');
                    stopTracking();
                } else {
                    showError('GPS error: ' + err.message);
                }
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );

        intervalRef.current = setInterval(() => {
            if (latestPosRef.current) {
                const { latitude, longitude, speed, heading } = latestPosRef.current.coords;
                sendLocationUpdate(deliveryId, {
                    deliveryId,
                    lat: latitude,
                    lng: longitude,
                    speed: speed || 0,
                    heading: heading || 0,
                    timestamp: new Date().toISOString()
                }).then(() => {
                    setLastShared(new Date());
                }).catch((e) => {
                    if (e.response?.status !== 429) {
                        console.error('Failed to send location', e);
                    }
                });
            }
        }, 5000);
    };

    const simulateRoute = async () => {
        if (!donation) return;
        const startLat = donation.pickupLat || 28.6139;
        const startLng = donation.pickupLng || 77.2090;
        const endLat = donation.ngo?.latitude || 28.6439;
        const endLng = donation.ngo?.longitude || 77.2390;

        // Generate a simple linear interpolation fallback
        const generateFallbackRoute = (sLat: number, sLng: number, eLat: number, eLng: number, steps = 50): [number, number][] => {
            const route: [number, number][] = [];
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                route.push([sLng + (eLng - sLng) * t, sLat + (eLat - sLat) * t]); // [lng, lat] to match OSRM format
            }
            return route;
        };

        let coords: [number, number][];

        setIsSimulating(true);
        setIsSharing(true);

        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
            const res = await fetch(osrmUrl, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await res.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                coords = data.routes[0].geometry.coordinates; // [lng, lat]
            } else {
                console.warn('OSRM returned no routes, using fallback');
                coords = generateFallbackRoute(startLat, startLng, endLat, endLng);
            }
        } catch (e) {
            console.warn('OSRM unreachable, using straight-line fallback:', e);
            coords = generateFallbackRoute(startLat, startLng, endLat, endLng);
        }

        let i = 0;
        intervalRef.current = setInterval(() => {
            if (i >= coords.length) {
                stopTracking();
                return;
            }
            const [lng, lat] = coords[i];
            
            // calculate rough heading
            let heading = 0;
            if (i < coords.length - 1) {
                const [nLng, nLat] = coords[i+1];
                heading = Math.atan2(nLng - lng, nLat - lat) * (180 / Math.PI);
            }

            sendLocationUpdate(deliveryId, {
                deliveryId,
                lat,
                lng,
                speed: 30,
                heading,
                timestamp: new Date().toISOString()
            }).then(() => {
                setLastShared(new Date());
            }).catch((e) => {
                if (e.response?.status !== 429) {
                    console.error('Failed to send simulated location', e);
                }
            });

            i += Math.max(1, Math.floor(coords.length / 50));
        }, 2000);
    };

    const stopTracking = () => {
        setIsSharing(false);
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsSimulating(false);
    };

    useEffect(() => {
        return () => stopTracking();
    }, []);

    return (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-400" />
                Live Location Tracker
            </h4>
            
            {permissionError && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{permissionError}</span>
                </div>
            )}

            {isBackground && isSharing && (
                <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Warning: Tracking might be paused by your browser while in the background.</span>
                </div>
            )}

            {!isSharing ? (
                <div className="space-y-2">
                    <button
                        onClick={startTracking}
                        disabled={status === 'COMPLETED' || status === 'DELIVERED' || status === 'CANCELLED' || status === 'REJECTED'}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all flex justify-center items-center gap-2 active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                        <Navigation className="w-4 h-4" />
                        Start Trip & Share Location
                    </button>
                    {import.meta.env.VITE_APP_DEMO_ENABLED === 'true' && (
                        <button
                            onClick={simulateRoute}
                            disabled={status === 'COMPLETED' || status === 'DELIVERED'}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-all"
                        >
                            Simulate Route (Demo)
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            {isSimulating ? 'Simulating' : 'Sharing Active'}
                        </span>
                        {lastShared && (
                            <span className="text-xs text-slate-400 font-mono">
                                Sync: {lastShared.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    
                    <button
                        onClick={stopTracking}
                        className="w-full py-3 bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all flex justify-center items-center gap-2 active:scale-95"
                    >
                        <StopCircle className="w-4 h-4" />
                        End Trip
                    </button>
                </div>
            )}

            {/* Privacy Notice */}
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                    <strong className="text-slate-300 font-semibold">Privacy Notice:</strong> Your location is strictly shared in real-time only with the assigned donor and destination NGO during an active trip. Sharing automatically turns off when delivered or ended.
                </span>
            </div>
        </div>
    );
};
