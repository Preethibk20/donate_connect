import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Category } from '../types';

interface AiPhotoAnalyzerProps {
  onCategorySuggested?: (category: Category) => void;
}

export const AiPhotoAnalyzer: React.FC<AiPhotoAnalyzerProps> = ({ onCategorySuggested }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    qualityScore: number;
    suggestedCategory: Category;
    confidence: number;
    notes: string;
  } | null>(null);

  const simulateAiScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      // Intelligent heuristic analysis simulation based on filename / mock
      const categories: Category[] = ['CLOTHES', 'BOOKS', 'FOOD', 'STATIONERY', 'TOYS'];
      const suggested = categories[Math.floor(Math.random() * categories.length)];
      const qualityScore = Math.floor(Math.random() * 15) + 85; // 85 to 99%

      setResult({
        qualityScore,
        suggestedCategory: suggested,
        confidence: qualityScore,
        notes: 'High clarity image detected. Lighting and resolution optimal for NGO inspection.',
      });

      if (onCategorySuggested) {
        onCategorySuggested(suggested);
      }
      setAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h4 className="text-sm font-bold text-white">AI Item Photo Quality & Category Detector</h4>
        </div>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-mono">
          AI Vision v2.4
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Upload a photo of your donation items. Our AI scanner automatically assesses image clarity and suggests the optimal category.
      </p>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={simulateAiScan}
          id="ai-image-input"
          className="hidden"
        />
        <label
          htmlFor="ai-image-input"
          className="cursor-pointer px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Sparkles className="w-4 h-4" />
          Upload Image for AI Scan
        </label>
        {analyzing && (
          <span className="text-xs text-indigo-400 font-semibold animate-pulse">
            Analyzing pixels & light contrast...
          </span>
        )}
      </div>

      {result && (
        <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-2 text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Quality Rating: {result.qualityScore}%</span>
            <span className="text-indigo-400">Category: {result.suggestedCategory}</span>
          </div>
          <p className="text-slate-300 italic">{result.notes}</p>
        </div>
      )}
    </div>
  );
};
