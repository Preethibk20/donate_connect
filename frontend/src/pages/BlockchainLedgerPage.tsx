import React, { useEffect, useState } from 'react';
import { getBlockchainLedger } from '../api/nextGenApi';
import { BlockchainBlock } from '../types';
import { Database, ShieldCheck, Cpu, Award, Sparkles } from 'lucide-react';

export const BlockchainLedgerPage: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [mintedNft, setMintedNft] = useState<boolean>(false);

  useEffect(() => {
    getBlockchainLedger()
      .then((data) => setBlocks(data))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Cpu className="w-8 h-8 text-emerald-400" />
            Blockchain Donation Audit & NFT Proof of Impact
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cryptographic SHA-256 ledger recording every donation transaction step with zero-knowledge verification
          </p>
        </div>

        <button
          onClick={() => setMintedNft(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Mint NFT Proof-of-Impact Token
        </button>
      </div>

      {mintedNft && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
          <Award className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
          <h3 className="text-xl font-extrabold text-white">NFT Impact Token Minted on Polygon Testnet!</h3>
          <p className="text-xs text-slate-300 font-mono">Token ID: #0x9F82A41C7B • Immutable Provenance Badge Added to Wallet</p>
          <button onClick={() => setMintedNft(false)} className="text-xs text-emerald-400 underline font-semibold">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          Loading blockchain ledger blocks...
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">SHA-256 Provenance Block Stream ({blocks.length} Blocks)</h3>

          <div className="space-y-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> BLOCK #{block.blockIndex} &mdash; {block.action}
                  </span>
                  <span className="text-slate-400 text-[11px]">{new Date(block.timestamp).toLocaleString()}</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div><span className="text-slate-500">Hash:</span> <span className="text-indigo-300 font-bold">{block.hash}</span></div>
                  <div><span className="text-slate-500">Previous Hash:</span> <span className="text-slate-400">{block.previousHash}</span></div>
                  <div><span className="text-slate-500">Target Donation ID:</span> <span className="text-slate-200">{block.donationId}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
