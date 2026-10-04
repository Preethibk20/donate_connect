import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../api/auditApi';
import { AuditLog } from '../types';
import { Shield, Search, Filter, Clock, Activity, FileText } from 'lucide-react';

export const AdminAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs(0, 100, actionFilter, entityTypeFilter)
      .then(res => setLogs(res.content))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityTypeFilter]);

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-rose-500" />
          System Audit & Security Logs
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor sensitive actions including NGO verification, role changes, and delivery updates.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-5 h-5" />
          <span className="text-sm font-semibold">Filter by:</span>
        </div>
        
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-rose-500 w-full md:w-auto"
        >
          <option value="">All Actions</option>
          <option value="VERIFY_NGO">VERIFY_NGO</option>
          <option value="UNVERIFY_NGO">UNVERIFY_NGO</option>
          <option value="APPROVE_USER">APPROVE_USER</option>
          <option value="UPDATE_DONATION_STATUS">UPDATE_DONATION_STATUS</option>
          <option value="UPDATE_DELIVERY_STATUS">UPDATE_DELIVERY_STATUS</option>
          <option value="COMPLETE_DELIVERY">COMPLETE_DELIVERY</option>
        </select>

        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-rose-500 w-full md:w-auto"
        >
          <option value="">All Entity Types</option>
          <option value="NGO">NGO</option>
          <option value="USER">USER</option>
          <option value="DONATION">DONATION</option>
          <option value="DELIVERY">DELIVERY</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Entity</th>
                <th className="p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Fetching audit trails...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit logs match the current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-200">
                      <div>
                        <span className="font-semibold">{log.actorName}</span>
                        <div className="text-xs text-slate-500">{log.actorEmail}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      <span className="font-mono text-xs">{log.entityType}</span>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{log.entityId}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-300 max-w-xs">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
