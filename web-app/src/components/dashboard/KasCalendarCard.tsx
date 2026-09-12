import React from 'react';
import { Calendar as CalendarIcon, ThumbsUp } from 'lucide-react';

interface KasCalendarCardProps {
  duesPercentage: string;
}

export const KasCalendarCard: React.FC<KasCalendarCardProps> = ({ duesPercentage }) => {
  return (
    <div className="bg-white p-6 rounded-[34px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 font-space">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-space font-extrabold text-base text-black">Kalender Kas</h3>
          <p className="text-xs text-slate-500 font-medium">September 2026</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-black flex items-center justify-center text-black">
          <CalendarIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
        <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
      </div>

      {/* 5-Week Grid Matrix */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold">
        <div className="p-2 rounded-xl bg-slate-50 text-slate-300">31</div>
        <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black" title="Kas Masuk">1</div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">2</div>
        <div className="p-2 rounded-xl bg-[#FFC6A8] text-black border border-black" title="Beli Spidol">3</div>
        <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black" title="Iuran Siswa">4</div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">5</div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">6</div>
        <div className="p-2 rounded-xl bg-[#EACEFF] text-black border border-black" title="Donasi Sosial">7</div>
        <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black" title="Iuran Siswa">8</div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">9</div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">10</div>
        <div className="p-2 rounded-xl bg-[#FEF08A] text-black border-2 border-black ring-2 ring-black" title="Hari Ini">11</div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">12</div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">13</div>
      </div>

      {/* Monthly Summary Card (Matching Light Mint Summary Card!) */}
      <div className="mt-4 bg-[#B8FFA9] border-2 border-black p-4 rounded-3xl flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-11 h-11 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black shrink-0">
          <ThumbsUp className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-black uppercase tracking-wider block">Ringkasan Bulan Ini</span>
          <h4 className="font-space font-extrabold text-black text-sm">Kas Sehat & Surplus</h4>
          <p className="text-[11px] text-slate-800 leading-tight mt-0.5">Semua pemasukan & pengeluaran tercatat rapi tanpa selisih.</p>
        </div>
      </div>

      {/* 3 Activity Metric Columns (Matching the 3 White Cards!) */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-2">
        <div className="bg-slate-50 p-2.5 rounded-2xl border-2 border-black/80 text-center">
          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-tight">Terkumpul</span>
          <span className="font-space font-extrabold text-xs text-black block mt-0.5">Rp 300k</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border-2 border-black/80 text-center">
          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-tight">Pengeluaran</span>
          <span className="font-space font-extrabold text-xs text-black block mt-0.5">Rp 140k</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border-2 border-black/80 text-center">
          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-tight">Kelunasan</span>
          <span className="font-space font-extrabold text-xs text-emerald-800 block mt-0.5">{duesPercentage}%</span>
        </div>
      </div>

    </div>
  );
};
