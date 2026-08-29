import React from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Activity, RefreshCw } from 'lucide-react';

export const HealthBadge: React.FC = () => {
  const { health, loading, refetch } = useHealthCheck();

  const isUp = health?.status === 'UP';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md shadow-sm">
      <div className="relative flex items-center justify-center">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            loading
              ? 'bg-amber-400 animate-pulse'
              : isUp
              ? 'bg-emerald-400'
              : 'bg-rose-500'
          }`}
        />
        {isUp && (
          <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
        <Activity className="w-3.5 h-3.5 text-slate-400" />
        <span>Backend:</span>
        <span
          className={`font-semibold ${
            loading
              ? 'text-amber-400'
              : isUp
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        >
          {loading ? 'Checking...' : isUp ? 'UP' : 'DOWN'}
        </span>
      </div>

      <button
        onClick={refetch}
        title="Refresh health status"
        className="ml-1 p-0.5 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-700/50"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
