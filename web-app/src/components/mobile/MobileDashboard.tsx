import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Plus
} from 'lucide-react';
import type { ClassMetadata, Transaction, FinancialMood, UserSession, WhitelistStudent, CategoryAllocations } from '../../types';
import { BendaharaToolkit } from './BendaharaToolkit';

interface MobileDashboardProps {
  classData: ClassMetadata;
  transactions: Transaction[];
  students: WhitelistStudent[];
  userSession: UserSession;
  activeMood: FinancialMood;
  duesPercentage: string;
  onSelectMood: (mood: FinancialMood) => void;
  onOpenMenu: () => void;
  onOpenCatatModal: () => void;
  onQuickTransaction: (data: {
    type: 'in' | 'out';
    amount: number;
    category: keyof CategoryAllocations;
    description: string;
  }) => void;
  onExportExcel: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  classData,
  transactions,
  students,
  userSession,
  activeMood,
  duesPercentage,
  onSelectMood,
  onOpenMenu,
  onOpenCatatModal,
  onQuickTransaction,
  onExportExcel,
}) => {
  const [voteSubmitted, setVoteSubmitted] = useState<'yes' | 'no' | null>(null);

  // Formatting helpers with tabular numeric font
  const formatRupiahWhole = (num: number) => {
    return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const opsPct = classData.saldo > 0 ? Math.round((classData.alokasi.operasional / classData.saldo) * 100) : 0;
  const sosPct = classData.saldo > 0 ? Math.round((classData.alokasi.sosial / classData.saldo) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col space-y-4 pb-24 font-space">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & MOOD LOGGER (WHITE SECTION - MATCH SCREEN 2)   */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-b-[36px] border-b-2 border-black shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-4">
        
        {/* Profile Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar Circle */}
            <div className="w-11 h-11 rounded-full bg-[#B8FFA9] border-2 border-black flex items-center justify-center font-space font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {userSession.nama
                ? userSession.nama.split(' ').map((n) => n[0]).slice(0, 2).join('')
                : 'AS'}
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Selamat Datang,
              </span>
              <span className="text-sm font-space font-black text-black block leading-none">
                {userSession.nama || 'Ardellio Satria Anindito'}
              </span>
            </div>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={onOpenMenu}
            className="w-10 h-10 rounded-full bg-white border-2 border-black flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
            title="Buka Menu"
          >
            <span className="w-4 h-0.5 bg-black rounded-full"></span>
            <span className="w-4 h-0.5 bg-black rounded-full"></span>
          </button>
        </div>

        {/* Date & Main Greeting */}
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-black/30 text-[10px] text-slate-600 font-extrabold font-mono">
              11 Sep 2026 • XI-F2
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-emerald-800 font-black uppercase">Live Firestore</span>
          </div>

          <h2 className="text-xl font-space font-extrabold text-black leading-snug tracking-tight">
            Halo {userSession.nama ? userSession.nama.split(' ')[0] : 'Ardellio'}! Bagaimana kondisi kas kelas hari ini?
          </h2>
        </div>

        {/* Horizontal Mood Selector Row (Direct match to reference design!) */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          
          {/* Happy / Aman */}
          <button
            type="button"
            onClick={() => onSelectMood('aman')}
            className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
              activeMood === 'aman'
                ? 'bg-[#B8FFA9] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#B8FFA9] border border-black flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M7 11 C8 9 10 9 11 11" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M13 11 C14 9 16 9 17 11" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M9 15 C11 17 13 17 15 15" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-black">Aman</span>
          </button>

          {/* Angry / Tagihan */}
          <button
            type="button"
            onClick={() => onSelectMood('tagihan')}
            className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
              activeMood === 'tagihan'
                ? 'bg-[#FFC6A8] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-[#FFC6A8] border border-black flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <line x1="7" y1="10" x2="11" y2="12" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="17" y1="10" x2="13" y2="12" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="#000" />
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-black">Tagihan</span>
          </button>

          {/* Sleepy / Audit */}
          <button
            type="button"
            onClick={() => onSelectMood('audit')}
            className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
              activeMood === 'audit'
                ? 'bg-[#EACEFF] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#EACEFF] border border-black flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <line x1="7" y1="11" x2="11" y2="11" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="13" y1="11" x2="17" y2="11" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M10 16 Q12 14 14 16" stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-black">Audit</span>
          </button>

          {/* Surplus / Excited */}
          <button
            type="button"
            onClick={() => onSelectMood('surplus')}
            className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
              activeMood === 'surplus'
                ? 'bg-[#FEF08A] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#FEF08A] border border-black flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="10" r="1.5" fill="#000" />
                <circle cx="16" cy="10" r="1.5" fill="#000" />
                <path d="M7 14 Q12 19 17 14" stroke="#000" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-black">Surplus</span>
          </button>

        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. MAIN MOBILE CONTENT CONTAINER                               */}
      {/* ============================================================== */}
      <div className="px-4 space-y-4">
        
        {/* Total Kas Card Banner (High-end Typography & Numeric Scale) */}
        <div className="bg-[#B8FFA9] p-4.5 rounded-[32px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-black uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full border border-black">
              Saldo Kas Berjalan
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black text-white">
              Surplus 100%
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-sm font-space font-black text-black/70">Rp</span>
            <span className="text-3xl sm:text-4xl font-num font-black text-black tracking-tight leading-none">
              {formatRupiahWhole(classData.saldo)}
            </span>
          </div>

          {/* Allocation Micro-Pills */}
          <div className="pt-2 border-t border-black/15 flex items-center justify-between text-[11px] font-extrabold">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span className="text-black">Ops:</span>
              <span className="font-num font-black text-black">Rp {formatRupiahWhole(classData.alokasi.operasional)}</span>
              <span className="text-black/60 font-medium">({opsPct}%)</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-600"></span>
              <span className="text-black">Sosial:</span>
              <span className="font-num font-black text-black">Rp {formatRupiahWhole(classData.alokasi.sosial)}</span>
              <span className="text-black/60 font-medium">({sosPct}%)</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split Widgets: Arus Kas (Peach) & Disiplin (Lavender) */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Peach Sleep/Arus Kas Widget */}
          <div className="bg-[#FFC6A8] text-slate-900 p-4 rounded-[28px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-black">
                <TrendingUp className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>Arus Masuk</span>
              </div>
              <span className="text-[9px] font-extrabold bg-white/70 px-1.5 py-0.2 rounded-md border border-black">
                Mgg 1
              </span>
            </div>

            {/* Segmented Bar Graph Mockup (Matching Screenshot) */}
            <div className="my-3 flex items-end gap-1.5 h-11 px-1">
              <div className="w-2.5 bg-orange-400 rounded-full h-5 border border-black shadow-xs"></div>
              <div className="w-2.5 bg-orange-500 rounded-full h-8 border border-black shadow-xs"></div>
              <div className="w-2.5 bg-orange-400 rounded-full h-4 border border-black shadow-xs"></div>
              <div className="w-2.5 bg-orange-600 rounded-full h-11 border border-black shadow-xs"></div>
              <div className="w-2.5 bg-orange-500 rounded-full h-7 border border-black shadow-xs"></div>
            </div>

            <div>
              <div className="text-2xl font-num font-black text-black tracking-tight leading-none">
                +Rp 100k
              </div>
              <span className="text-[10px] text-slate-800 font-bold block mt-1">
                Terkumpul Pekan Ini
              </span>
            </div>
          </div>

          {/* Lavender Stress/Disiplin Widget */}
          <div className="bg-[#EACEFF] text-slate-900 p-4 rounded-[28px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-black">
                <ShieldCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>Disiplin</span>
              </div>
              <span className="text-[9px] font-extrabold bg-white/70 px-1.5 py-0.2 rounded-md border border-black">
                Tinggi
              </span>
            </div>

            {/* Stepped Rising Bars Mockup (Matching Screenshot) */}
            <div className="my-3 flex items-end gap-1.5 h-11 px-1">
              <div className="w-3 bg-violet-300 rounded-md h-3 border border-black shadow-xs"></div>
              <div className="w-3 bg-violet-400 rounded-md h-5 border border-black shadow-xs"></div>
              <div className="w-3 bg-violet-500 rounded-md h-8 border border-black shadow-xs"></div>
              <div className="w-3 bg-violet-600 rounded-md h-11 border border-black shadow-xs"></div>
            </div>

            <div>
              <div className="text-2xl font-num font-black text-black tracking-tight leading-none">
                {duesPercentage}%
              </div>
              <span className="text-[10px] text-slate-800 font-bold block mt-1">
                30 / 36 Siswa Lunas
              </span>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* BENDAHARA TOOLKIT: PENCATATAN PINTAS, FISIK, DAN TAGIHAN       */}
        {/* ============================================================== */}
        <BendaharaToolkit
          classData={classData}
          students={students}
          onQuickTransaction={onQuickTransaction}
          onExportExcel={onExportExcel}
        />

        {/* Interactive Mint Card: Musyawarah Kas Quiz (Matching Reference!) */}
        <div className="bg-[#B8FFA9] p-4.5 rounded-[32px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-black text-black">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span>Musyawarah Kas</span>
            </div>
            <span className="bg-white px-2.5 py-0.5 rounded-full border border-black text-[10px] font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              Pertanyaan 1/3
            </span>
          </div>

          <p className="font-space font-extrabold text-sm text-black leading-snug">
            "Apakah dana operasional kas cukup untuk pembelian spidol & alat pel minggu ini?"
          </p>

          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => setVoteSubmitted('yes')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black border-2 border-black transition-all tactile-bounce ${
                voteSubmitted === 'yes'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-black text-white hover:bg-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              Cukup (Ya)
            </button>
            <button
              onClick={() => setVoteSubmitted('no')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black border-2 border-black transition-all tactile-bounce ${
                voteSubmitted === 'no'
                  ? 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              Kurang
            </button>
          </div>

          {voteSubmitted && (
            <div className="text-[10px] font-black text-emerald-950 text-center pt-1 animate-pulse">
              ✓ Pilihan Anda ({voteSubmitted === 'yes' ? 'Cukup' : 'Kurang'}) tercatat dalam musyawarah kelas!
            </div>
          )}
        </div>

        {/* Recent Transactions Feed */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-black px-1">
            <span className="text-black font-space">Aktivitas Kas Terbaru</span>
            <button
              onClick={onOpenCatatModal}
              className="text-[10px] font-black text-emerald-800 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Input Baru</span>
            </button>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 4).map((tx) => {
              const isIn = tx.type === 'in';
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl border border-black flex items-center justify-center font-black text-xs shadow-xs ${
                        isIn ? 'bg-[#B8FFA9] text-black' : 'bg-[#FFC6A8] text-black'
                      }`}
                    >
                      {isIn ? '+' : '-'}
                    </div>
                    <div>
                      <div className="font-space font-extrabold text-xs text-black leading-tight">
                        {tx.description}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {tx.inputBy} • Pos {tx.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-num font-black text-xs sm:text-sm ${isIn ? 'text-emerald-800' : 'text-orange-900'}`}>
                      {isIn ? '+' : '-'}Rp {formatRupiahWhole(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
