import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';

interface MobileCalendarScreenProps {
  duesPercentage: string;
  onBackToHome: () => void;
}

export const MobileCalendarScreen: React.FC<MobileCalendarScreenProps> = ({
  duesPercentage,
  onBackToHome,
}) => {
  return (
    <div className="flex-1 flex flex-col space-y-4 pb-24 font-space">
      
      {/* ============================================================== */}
      {/* 1. TOP BAR (MATCHING RIGHT SCREEN HEADER)                      */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-b-[36px] border-b-2 border-black shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-4">
        
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-black flex items-center justify-center text-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="text-center">
            <h3 className="font-space font-extrabold text-base text-black">Kalender Kas</h3>
            <span className="text-[10px] text-slate-500 font-bold block">September, 2026</span>
          </div>

          <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* 5-Week Calendar Grid Matrix */}
        <div className="pt-2">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
            <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
          </div>

          {/* 5-Week Day Matrix with Colored Mood/Kas Badges */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold">
            {/* Week 1 */}
            <div className="p-2 rounded-xl bg-slate-50 text-slate-300">-</div>
            <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black" title="Kas Masuk">1</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">2</div>
            <div className="p-2 rounded-xl bg-[#FFC6A8] text-black border border-black" title="Beli Spidol">3</div>
            <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black" title="Iuran Siswa">4</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">5</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">6</div>

            {/* Week 2 */}
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">7</div>
            <div className="p-2 rounded-xl bg-[#EACEFF] text-black border border-black" title="Donasi Sosial">8</div>
            <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black" title="Iuran Siswa">9</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">10</div>
            {/* Today highlighted with Yellow pill & black ring */}
            <div className="p-2 rounded-xl bg-[#FEF08A] text-black border-2 border-black ring-2 ring-black" title="Hari Ini">11</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">12</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">13</div>

            {/* Week 3 */}
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">14</div>
            <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black">15</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">16</div>
            <div className="p-2 rounded-xl bg-[#FFC6A8] text-black border border-black">17</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">18</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">19</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">20</div>

            {/* Week 4 */}
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">21</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">22</div>
            <div className="p-2 rounded-xl bg-[#EACEFF] text-black border border-black">23</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">24</div>
            <div className="p-2 rounded-xl bg-[#B8FFA9] text-black border border-black">25</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">26</div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">27</div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. MONTHLY SUMMARY & METRIC CARDS (MATCHING REFERENCE EXACTLY) */}
      {/* ============================================================== */}
      <div className="px-4 space-y-4">
        
        {/* Monthly Kas Summary Card (Mint Green #B8FFA9) */}
        <div className="bg-[#B8FFA9] border-2 border-black p-5 rounded-3xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2 relative overflow-hidden">
          
          <span className="text-[10px] font-extrabold text-black uppercase tracking-wider block">
            Ringkasan Kas Bulanan
          </span>
          <h4 className="font-space font-extrabold text-black text-xl">
            Kas Sehat & Surplus
          </h4>
          <p className="text-xs text-slate-800 font-medium leading-relaxed max-w-[240px]">
            Transparansi 100% terjaga di Cloud Firestore. Tidak ada selisih uang kas satu rupiah pun!
          </p>

          {/* Minimalist Peaceful Face Illustration on Right */}
          <div className="absolute right-4 bottom-3 w-16 h-16 pointer-events-none">
            <svg viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="26" stroke="#000" strokeWidth="2.5" />
              <path d="M20 25 C23 20 27 20 30 25" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M30 25 C33 20 37 20 40 25" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M24 36 C27 40 33 40 36 36" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* 3 Stat Metric Columns (Three White Cards from Reference!) */}
        <div className="grid grid-cols-3 gap-2.5">
          
          {/* Column 1: Activity / Terkumpul */}
          <div className="bg-white p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-tight">Terkumpul</span>
            <span className="font-space font-extrabold text-sm text-black block mt-0.5">Rp 300k</span>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Kas Masuk</span>
          </div>

          {/* Column 2: Therapy / Mutasi */}
          <div className="bg-white p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-tight">Mutasi</span>
            <span className="font-space font-extrabold text-sm text-black block mt-0.5">14 Log</span>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Tercatat</span>
          </div>

          {/* Column 3: Discipline / Kelunasan */}
          <div className="bg-white p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-tight">Disiplin</span>
            <span className="font-space font-extrabold text-sm text-emerald-800 block mt-0.5">{duesPercentage}%</span>
            <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">Lunas M1</span>
          </div>

        </div>

      </div>

    </div>
  );
};
