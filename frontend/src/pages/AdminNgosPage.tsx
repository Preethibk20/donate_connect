import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { createNgoByAdmin, deleteNgoByAdmin, getAllNgosAdmin, verifyNgoByAdmin } from '../api/ngoApi';
import { CreateNgoRequest, NGOProfile } from '../types';
import { Building2, Plus, ShieldCheck, ShieldAlert, Trash2, Check, RefreshCw, X, AlertTriangle } from 'lucide-react';

export const AdminNgosPage: React.FC = () => {
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<NGOProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateNgoRequest>();

  const fetchNgos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllNgosAdmin();
      setNgos(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load NGO list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, []);

  const handleVerifyToggle = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await verifyNgoByAdmin(id, !currentStatus);
      setNgos((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err: any) {
      alert('Verification update failed: ' + err.message);
    }
  };

  const handleCreateNgo = async (data: CreateNgoRequest) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await createNgoByAdmin(data);
      setNgos((prev) => [...prev, created]);
      setIsAddModalOpen(false);
      reset();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create NGO account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteNgoByAdmin(deleteTarget.id);
      setNgos((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Failed to remove NGO: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" />
            Manage NGO Partners
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create NGO credentials, verify organizations, and manage active partner accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNgos}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title="Refresh NGO list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Add NGO Partner
          </button>
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading all NGO profiles...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-400 space-y-3">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchNgos}
            className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : ngos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-semibold text-lg">No NGO profiles created yet</h3>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First NGO
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">NGO Name</th>
                  <th className="px-6 py-4">Account Email</th>
                  <th className="px-6 py-4">Address / Phone</th>
                  <th className="px-6 py-4">Verified Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ngos.map((ngo) => (
                  <tr key={ngo.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span>{ngo.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{ngo.user?.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <div>{ngo.address}</div>
                      <div className="text-[11px] text-slate-500">{ngo.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {ngo.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <ShieldAlert className="w-3.5 h-3.5" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleVerifyToggle(ngo.id, ngo.verified)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1 ${
                            ngo.verified
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {ngo.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(ngo)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Remove NGO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD NGO MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Register New NGO Partner
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleSubmit(handleCreateNgo)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">NGO Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Hope Foundation"
                  {...register('name', { required: 'NGO name is required' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Account Email *</label>
                <input
                  type="email"
                  placeholder="contact@ngo.org"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Password *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Address *</label>
                <input
                  type="text"
                  placeholder="123 Community St, City"
                  {...register('address', { required: 'Address is required' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.address && <p className="text-rose-400 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  {...register('phone', { required: 'Phone is required' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {createLoading ? 'Creating NGO...' : 'Create NGO User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR DELETE */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Confirm Removal</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>? This action will remove the NGO profile and user account.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {deleteLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
