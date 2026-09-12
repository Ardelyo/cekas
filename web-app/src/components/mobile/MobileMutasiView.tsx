import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  RotateCcw,
  Plus,
  Receipt,
  X
} from 'lucide-react';
import type { Transaction } from '../../types';

interface MobileMutasiViewProps {
  transactions: Transaction[];
  totalSaldo: number;
  onOpenCatatModal: () => void;
  onSelectReversalTx: (tx: Transaction) => void;
}

export const MobileMutasiView: React.FC<MobileMutasiViewProps> = ({
  transactions,
  totalSaldo,
  onOpenCatatModal,
  onSelectReversalTx,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Filtered List
  const filteredTransactions = transactions
    .filter((tx) => {
      if (typeFilter === 'in') return tx.type === 'in';
      if (typeFilter === 'out') return tx.type === 'out';
      return true;
    })
    .filter((tx) => {
      if (categoryFilter === 'all') return true;
      return tx.category === categoryFilter;
    })
    .filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      return tx.description.toLowerCase().includes(q) || tx.inputBy.toLowerCase().includes(q);
    });

  return (
    <div className="flex-1 flex flex-col space-y-4 pb-24 font-space">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & SUMMARY CARD                                   */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-b-[36px] border-b-2 border-black shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-4">
        
        {/* Title & Action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Buku Kas Umum (Ledger)
            </span>
            <h2 className="text-xl font-space font-extrabold text-black leading-tight">
              Mutasi & Riwayat Kas
            </h2>
          </div>

          <button
            onClick={onOpenCatatModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black border-2 border-black font-extrabold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 tactile-bounce"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Catat Kas</span>
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">Saldo Kas Berjalan</span>
            <span className="font-space font-extrabold text-lg text-black">{formatRupiah(totalSaldo)}</span>
          </div>
          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#B8FFA9] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            {transactions.length} Mutasi Sah
          </span>
        </div>

        {/* Type Filter Pills */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl border-2 border-black text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`py-1.5 rounded-xl transition-all ${
              typeFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            Semua
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('in')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
              typeFilter === 'in'
                ? 'bg-[#B8FFA9] text-black border border-black font-black shadow-xs'
                : 'text-emerald-800 hover:text-black'
            }`}
          >
            <span>Masuk (+)</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('out')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
              typeFilter === 'out'
                ? 'bg-[#FFC6A8] text-black border border-black font-black shadow-xs'
                : 'text-orange-900 hover:text-black'
            }`}
          >
            <span>Keluar (-)</span>
          </button>
        </div>

        {/* Category Filter Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-extrabold">
          {[
            { id: 'all', label: 'Semua Pos' },
            { id: 'operasional', label: 'Operasional' },
            { id: 'sosial', label: 'Sosial' },
            { id: 'event', label: 'Event' },
            { id: 'cadangan', label: 'Cadangan' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all border ${
                categoryFilter === cat.id
                  ? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. SEARCH BAR                                                  */}
      {/* ============================================================== */}
      <div className="px-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keterangan mutasi atau pencatat..."
            className="w-full text-xs bg-white border-2 border-black rounded-2xl pl-10 pr-8 py-3 font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SCANNABLE TRANSACTION CARDS                                 */}
      {/* ============================================================== */}
      <div className="px-4 space-y-2.5 flex-1">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border-2 border-black text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-space font-extrabold text-sm text-black">Tidak Ada Mutasi Ditemukan</div>
            <p className="text-xs text-slate-500 font-medium">Ubah filter atau gunakan kata kunci lain.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIn = tx.type === 'in';
            const isReversed = tx.isReversed;

            return (
              <div
                key={tx.id}
                className={`p-3.5 rounded-3xl border-2 border-black transition-all flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  isReversed ? 'bg-amber-50/70 opacity-80' : 'bg-white'
                }`}
              >
                {/* Left: Direction Icon & Details */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl border-2 border-black flex items-center justify-center font-black text-base shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0 ${
                      tx.isCorrection
                        ? 'bg-[#FEF08A] text-black'
                        : isIn
                        ? 'bg-[#B8FFA9] text-black'
                        : 'bg-[#FFC6A8] text-black'
                    }`}
                  >
                    {tx.isCorrection ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      <TrendingUp className={`w-4 h-4 stroke-[2.2] ${!isIn ? 'rotate-180' : ''}`} />
                    )}
                  </div>

                  <div>
                    <div className="font-space font-extrabold text-xs text-black leading-tight flex items-center gap-1.5">
                      <span className={isReversed ? 'line-through text-slate-500' : ''}>
                        {tx.description}
                      </span>
                      {isReversed && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-200 border border-black text-amber-950">
                          Dikoreksi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight">
                        Pos {tx.category}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-slate-600 font-bold">
                        Oleh {tx.inputBy}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{tx.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Koreksi Button */}
                <div className="text-right flex items-center gap-2 shrink-0">
                  <div
                    className={`font-space font-extrabold text-xs sm:text-sm ${
                      isReversed
                        ? 'line-through text-slate-400'
                        : isIn
                        ? 'text-emerald-800'
                        : 'text-orange-900'
                    }`}
                  >
                    {isIn ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>

                  {!isReversed && !tx.isCorrection && (
                    <button
                      type="button"
                      onClick={() => onSelectReversalTx(tx)}
                      title="Koreksi transaksi ini"
                      className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-[#FEF08A] border border-black flex items-center justify-center text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] tactile-bounce ml-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
