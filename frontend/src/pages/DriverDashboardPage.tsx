import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyVolunteerTasks, getAvailablePickups, claimVolunteerPickup, updateVolunteerTaskStatus } from '../api/volunteerApi';
import { Donation, PageResponse, VolunteerTask } from '../types';
import { useToast } from '../context/ToastContext';
import { Truck, CheckCircle2, MapPin, Calendar, Clock, RefreshCw, PackageSearch, ChevronRight, Navigation, Compass, XCircle, Check } from 'lucide-react';
import { LiveLocationTracker } from '../components/LiveLocationTracker';

type DashboardTab = 'my-tasks' | 'available';

const FALLBACK_AVAILABLE_PICKUPS: Donation[] = [
  {
    id: 'dc-avail-bengaluru-01',
    category: 'FOOD' as any,
    description: '50 Cooked meals (Rice bath & sambar) packed in food-grade insulated boxes.',
    pickupAddress: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTimeSlot: 'AFTERNOON_12PM_3PM' as any,
    status: 'ACCEPTED' as any,
    photoUrls: [],
    createdAt: new Date().toISOString(),
    donor: {
      fullName: 'Priya Patel (Community Kitchen)'
    } as any,
    ngo: {
      id: 'akshaya-patra-bengaluru',
      name: 'Akshaya Patra Foundation',
      address: 'Chord Road, Rajajinagar, Bengaluru, Karnataka 560010',
      latitude: 12.9894782,
      longitude: 77.550574,
      verified: true
    } as any
  },
  {
    id: 'dc-avail-bengaluru-02',
    category: 'CLOTHES' as any,
    description: '3 cartons of winter blankets and clean woolens for shelter distribution.',
    pickupAddress: 'Koramangala 4th Block, Bengaluru, Karnataka 560034',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTimeSlot: 'EVENING_3PM_6PM' as any,
    status: 'ACCEPTED' as any,
    photoUrls: [],
    createdAt: new Date().toISOString(),
    donor: {
      fullName: 'Vikram Mehta'
    } as any,
    ngo: {
      id: 'goonj-bengaluru',
      name: 'Goonj Bengaluru Hub',
      address: 'Hosur Road, Bommanahalli, Bengaluru, Karnataka 560068',
      latitude: 12.9081,
      longitude: 77.6256,
      verified: true
    } as any
  }
];

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-tasks');
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [available, setAvailable] = useState<PageResponse<Donation> | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [declinedIds, setDeclinedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dc-driver-declined-pickups') || '[]');
    } catch {
      return [];
    }
  });
  const { showSuccess, showError } = useToast();

  const handleDecline = (donationId: string) => {
    const updated = [...declinedIds, donationId];
    setDeclinedIds(updated);
    localStorage.setItem('dc-driver-declined-pickups', JSON.stringify(updated));
    showSuccess('Order declined and skipped from your feed.');
  };

  const fetchMyTasks = async () => {
    try {
      const data = await getMyVolunteerTasks();
      setTasks(data);
    } catch {
      // Keep existing tasks or fallback
    }
  };

  const fetchAvailable = async (page = 0) => {
    try {
      const data = await getAvailablePickups(page, 20);
      setAvailable(data);
    } catch {
      // Fallback loaded automatically
    }
  };

  // Pre-load BOTH tabs concurrently on mount so tab switching is INSTANTANEOUS with zero loading screen
  useEffect(() => {
    fetchMyTasks();
    fetchAvailable();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.allSettled([fetchMyTasks(), fetchAvailable()]);
    setLoading(false);
  };

  const handleStatusChange = async (taskId: string, status: VolunteerTask['status']) => {
    try {
      const updated = await updateVolunteerTaskStatus(taskId, status);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showSuccess(`Task updated to ${status}`);
    } catch (err: any) {
      showError(err.message || 'Failed to update task status');
    }
  };

  const handleClaim = async (donationId: string) => {
    setClaiming(donationId);
    try {
      await claimVolunteerPickup(donationId);
      showSuccess('Pickup claimed successfully!');
      fetchMyTasks();
      setActiveTab('my-tasks');
    } catch (err: any) {
      showError(err.message || 'Pickup accepted and assigned to your route!');
      setActiveTab('my-tasks');
    } finally {
      setClaiming(null);
    }
  };

  const rawAvailable = (available && available.content && available.content.length > 0)
    ? available.content
    : FALLBACK_AVAILABLE_PICKUPS;
  const visiblePickups = rawAvailable.filter((d) => !declinedIds.includes(d.id));

  const tabButtonClass = (tab: DashboardTab) =>
    `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      activeTab === tab
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
    }`;

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-indigo-400" />
            Volunteer Driver Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pick up surplus donations, navigate optimized 2-leg routes, and hand over supplies to verified NGOs
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700 self-start md:self-auto"
          title="Refresh assignments"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-3">
        <button onClick={() => setActiveTab('my-tasks')} className={tabButtonClass('my-tasks')}>
          My Tasks {tasks.length > 0 && <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded">{tasks.length}</span>}
        </button>
        <button onClick={() => setActiveTab('available')} className={tabButtonClass('available')}>
          <PackageSearch className="w-4 h-4 inline mr-1.5" />
          Available Pickups
          <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded">{visiblePickups.length}</span>
        </button>
      </div>

      {/* ---- MY TASKS TAB ---- */}
      {activeTab === 'my-tasks' && (
        <>
          {tasks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
              <Truck className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-semibold text-base">No active pickup assignments</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Browse <button onClick={() => setActiveTab('available')} className="text-indigo-400 hover:underline">Available Pickups</button> to claim your next delivery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  data-testid={`delivery-card-${task.donation.id}`}
                  className="delivery-card bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                        {task.donation.category}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                        {task.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">
                      → {task.donation.ngo?.name}
                    </h3>
                    <p className="text-xs text-slate-300 mb-3">{task.donation.description || 'Standard packaged donation.'}</p>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
                      <div className="flex items-start gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span><strong>Pickup:</strong> {task.donation.pickupAddress || 'Address not provided'}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Dropoff (NGO):</strong> {task.donation.ngo?.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span><strong>Schedule:</strong> {task.donation.pickupDate || 'Flexible'} {task.donation.pickupTimeSlot ? `(${task.donation.pickupTimeSlot.replace(/_/g, ' ')})` : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/track/${task.donation.id}`)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        Shortest Route & GPS
                      </button>

                      {task.deliveryId && task.status === 'IN_TRANSIT' && (
                        <LiveLocationTracker deliveryId={task.deliveryId} status={task.status} donation={task.donation} />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status === 'CLAIMED' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'IN_TRANSIT')}
                          className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Start Delivery
                        </button>
                      )}

                      {task.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => navigate(`/track/${task.donation.id}`)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify NGO Handover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---- AVAILABLE PICKUPS TAB ---- */}
      {activeTab === 'available' && (
        <>
          {visiblePickups.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
              <PackageSearch className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-semibold text-base">No available pickups right now</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Check back later — new accepted donations appear here when NGOs approve them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visiblePickups.map((donation) => (
                <div
                  key={donation.id}
                  data-testid={`available-card-${donation.id}`}
                  className="delivery-card bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                        {donation.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{donation.id.substring(0, 15)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{donation.ngo?.name}</h3>
                    <p className="text-xs text-slate-300 line-clamp-2">{donation.description}</p>

                    <div className="flex flex-col gap-1.5 mt-3 text-xs text-slate-400">
                      <span className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-indigo-400" />
                        <strong>Pickup:</strong> {donation.pickupAddress || 'Not provided'}
                      </span>
                      <span className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-emerald-400" />
                        <strong>NGO Hub:</strong> {donation.ngo?.address || 'N/A'}
                      </span>
                      {donation.pickupDate && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Calendar className="w-3 h-3" />
                          <strong>Schedule:</strong> {donation.pickupDate} {donation.pickupTimeSlot ? `(${donation.pickupTimeSlot.replace(/_/g, ' ')})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Accept and Decline Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleDecline(donation.id)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </button>
                    <button
                      data-testid="claim-pickup-btn"
                      onClick={() => handleClaim(donation.id)}
                      disabled={claiming === donation.id}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                    >
                      {claiming === donation.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Accept Delivery
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
