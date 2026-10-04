import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getPendingUsers, approveUser } from '../api/adminApi';
import { AdminStats, User } from '../types';
import { Shield, Building2, PackageCheck, Clock, CheckCircle2, RefreshCw, ArrowRight, Layers, UserCheck, Download, BarChart2, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, pendingData] = await Promise.all([
        getAdminStats(),
        getPendingUsers()
      ]);
      setStats(statsData);
      setPendingUsers(pendingData);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await approveUser(userId);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadCSV = () => {
    if (!stats) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Overview
    csvContent += "Overview\nMetric,Value\n";
    csvContent += `Total Donations,${stats.totalDonations}\n`;
    csvContent += `Verified NGOs,${stats.verifiedNgos}\n`;
    csvContent += `Pending Requests,${stats.pendingRequests}\n`;
    csvContent += `Completed Deliveries,${stats.completedDeliveries}\n`;
    csvContent += `Delivery Success Rate (%),${stats.deliverySuccessRate?.toFixed(2) || 0}\n`;
    csvContent += `Avg Delivery Time (Hours),${stats.averageDeliveryTimeHours?.toFixed(2) || 0}\n\n`;

    // Donations By Category
    csvContent += "Donations By Category\nCategory,Count\n";
    if (stats.donationsByCategory) {
      Object.entries(stats.donationsByCategory).forEach(([category, count]) => {
        csvContent += `${category},${count}\n`;
      });
    }
    
    // Top Donors
    csvContent += "\nTop Donors\nName,Donation Count\n";
    if (stats.topDonors) {
      stats.topDonors.forEach(donor => {
        csvContent += `${donor.name},${donor.donations}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_stats_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartDataByDate = stats?.donationsByDate 
    ? Object.keys(stats.donationsByDate).map(key => ({ date: key, count: stats.donationsByDate![key] }))
    : [];

  const chartDataByCategory = stats?.donationsByCategory 
    ? Object.keys(stats.donationsByCategory).map(key => ({ name: key, count: stats.donationsByCategory![key] }))
    : [];

  const chartDataByCity = stats?.donationsByCity 
    ? Object.keys(stats.donationsByCity).map(key => ({ name: key, count: stats.donationsByCity![key] }))
    : [];

  const COLORS = ['#7567E8', '#059669', '#F59E0B', '#DC2626', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-rose-500" />
            Admin Overview & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            System-wide donation, partner, and fulfillment statistics
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={downloadCSV}
            disabled={loading || !stats}
            className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors border border-emerald-600/20 flex items-center gap-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-36 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-400 space-y-3">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Donations */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-3xl font-extrabold text-white">{stats?.totalDonations || 0}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Total Donations</h3>
              <p className="text-xs text-slate-500 mt-0.5">All submitted requests across platform</p>
            </div>
          </div>

          {/* Active/Verified NGOs */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-3xl font-extrabold text-white">{stats?.verifiedNgos || 0}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Verified NGOs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Active non-profit organization partners</p>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-3xl font-extrabold text-white">{stats?.pendingRequests || 0}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Pending Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Donation requests awaiting NGO response</p>
            </div>
          </div>

          {/* Completed Deliveries */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-3xl font-extrabold text-white">{stats?.completedDeliveries || 0}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Completed Deliveries</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fully fulfilled and delivered donations</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {!loading && stats && (
        <div className="space-y-6 pt-4">
          
          {/* Top Line Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Donations Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.substring(5)} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Line type="monotone" dataKey="count" stroke="#7567E8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-400" />
                Donations By Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {chartDataByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Donations by City
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByCity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-rose-400" />
                Delivery Performance Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Success Rate</p>
                  <p className="text-3xl font-extrabold text-emerald-400">{stats.deliverySuccessRate?.toFixed(1)}<span className="text-xl">%</span></p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Avg Delivery Time</p>
                  <p className="text-3xl font-extrabold text-indigo-400">{stats.averageDeliveryTimeHours?.toFixed(1)}<span className="text-sm font-normal text-slate-400 ml-1">hrs</span></p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Top Donors</p>
                  <ul className="space-y-1">
                    {stats.topDonors?.map((d, i) => (
                      <li key={i} className="text-xs text-slate-300 flex justify-between">
                        <span className="truncate pr-2">{i+1}. {d.name}</span>
                        <span className="font-bold text-indigo-300">{d.donations}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Top NGOs</p>
                  <ul className="space-y-1">
                    {stats.topNgos?.map((n, i) => (
                      <li key={i} className="text-xs text-slate-300 flex justify-between">
                        <span className="truncate pr-2">{i+1}. {n.name}</span>
                        <span className="font-bold text-emerald-300">{n.donations}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        <Link
          to="/admin/ngos"
          className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Manage NGO Partners
            </h3>
            <p className="text-xs text-slate-400">
              Create new NGO accounts, toggle verified status, and manage partner accounts.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-4" />
        </Link>

        <Link
          to="/admin/donations"
          className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-indigo-400" />
              Audit All Donations
            </h3>
            <p className="text-xs text-slate-400">
              View paginated table of all donations with filters for status, category, and NGO.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-4" />
        </Link>

        <Link
          to="/admin/audit"
          className="group bg-slate-900/40 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-6 transition-all flex items-center justify-between md:col-span-2"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" />
              Security & Audit Logs
            </h3>
            <p className="text-xs text-slate-400">
              Monitor sensitive system events like verification, delivery updates, and role changes.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-4" />
        </Link>
      </div>

      {/* Pending Approvals Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 mt-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Pending User Approvals</h2>
            <p className="text-sm text-slate-400">Approve new Donors, NGOs, and Delivery drivers.</p>
          </div>
        </div>

        {loading ? (
          <div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800/50">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
            <p className="text-slate-400 font-medium">No pending approvals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{user.fullName}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-slate-300">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{user.email} • Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleApprove(user.id)}
                  disabled={actionLoading === user.id}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {actionLoading === user.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
