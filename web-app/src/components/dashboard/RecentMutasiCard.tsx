import React from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import type { Transaction } from '../../types';

interface RecentMutasiCardProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

export const RecentMutasiCard: React.FC<RecentMutasiCardProps> = ({ transactions, onViewAll }) => {
  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="bg-white p-5 rounded-[34px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3 font-space">
      <div className="flex items-center justify-between">
        <h3 className="font-space font-extrabold text-sm text-black">Mutasi Kas Terakhir</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-black hover:underline font-extrabold flex items-center gap-1"
        >
          <span>Buku Kas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {transactions.slice(0, 4).map((tx) => {
          const isIn = tx.type === 'in';
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl border border-black flex items-center justify-center ${
                    isIn ? 'bg-[#B8FFA9] text-black' : 'bg-[#FFC6A8] text-black'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 stroke-[2.2] ${!isIn ? 'rotate-180' : ''}`} />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-black">{tx.description}</div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    Oleh {tx.inputBy} • Pos {tx.category}
                  </div>
                </div>
              </div>
              <span
                className={`font-space font-extrabold text-xs ${
                  isIn ? 'text-emerald-800' : 'text-orange-900'
                }`}
              >
                {isIn ? '+' : '-'}{formatRupiah(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
