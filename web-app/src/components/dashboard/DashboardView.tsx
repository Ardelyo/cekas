import React from 'react';
import { ShieldCheck, Clock, TrendingUp, FileText, MessageSquare } from 'lucide-react';
import type { ClassMetadata, Transaction, WhitelistStudent, FinancialMood, UserSession } from '../../types';
import { MetricOverviewCards } from './MetricOverviewCards';
import { DarkBentoPod } from './DarkBentoPod';
import { KasCalendarCard } from './KasCalendarCard';
import { RecentMutasiCard } from './RecentMutasiCard';
import { AnimatedMascot } from '../AnimatedMascot';

interface DashboardViewProps {
  classData: ClassMetadata;
  transactions: Transaction[];
  students: WhitelistStudent[];
  userSession: UserSession;
  activeMood: FinancialMood;
  onSelectMood: (mood: FinancialMood) => void;
  onNavigateTab: (tab: 'transaksi' | 'tagihan') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classData,
  transactions,
  students,
  userSession,
  activeMood,
  onSelectMood,
  onNavigateTab,
}) => {
  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.paid).length;
  const unpaidCount = totalStudents - paidCount;
  const duesPercentage = ((paidCount / (totalStudents > 0 ? totalStudents : 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6 font-space">
      
      {/* 1. TOP METRIC OVERVIEW ROW (4 BENTO CARDS) */}
      <MetricOverviewCards
        classData={classData}
        paidCount={paidCount}
        unpaidCount={unpaidCount}
        duesPercentage={duesPercentage}
      />

      {/* 2. MAIN BENTO 3-COLUMN LAYOUT (DESKTOP & MOBILE RESPONSIVE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1 (3 Cols): ASISTEN MASKOT REAKTIF & TELEGRAM GATEWAY */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white p-6 rounded-[34px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF08A] text-black border border-black mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Asisten Finansial
              </div>
              <h2 className="text-2xl font-space font-extrabold text-black leading-tight">
                Kondisi Kas Kelas
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-2">
                Maskot bereaksi otomatis mengikuti saldo, kelunasan, dan audit kas kelas.
              </p>
            </div>

            <div className="mt-4 pt-2 border-t-2 border-slate-100">
              <AnimatedMascot mood={activeMood} />
            </div>

            <div className="mt-4">
              <button
                onClick={() => onNavigateTab('tagihan')}
                className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] border-2 border-black rounded-full p-2.5 px-4 text-xs font-extrabold text-black transition-all text-center block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
              >
                Buka Matriks Iuran Siswa →
              </button>
            </div>
          </div>

          {/* Telegram Gateway Information */}
          <div className="bg-black text-white p-5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#B8FFA9]" />
              </div>
              <div>
                <h4 className="font-space font-extrabold text-sm text-white">Bot Telegram Gateway</h4>
                <p className="text-[11px] text-slate-400 font-medium">@kacekasbot • Live Sync</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Setiap mutasi kas di web otomatis mengirim push notification solo ke HP masing-masing siswa terdaftar.
            </p>
          </div>

        </div>

        {/* COLUMN 2 (5 Cols): USER PROFILE, MOOD SELECTOR & OBSIDIAN DARK POD */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-6 rounded-[34px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EACEFF] border-2 border-black flex items-center justify-center font-space font-extrabold text-black text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {userSession.role === 'bendahara' ? 'TR' : 'AS'}
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Selamat datang,</span>
                  <h3 className="font-space font-extrabold text-black text-base leading-tight">
                    {userSession.nama || 'Ardellio Satria Anindito'}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">11 September 2026</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B8FFA9] text-black border border-black capitalize">
                  {userSession.role} XI-F2
                </span>
              </div>
            </div>

            <h1 className="text-xl font-space font-extrabold text-black mt-5 leading-snug">
              Bagaimana kondisi kas kelas hari ini?
            </h1>

            {/* Financial Mood Selector Bar (Interactive Trigger for Mascot!) */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t-2 border-slate-100">
              <button
                onClick={() => onSelectMood('aman')}
                className={`p-2.5 rounded-2xl text-center transition-all ${
                  activeMood === 'aman'
                    ? 'bg-[#B8FFA9] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold'
                    : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold'
                }`}
              >
                <ShieldCheck className="w-5 h-5 mx-auto text-black" />
                <span className="text-[11px] text-black mt-1 block">Aman</span>
              </button>

              <button
                onClick={() => onSelectMood('tagihan')}
                className={`p-2.5 rounded-2xl text-center transition-all ${
                  activeMood === 'tagihan'
                    ? 'bg-[#FFC6A8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold'
                    : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold'
                }`}
              >
                <Clock className="w-5 h-5 mx-auto text-black" />
                <span className="text-[11px] text-black mt-1 block">Tagihan</span>
              </button>

              <button
                onClick={() => onSelectMood('surplus')}
                className={`p-2.5 rounded-2xl text-center transition-all ${
                  activeMood === 'surplus'
                    ? 'bg-[#EACEFF] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold'
                    : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold'
                }`}
              >
                <TrendingUp className="w-5 h-5 mx-auto text-black" />
                <span className="text-[11px] text-black mt-1 block">Surplus</span>
              </button>

              <button
                onClick={() => onSelectMood('audit')}
                className={`p-2.5 rounded-2xl text-center transition-all ${
                  activeMood === 'audit'
                    ? 'bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold'
                    : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto text-black" />
                <span className="text-[11px] text-black mt-1 block">Audit</span>
              </button>
            </div>
          </div>

          {/* Central Dark Navy Pod */}
          <DarkBentoPod
            operationalBudget={classData.alokasi.operasional}
            duesPercentage={duesPercentage}
          />

        </div>

        {/* COLUMN 3 (4 Cols): KAS CALENDAR & RECENT MUTASI LEDGER */}
        <div className="lg:col-span-4 space-y-6">
          <KasCalendarCard duesPercentage={duesPercentage} />
          
          <RecentMutasiCard
            transactions={transactions}
            onViewAll={() => onNavigateTab('transaksi')}
          />
        </div>

      </div>

    </div>
  );
};
