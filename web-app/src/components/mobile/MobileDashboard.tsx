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

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const totalSafe = classData.saldo > 0 ? classData.saldo : 1;
  const opsPct = ((classData.alokasi.operasional / totalSafe) * 100).toFixed(1);
  const sosPct = ((classData.alokasi.sosial / totalSafe) * 100).toFixed(1);

  return (
    <div className="flex-1 flex flex-col space-y-4 pb-24 font-space">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & MOOD LOGGER CARD (MATCHING REFERENCE EXACTLY)  */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-b-[36px] border-b-2 border-black shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-4">
        
        {/* User Profile Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#EACEFF] border-2 border-black flex items-center justify-center font-space font-extrabold text-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {userSession.role === 'bendahara' ? 'TR' : 'AS'}
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block leading-tight">Selamat datang,</span>
              <h4 className="font-space font-extrabold text-sm text-black leading-tight">
                {userSession.nama ? userSession.nama.split(' ')[0] + ' ' + (userSession.nama.split(' ')[1] || '') : 'Ardellio Satria'}
              </h4>
            </div>
          </div>

          {/* Hamburger Menu Toggle (Two lines from reference!) */}
          <button
            onClick={onOpenMenu}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-black flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
            title="Menu Pengaturan Akun"
          >
            <span className="w-4 h-0.5 bg-black rounded-full"></span>
            <span className="w-4 h-0.5 bg-black rounded-full"></span>
          </button>
        </div>

        {/* Date & Main Greeting */}
        <div>
          <span className="text-[11px] text-slate-500 font-bold block mb-1">
            11 Sep 2026 • XI-F2
          </span>
          <h2 className="text-lg font-space font-extrabold text-black leading-snug">
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
            <div className="w-6 h-6 rounded-full bg-[#B8FFA9] border border-black flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M7 11 C8 9 10 9 11 11" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <path d="M13 11 C14 9 16 9 17 11" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 15 C11 17 13 17 15 15" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-black">Aman</span>
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
            <div className="w-6 h-6 rounded-lg bg-[#FFC6A8] border border-black flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <line x1="7" y1="10" x2="11" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <line x1="17" y1="10" x2="13" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="#000" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-black">Tagihan</span>
          </button>

          {/* Sleepy / Nunggak */}
          <button
            type="button"
            onClick={() => onSelectMood('audit')}
            className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
              activeMood === 'audit'
                ? 'bg-[#EACEFF] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-[#EACEFF] border border-black flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <line x1="7" y1="11" x2="11" y2="11" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <line x1="13" y1="11" x2="17" y2="11" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 16 Q12 14 14 16" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-black">Audit</span>
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
            <div className="w-6 h-6 rounded-full bg-[#FEF08A] border border-black flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="10" r="1.5" fill="#000" />
                <circle cx="16" cy="10" r="1.5" fill="#000" />
                <path d="M7 14 Q12 19 17 14" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-black">Surplus</span>
          </button>

        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. MAIN MOBILE CONTENT CONTAINER                               */}
      {/* ============================================================== */}
      <div className="px-4 space-y-4">
        
        {/* Total Kas Card Banner */}
        <div className="bg-[#FFC6A8] p-4 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-black uppercase tracking-wider block">
              Total Kas Kelas Terkini
            </span>
            <div className="text-2xl font-space font-extrabold text-black">
              {formatRupiah(classData.saldo)}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-800 mt-0.5">
              <span>Ops: {opsPct}%</span>
              <span>•</span>
              <span>Sosial: {sosPct}%</span>
            </div>
          </div>

          <button
            onClick={onOpenCatatModal}
            className="w-10 h-10 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] tactile-bounce"
            title="Catat Transaksi"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2-Column Split Widgets: Arus Kas (Peach) & Disiplin (Lavender) */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Peach Sleep/Arus Kas Widget */}
          <div className="bg-[#FFC6A8] text-slate-900 p-3.5 rounded-3xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-black">
              <TrendingUp className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span>Arus Masuk</span>
            </div>

            {/* Segmented Bar Graph Mockup */}
            <div className="my-2.5 flex items-end gap-1.5 h-10">
              <div className="w-2 bg-orange-400 rounded-full h-4 border border-black"></div>
              <div className="w-2 bg-orange-500 rounded-full h-7 border border-black"></div>
              <div className="w-2 bg-orange-400 rounded-full h-3 border border-black"></div>
              <div className="w-2 bg-orange-600 rounded-full h-9 border border-black"></div>
              <div className="w-2 bg-orange-500 rounded-full h-6 border border-black"></div>
            </div>

            <div>
              <div className="text-base font-space font-extrabold text-black">+Rp 100k</div>
              <span className="text-[9px] text-slate-800 font-bold block">Minggu ke-1</span>
            </div>
          </div>

          {/* Lavender Stress/Disiplin Widget */}
          <div className="bg-[#EACEFF] text-slate-900 p-3.5 rounded-3xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-black">
              <ShieldCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span>Disiplin</span>
            </div>

            {/* Stepped Rising Bars Mockup */}
            <div className="my-2.5 flex items-end gap-1.5 h-10">
              <div className="w-2.5 bg-violet-300 rounded-md h-2 border border-black"></div>
              <div className="w-2.5 bg-violet-400 rounded-md h-4 border border-black"></div>
              <div className="w-2.5 bg-violet-500 rounded-md h-6 border border-black"></div>
              <div className="w-2.5 bg-violet-600 rounded-md h-9 border border-black"></div>
            </div>

            <div>
              <div className="text-base font-space font-extrabold text-black">Tinggi</div>
              <span className="text-[9px] text-slate-800 font-bold block">{duesPercentage}% Lunas</span>
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
        <div className="bg-[#B8FFA9] p-4 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-black">
            <span>Musyawarah Kas</span>
            <span className="bg-white px-2 py-0.5 rounded-full border border-black text-[9px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              1/3
            </span>
          </div>

          <p className="font-space font-bold text-xs text-black leading-snug">
            "Apakah dana operasional kas cukup untuk pembelian spidol & alat pel minggu ini?"
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setVoteSubmitted('yes')}
              className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-extrabold border-2 border-black transition-all tactile-bounce ${
                voteSubmitted === 'yes'
                  ? 'bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              Cukup (Ya)
            </button>
            <button
              onClick={() => setVoteSubmitted('no')}
              className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-extrabold border-2 border-black transition-all tactile-bounce ${
                voteSubmitted === 'no'
                  ? 'bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white/90 text-black hover:bg-white'
              }`}
            >
              Kurang
            </button>
          </div>

          {voteSubmitted && (
            <div className="text-[10px] font-bold text-black text-center pt-1">
              ✓ Suara dicatat untuk musyawarah kelas.
            </div>
          )}
        </div>

        {/* Recent Transactions List Preview */}
        <div className="bg-white p-4 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-space font-extrabold text-xs text-black">Mutasi Kas Terkini</h4>
            <span className="text-[10px] text-slate-500 font-bold">Terbaru</span>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 3).map((tx) => {
              const isIn = tx.type === 'in';
              return (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl border border-black flex items-center justify-center text-[10px] font-bold ${
                        isIn ? 'bg-[#B8FFA9] text-black' : 'bg-[#FFC6A8] text-black'
                      }`}
                    >
                      {isIn ? '+' : '-'}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-black leading-tight">{tx.description}</div>
                      <div className="text-[9px] text-slate-500 font-bold">Pos {tx.category}</div>
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

      </div>

    </div>
  );
};
