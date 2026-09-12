import React, { useState } from 'react';
import { TrendingUp, ShieldCheck, MessageSquare } from 'lucide-react';

interface DarkBentoPodProps {
  operationalBudget: number;
  duesPercentage: string;
}

export const DarkBentoPod: React.FC<DarkBentoPodProps> = ({ operationalBudget, duesPercentage }) => {
  const [voteChoice, setVoteChoice] = useState<'yes' | 'no' | null>(null);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="bg-[#0F172A] text-white p-6 rounded-[34px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5 font-space">
      
      {/* 2 Side-by-Side Graphic Widgets: Peach & Lavender */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Widget 1: Peach Arus Kas Masuk */}
        <div className="bg-[#FFC6A8] text-slate-900 p-4 rounded-3xl border border-black flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-black">
            <TrendingUp className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>Arus Kas Masuk</span>
          </div>

          {/* Multi-segmented rounded vertical bar chart (Exact match to reference!) */}
          <div className="my-3 flex items-end gap-1.5 h-12">
            <div className="w-2.5 bg-orange-400 rounded-full h-6 border border-black"></div>
            <div className="w-2.5 bg-orange-500 rounded-full h-9 border border-black"></div>
            <div className="w-2.5 bg-orange-400 rounded-full h-5 border border-black"></div>
            <div className="w-2.5 bg-orange-600 rounded-full h-12 border border-black"></div>
            <div className="w-2.5 bg-orange-500 rounded-full h-8 border border-black"></div>
          </div>

          <div>
            <div className="text-xl font-space font-extrabold text-black">+Rp 100k</div>
            <span className="text-[10px] text-slate-800 font-bold block">Periode Minggu 1</span>
          </div>
        </div>

        {/* Widget 2: Lavender Tingkat Disiplin */}
        <div className="bg-[#EACEFF] text-slate-900 p-4 rounded-3xl border border-black flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-black">
            <ShieldCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>Tingkat Disiplin</span>
          </div>

          {/* Stepped rising vertical bars (Exact match to reference!) */}
          <div className="my-3 flex items-end gap-1.5 h-12">
            <div className="w-3 bg-violet-300 rounded-md h-3 border border-black"></div>
            <div className="w-3 bg-violet-400 rounded-md h-6 border border-black"></div>
            <div className="w-3 bg-violet-500 rounded-md h-9 border border-black"></div>
            <div className="w-3 bg-violet-600 rounded-md h-12 border border-black"></div>
          </div>

          <div>
            <div className="text-xl font-space font-extrabold text-black">Tinggi</div>
            <span className="text-[10px] text-slate-800 font-bold block">{duesPercentage}% Lunas</span>
          </div>
        </div>

      </div>

      {/* Interactive Mint Card: Musyawarah Kas Kelas (Matching Quiz Card!) */}
      <div className="bg-[#B8FFA9] text-slate-900 p-5 rounded-3xl border-2 border-black">
        <div className="flex items-center justify-between text-xs font-extrabold text-black mb-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-black" />
            <span>Musyawarah Kas Kelas</span>
          </div>
          <span className="bg-white px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Pertanyaan 1/3
          </span>
        </div>

        <p className="font-space font-bold text-black text-sm leading-snug">
          "Apakah dana operasional kas ({formatRupiah(operationalBudget)}) cukup untuk pembelian spidol & alat pel minggu ini?"
        </p>

        {/* Action Buttons: Yes or No */}
        <div className="flex gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => setVoteChoice('yes')}
            className={`flex-1 font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all border-2 border-black tactile-bounce ${
              voteChoice === 'yes'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-900 text-white hover:bg-black'
            }`}
          >
            Sangat Cukup (Ya)
          </button>

          <button
            type="button"
            onClick={() => setVoteChoice('no')}
            className={`flex-1 font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all border-2 border-black tactile-bounce ${
              voteChoice === 'no'
                ? 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white/90 text-black hover:bg-white'
            }`}
          >
            Perlu Tambahan
          </button>
        </div>

        {voteChoice && (
          <div className="text-[11px] font-bold text-black mt-2.5 text-center bg-white/60 p-2 rounded-xl border border-black/30">
            {voteChoice === 'yes'
              ? '✓ Pilihan Anda: Sangat Cukup (Ya). Suara dicatat untuk musyawarah kelas!'
              : '✓ Pilihan Anda: Perlu Tambahan. Masukan diteruskan ke Bendahara.'}
          </div>
        )}
      </div>

      {/* Footer Meta Row */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 font-medium">
        <span>Bendahara: <b className="text-slate-200">Tarina</b></span>
        <span>Wali Kelas: <b className="text-slate-200">Pembimbing XI-F2</b></span>
      </div>

    </div>
  );
};
