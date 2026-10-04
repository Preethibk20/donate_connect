import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getOwnNgoProfile, updateOwnNgoProfile, getOwnUrgentNeeds, createUrgentNeed, toggleUrgentNeed } from '../api/ngoApi';
import { NGOProfile, UpdateNgoProfileDto, NgoUrgentNeed, CreateUrgentNeedRequest, Category } from '../types';
import { Building2, ShieldCheck, MapPin, Phone, Save, CheckCircle2, Plus, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const CATEGORIES: Category[] = ['FOOD', 'CLOTHES', 'BOOKS', 'STATIONERY', 'TOYS', 'OTHER'];

export const NgoProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [urgentNeeds, setUrgentNeeds] = useState<NgoUrgentNeed[]>([]);
  const [newNeedTitle, setNewNeedTitle] = useState('');
  const [newNeedDesc, setNewNeedDesc] = useState('');
  const [newNeedCategory, setNewNeedCategory] = useState<Category>('FOOD');
  const [newNeedQty, setNewNeedQty] = useState('');
  const [addingNeed, setAddingNeed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateNgoProfileDto>();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOwnNgoProfile();
      setProfile(data);
      setValue('name', data.name);
      setValue('description', data.description || '');
      setValue('address', data.address);
      setValue('phone', data.phone);
    } catch (err: any) {
      setError(err.message || 'Failed to load NGO profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUrgentNeeds = async () => {
    try {
      const needs = await getOwnUrgentNeeds();
      setUrgentNeeds(needs);
    } catch (err) {
      console.error("Failed to load urgent needs", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUrgentNeeds();
  }, []);

  const onSubmit = async (data: UpdateNgoProfileDto) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await updateOwnNgoProfile(data);
      setProfile(updated);
      setSuccessMessage('Organization profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeedTitle) return;
    
    setAddingNeed(true);
    try {
      const dto: CreateUrgentNeedRequest = {
        title: newNeedTitle,
        description: newNeedDesc || newNeedTitle,
        category: newNeedCategory,
        quantity: newNeedQty ? parseInt(newNeedQty, 10) : undefined
      };
      const created = await createUrgentNeed(dto);
      setUrgentNeeds([created, ...urgentNeeds]);
      setNewNeedTitle('');
      setNewNeedDesc('');
      setNewNeedQty('');
    } catch (err: any) {
      setError(err.message || 'Failed to add need');
    } finally {
      setAddingNeed(false);
    }
  };

  const handleToggleNeed = async (id: string) => {
    try {
      const updated = await toggleUrgentNeed(id);
      setUrgentNeeds(urgentNeeds.map(n => n.id === id ? updated : n));
    } catch (err: any) {
      setError(err.message || 'Failed to toggle need');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading your NGO profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Profile Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xl">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
                {profile?.verified && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Account Email: {profile?.user?.email} &bull; Joined {formatDate(profile?.createdAt || '')}
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              {...register('name', { required: 'NGO Name is required' })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {errors.name && (
              <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Address / Primary Location *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...register('address', { required: 'Address is required' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            {errors.address && (
              <p className="text-rose-400 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contact Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...register('phone', { required: 'Phone is required' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            {errors.phone && (
              <p className="text-rose-400 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Organization Description & Mission
            </label>
            <textarea
              rows={4}
              {...register('description')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Urgent Needs Management Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          Manage Urgent Needs
        </h2>
        <p className="text-sm text-slate-400">
          List items you currently need right now. These will be highlighted to donors searching in your area.
        </p>

        <form onSubmit={handleAddNeed} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <input
              type="text"
              placeholder="What do you need? (e.g., Blankets, Rice)"
              value={newNeedTitle}
              onChange={e => setNewNeedTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              required
            />
            <div className="flex gap-3">
              <select
                value={newNeedCategory}
                onChange={e => setNewNeedCategory(e.target.value as Category)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 flex-1"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                placeholder="Qty (optional)"
                value={newNeedQty}
                onChange={e => setNewNeedQty(e.target.value)}
                className="w-32 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addingNeed || !newNeedTitle}
            className="md:self-start px-4 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-sm font-bold transition-all border border-rose-500/30 flex items-center gap-2 disabled:opacity-50"
          >
            {addingNeed ? 'Adding...' : <><Plus className="w-4 h-4" /> Add Need</>}
          </button>
        </form>

        <div className="space-y-3">
          {urgentNeeds.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
              No urgent needs listed.
            </div>
          ) : (
            urgentNeeds.map(need => (
              <div key={need.id} className={`flex items-center justify-between p-4 rounded-xl border ${need.active ? 'bg-slate-900/50 border-rose-500/30' : 'bg-slate-900/20 border-slate-800 opacity-60'}`}>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {need.title}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {need.category}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Added: {formatDate(need.createdAt)} {need.quantity ? `• Qty: ${need.quantity}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleNeed(need.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    need.active 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30'
                  }`}
                >
                  {need.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
