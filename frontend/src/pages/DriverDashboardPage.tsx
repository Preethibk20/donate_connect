import React, { useEffect, useState } from 'react';
import { getMyVolunteerTasks, getAvailablePickups, claimVolunteerPickup, updateVolunteerTaskStatus } from '../api/volunteerApi';
import { Donation, PageResponse, VolunteerTask } from '../types';
import { useToast } from '../context/ToastContext';
import { Truck, CheckCircle2, MapPin, Calendar, Clock, RefreshCw, PackageSearch, ChevronRight } from 'lucide-react';

type DashboardTab = 'my-tasks' | 'available';

export const DriverDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-tasks');
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [available, setAvailable] = useState<PageResponse<Donation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const data = await getMyVolunteerTasks();
      setTasks(data);
    } catch {
      showError('Failed to load volunteer tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailable = async (page = 0) => {
    setLoading(true);
    try {
      const data = await getAvailablePickups(page, 20);
      setAvailable(data);
    } catch {
      showError('Failed to load available pickups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-tasks') {
      fetchMyTasks();
    } else {
      fetchAvailable();
    }
  }, [activeTab]);

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
      // Refresh both tabs
      setActiveTab('my-tasks');
    } catch (err: any) {
      showError(err.message || 'Failed to claim pickup');
    } finally {
      setClaiming(null);
    }
  };

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
            <Truck className="w-8 h-8 text-amber-400" />
            Volunteer Driver Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Claim and manage donation pickups from donors to NGO partners
          </p>
        </div>

        <button
          onClick={() => activeTab === 'my-tasks' ? fetchMyTasks() : fetchAvailable()}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700 self-start md:self-auto"
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
          {available && <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded">{available.totalElements}</span>}
        </button>
      </div>

      {/* ---- MY TASKS TAB ---- */}
      {activeTab === 'my-tasks' && (
        <>
          {loading ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Loading your dispatch routes...
            </div>
          ) : tasks.length === 0 ? (
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
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4"
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
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span><strong>NGO Hub:</strong> {task.donation.ngo?.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span><strong>Pickup Date:</strong> {task.donation.pickupDate || 'Flexible'}</span>
                      </div>
                      {task.routeNotes && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span><strong>Notes:</strong> {task.routeNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(task.id, 'IN_TRANSIT')}
                      disabled={task.status !== 'CLAIMED'}
                      className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold transition-all"
                    >
                      🚚 Mark In-Transit
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                      disabled={task.status !== 'IN_TRANSIT'}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
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
          {loading ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Loading available pickups...
            </div>
          ) : !available || available.content.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
              <PackageSearch className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-semibold text-base">No available pickups right now</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Check back later — new accepted donations appear here when NGOs approve them.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {available.content.map((donation) => (
                  <div
                    key={donation.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                          {donation.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{donation.id.substring(0, 8)}...</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{donation.ngo?.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{donation.description}</p>

                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {donation.ngo?.address || 'N/A'}
                        </span>
                        {donation.pickupDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {donation.pickupDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaim(donation.id)}
                      disabled={claiming === donation.id}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {claiming === donation.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3.5 h-3.5" />
                          Claim Pickup
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {available.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => fetchAvailable(available.number - 1)}
                    disabled={available.number === 0}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-700 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-slate-400">
                    Page {available.number + 1} of {available.totalPages}
                  </span>
                  <button
                    onClick={() => fetchAvailable(available.number + 1)}
                    disabled={available.number >= available.totalPages - 1}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
