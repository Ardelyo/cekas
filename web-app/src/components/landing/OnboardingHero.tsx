import React from 'react';
import { ArrowRight, ShieldCheck, Coins, LogIn, UserPlus } from 'lucide-react';
import type { WhitelistStudent } from '../../types';
import { InteractiveMascotStage } from './InteractiveMascotStage';
import { QuickNisVerifier } from './QuickNisVerifier';

interface OnboardingHeroProps {
  students: WhitelistStudent[];
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onEnterDashboard: () => void;
  onDirectLoginStudent: (student: WhitelistStudent) => void;
}

export const OnboardingHero: React.FC<OnboardingHeroProps> = ({
  students,
  onOpenLogin,
  onOpenSignup,
  onEnterDashboard,
  onDirectLoginStudent,
}) => {
  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-space">
      
      {/* ============================================================== */}
      {/* BRANDING TOP BAR                                               */}
      {/* ============================================================== */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 sm:py-3">
        {/* Brand Logo & Class Badge */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#B8FFA9] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Coins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-space font-extrabold text-2xl text-black tracking-tight">CEKAS</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EACEFF] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                XI-F2
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">SMA Kartika XIX-1 Bandung</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-full text-xs font-extrabold bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EACEFF] transition-all tactile-bounce flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          
          <button
            onClick={onEnterDashboard}
            className="hidden sm:flex px-4 py-2 rounded-full text-xs font-extrabold bg-black text-white hover:bg-slate-800 transition-all tactile-bounce items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
          >
            <span>Dashboard Publik</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN HERO CARD (BENTO STYLE DUAL PC/MOBILE LAYOUT)             */}
      {/* ============================================================== */}
      <main className="max-w-6xl w-full mx-auto my-auto py-4 sm:py-8">
        <div className="bg-white rounded-[38px] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-10 lg:p-12 relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: HERO TEXT & THE ICONIC PILL BUTTON */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#B8FFA9] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Transparansi Kas Kelas Digital</span>
            </div>

            {/* Main Headline (Space Grotesk) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-space font-extrabold text-black leading-[1.08] tracking-tight">
              Bingung Soal Kas Kelas Kamu?
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed max-w-xl">
              Sistem pencatatan kas presisi dan transparan untuk kelas XI-F2 SMA Kartika XIX-1 Bandung. Terhubung langsung dengan Google Cloud Firestore dan notifikasi bot Telegram tanpa risiko selisih.
            </p>

            {/* THE ICONIC CALL-TO-ACTION PILL (Direct from the Reference Branding!) */}
            <div className="pt-1">
              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto bg-[#F1F5F9] hover:bg-[#E2E8F0] border-2 border-black rounded-full p-2 pl-6 sm:pl-7 pr-2 flex items-center justify-between sm:justify-start gap-4 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all tactile-bounce group"
              >
                <span className="tracking-tight text-sm sm:text-base">Biar CEKAS Bantu!</span>
                <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </span>
              </button>
            </div>

            {/* Interactive NIS Verifier Component */}
            <div className="pt-2">
              <QuickNisVerifier
                students={students}
                onDirectLogin={onDirectLoginStudent}
              />
            </div>

            {/* 3 Core Pillars */}
            <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-3 rounded-2xl bg-[#B8FFA9]/40 border-2 border-black">
                <div className="font-extrabold text-black">Nol Selisih</div>
                <div className="text-[10px] text-slate-600 font-bold">Kalkulasi lari otomatis</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFC6A8]/40 border-2 border-black">
                <div className="font-extrabold text-black">Whitelist XI-F2</div>
                <div className="text-[10px] text-slate-600 font-bold">Absensi sah sekolah</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#EACEFF]/40 border-2 border-black">
                <div className="font-extrabold text-black">4 Pos Dana</div>
                <div className="text-[10px] text-slate-600 font-bold">Operasional & sosial</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE ANIMATED MASCOT STAGE */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <InteractiveMascotStage />
          </div>

        </div>
      </main>

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t-2 border-black/10 text-xs font-bold text-slate-600">
        <div>
          Kelompok 5 • <b>Tarina</b>, <b>Ardellio Satria</b>, <b>Nabila</b>, <b>Cinta</b>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSignup}
            className="text-black hover:underline font-extrabold flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Siswa Baru</span>
          </button>
          <span>•</span>
          <button
            onClick={onOpenLogin}
            className="text-black hover:underline font-extrabold flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Login Bendahara (PIN)</span>
          </button>
        </div>
      </footer>

    </div>
  );
};
