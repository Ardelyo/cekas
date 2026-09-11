import React from 'react';
import { ArrowRight, ShieldCheck, UserCheck, RefreshCw, LogIn, UserPlus } from 'lucide-react';
import { AnimatedMascot } from './AnimatedMascot';

interface OnboardingViewProps {
  onStartLogin: () => void;
  onStartSignup: () => void;
  onContinueAsGuest: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onStartLogin,
  onStartSignup,
  onContinueAsGuest,
}) => {
  return (
    <div className="min-h-screen bg-[#EEF2F6] flex flex-col justify-between p-4 sm:p-8 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-fredoka font-bold text-xl text-slate-900 tracking-tight">CEKAS</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                Official App
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Kelas XI-F2 SMA Kartika XIX-1 Bandung</p>
          </div>
        </div>

        <button
          onClick={onContinueAsGuest}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-white/80 transition-all border border-transparent hover:border-slate-200"
        >
          Lihat Dashboard Publik →
        </button>
      </header>

      {/* Main Hero Onboarding Card */}
      <main className="my-auto py-8">
        <div className="bg-white rounded-4xl border border-slate-200/90 shadow-xl p-8 sm:p-12 relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Sistem Informasi Keuangan Kelas Digital
            </div>

            <h1 className="text-4xl sm:text-5xl font-fredoka font-bold text-slate-900 leading-[1.15]">
              Bingung Soal Kas Kelas Kamu?
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
              CEKAS mengalihkan pencatatan buku tulis manual menjadi sistem digital transparan berbasis Google Cloud Firestore. Tanpa selisih, terpantau real-time, dan terverifikasi absensi resmi XI-F2.
            </p>

            {/* 3 Core Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <div className="w-7 h-7 rounded-xl bg-[#BBF7D0] flex items-center justify-center text-emerald-900 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-fredoka font-bold text-xs text-slate-900">Nol Selisih</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Kalkulasi saldo lari otomatis tanpa salah hitung.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200">
                <div className="w-7 h-7 rounded-xl bg-[#DDD6FE] flex items-center justify-center text-violet-900 mb-2">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="font-fredoka font-bold text-xs text-slate-900">Whitelist Sah</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Terkunci pada daftar absensi resmi siswa XI-F2.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200">
                <div className="w-7 h-7 rounded-xl bg-[#FED7AA] flex items-center justify-center text-orange-900 mb-2">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h4 className="font-fredoka font-bold text-xs text-slate-900">4 Pos Alokasi</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Operasional KBM, sosial, acara, dan cadangan.</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onStartLogin}
                className="w-full sm:w-auto px-7 py-4 rounded-full font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Kelas (Siswa / Bendahara)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onStartSignup}
                className="w-full sm:w-auto px-6 py-4 rounded-full font-bold text-xs bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-slate-600" />
                <span>Daftar Siswa Baru (Whitelist)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Animated Mascot */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-50/80 rounded-3xl p-6 border border-slate-100">
            <AnimatedMascot mood="aman" className="w-full max-w-[280px]" />
            <div className="mt-4 text-center">
              <span className="font-fredoka font-bold text-xs text-slate-700 block">
                Maskot Finansial CEKAS
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Bereaksi langsung terhadap status kesehatan kas kelas
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 font-medium">
        Kelompok 5 • Tarina, Ardellio Satria Anindito, Nabila, Cinta • Kelas XI-F2 SMA Kartika XIX-1 Bandung
      </footer>

    </div>
  );
};
