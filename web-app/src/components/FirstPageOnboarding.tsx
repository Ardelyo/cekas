import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Users,
  Coins,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus
} from 'lucide-react';
import type { WhitelistStudent } from '../types';

interface FirstPageOnboardingProps {
  students: WhitelistStudent[];
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onEnterDashboard: () => void;
}

export const FirstPageOnboarding: React.FC<FirstPageOnboardingProps> = ({
  students,
  onOpenLogin,
  onOpenSignup,
  onEnterDashboard,
}) => {
  // Interactive character speech bubble state
  const [activeMascotQuote, setActiveMascotQuote] = useState<{
    name: string;
    quote: string;
    tag: string;
    color: string;
  }>({
    name: 'Si Hijau Aman',
    quote: 'Kas kelas aman, surplus Rp 160.000 tercatat di Firestore!',
    tag: 'Status: Surplus',
    color: '#B8FFA9',
  });

  // Quick NIS check on first page
  const [nisQuery, setNisQuery] = useState<string>('');
  const [nisResult, setNisResult] = useState<{ found: boolean; student?: WhitelistStudent } | null>(null);

  const handleNisCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisQuery.trim()) return;
    const student = students.find((s) => s.nis === nisQuery.trim());
    setNisResult({ found: !!student, student });
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-space">
      
      {/* ============================================================== */}
      {/* BRANDING TOP BAR                                               */}
      {/* ============================================================== */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#B8FFA9] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Coins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-space font-extrabold text-2xl text-black tracking-tight">CEKAS</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EACEFF] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                XI-F2
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">SMA Kartika XIX-1 Bandung</p>
          </div>
        </div>

        {/* Quick Nav / Entry buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-full text-xs font-bold bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EACEFF] transition-all tactile-bounce flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          
          <button
            onClick={onEnterDashboard}
            className="hidden sm:flex px-4 py-2 rounded-full text-xs font-bold bg-black text-white hover:bg-slate-800 transition-all tactile-bounce items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
          >
            <span>Dashboard Publik</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* HERO SECTION (MOBILE & PC DUAL LAYOUT)                         */}
      {/* ============================================================== */}
      <main className="max-w-6xl w-full mx-auto my-auto py-6 sm:py-10">
        <div className="bg-white rounded-[36px] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-10 lg:p-12 relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: HEADLINE, BRAND VALUE & ICONIC CTA PILL */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#B8FFA9] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparansi Finansial Kelas Digital</span>
            </div>

            {/* Main Headline (Space Grotesk bold) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-space font-extrabold text-black leading-[1.08] tracking-tight">
              Bingung Soal Kas Kelas Kamu?
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed max-w-xl">
              Kelola dan pantau uang kas kelas XI-F2 secara transparan, otomatis, dan akurat. Terhubung langsung dengan Google Cloud Firestore dan notifikasi Telegram bot.
            </p>

            {/* THE ICONIC CALL-TO-ACTION PILL BUTTON (From Reference Design!) */}
            <div className="pt-2">
              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto bg-[#F1F5F9] hover:bg-[#E2E8F0] border-2 border-black rounded-full p-2 pl-6 sm:pl-7 pr-2 flex items-center justify-between sm:justify-start gap-4 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all tactile-bounce group"
              >
                <span className="text-sm tracking-tight">Biar CEKAS Bantu!</span>
                <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </span>
              </button>
            </div>

            {/* Quick Whitelist Verification Bar (Interactive) */}
            <div className="pt-3 border-t-2 border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-2">
                Cek Cepat Status NIS Anda di Whitelist XI-F2:
              </span>
              <form onSubmit={handleNisCheck} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={nisQuery}
                    onChange={(e) => setNisQuery(e.target.value)}
                    placeholder="Masukkan NIS (contoh: 23241001)..."
                    className="w-full text-xs bg-slate-50 border-2 border-black rounded-2xl pl-10 pr-3 py-2.5 font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl bg-[#EACEFF] text-black font-extrabold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#d8b4fe] transition-all"
                >
                  Cek
                </button>
              </form>

              {/* Dynamic Search Feedback */}
              {nisResult && (
                <div className="mt-2.5 max-w-md">
                  {nisResult.found ? (
                    <div className="p-3 rounded-2xl bg-[#B8FFA9]/40 border-2 border-black text-xs font-bold text-black flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                        <div>
                          <div>{nisResult.student?.namaResmi}</div>
                          <span className="text-[10px] text-slate-600 font-medium">Terverifikasi Absensi Sah</span>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-black">
                        {nisResult.student?.paid ? 'Lunas M1' : 'Belum Bayar'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[#FECDD3]/50 border-2 border-black text-xs font-bold text-rose-950 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>NIS "{nisQuery}" tidak ditemukan di daftar resmi XI-F2.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick 3 Value Pillars */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-[#B8FFA9]/30 border-2 border-black/80">
                <ShieldCheck className="w-4 h-4 text-emerald-800 mb-1" />
                <div className="font-extrabold text-black">Nol Selisih</div>
                <div className="text-[10px] text-slate-600 font-medium">Kalkulasi presisi</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFC6A8]/40 border-2 border-black/80">
                <Users className="w-4 h-4 text-orange-800 mb-1" />
                <div className="font-extrabold text-black">Whitelist XI-F2</div>
                <div className="text-[10px] text-slate-600 font-medium">Anti akun fiktif</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#EACEFF]/40 border-2 border-black/80">
                <Coins className="w-4 h-4 text-purple-800 mb-1" />
                <div className="font-extrabold text-black">4 Pos Dana</div>
                <div className="text-[10px] text-slate-600 font-medium">KBM, sosial, event</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: DYNAMIC ANIMATED MASCOT CLUSTER STAGE */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
            
            {/* Interactive Speech Bubble */}
            <div
              className="w-full p-4 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative"
              style={{ backgroundColor: activeMascotQuote.color }}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-black mb-1">
                <span>{activeMascotQuote.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/90 border border-black text-[10px]">
                  {activeMascotQuote.tag}
                </span>
              </div>
              <p className="text-xs font-bold text-black leading-snug">
                "{activeMascotQuote.quote}"
              </p>
              {/* Pointer triangle */}
              <div
                className="w-3.5 h-3.5 border-b-2 border-r-2 border-black absolute -bottom-2 left-10 rotate-45"
                style={{ backgroundColor: activeMascotQuote.color }}
              ></div>
            </div>

            {/* SVG Geometric Mascot Cluster (From Reference Art) */}
            <div className="w-full bg-[#FAF5FF] rounded-3xl border-2 border-black p-6 flex items-center justify-center relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <svg
                className="w-full max-w-[320px] h-auto anim-float select-none"
                viewBox="0 0 320 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 1. MINT GREEN SERENE CIRCLE (Kas Aman) */}
                <g
                  className="cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() =>
                    setActiveMascotQuote({
                      name: 'Si Hijau Aman',
                      quote: 'Kas kelas dalam kondisi sangat sehat dan surplus Rp 160.000!',
                      tag: 'Status: Surplus',
                      color: '#B8FFA9',
                    })
                  }
                >
                  <circle cx="85" cy="140" r="48" fill="#B8FFA9" stroke="#000000" strokeWidth="3.5" />
                  <g className="anim-blink">
                    <path d="M66 134 C72 126 80 126 86 134" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M94 134 C100 126 108 126 114 134" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                  <path d="M84 154 C88 158 96 158 100 154" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="68" cy="146" r="4.5" fill="#FCA5A5" opacity="0.6" />
                  <circle cx="112" cy="146" r="4.5" fill="#FCA5A5" opacity="0.6" />
                </g>

                {/* 2. LAVENDER SPIRAL (Dizzy/Calculating Audit) */}
                <g
                  className="cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() =>
                    setActiveMascotQuote({
                      name: 'Si Ungu Spiral',
                      quote: 'Saya memvalidasi rekonsiliasi saldo agar tidak terjadi selisih satu rupiah pun!',
                      tag: 'Status: Audit Presisi',
                      color: '#EACEFF',
                    })
                  }
                >
                  <circle cx="175" cy="110" r="44" fill="#EACEFF" stroke="#000000" strokeWidth="3.5" />
                  <g className="anim-blink">
                    <circle cx="162" cy="104" r="5" fill="#000000" />
                    <circle cx="188" cy="101" r="5.5" fill="#000000" />
                  </g>
                  <path d="M165 125 Q175 117 185 125" stroke="#000000" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  {/* Swirl body line */}
                  <path d="M148 118 Q162 135 180 128" stroke="#000000" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                </g>

                {/* 3. PEACH ROUNDED SQUARE (Grumpy / Tagihan Alert) */}
                <g
                  className="cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() =>
                    setActiveMascotQuote({
                      name: 'Si Oranye Waspada',
                      quote: 'Ada 2 siswa yang belum melunasi iuran minggu ini. Yuk segera diselesaikan!',
                      tag: 'Status: 2 Nunggak',
                      color: '#FFC6A8',
                    })
                  }
                >
                  <rect x="220" y="90" width="68" height="68" rx="24" fill="#FFC6A8" stroke="#000000" strokeWidth="3.5" />
                  <line x1="235" y1="112" x2="246" y2="116" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="274" y1="112" x2="263" y2="116" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="254" cy="134" r="6" fill="#000000" />
                </g>

                {/* 4. YELLOW SPARKLE STAR (Energetic / Surplus) */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    setActiveMascotQuote({
                      name: 'Si Bintang Ceria',
                      quote: 'Target pengumpulan iuran minggu ini sudah tercapai 83.3%!',
                      tag: 'Status: Keren!',
                      color: '#FEF08A',
                    })
                  }
                >
                  <path
                    className="anim-spark"
                    d="M275 35 L280 54 L298 58 L280 62 L275 80 L270 62 L252 58 L270 54 Z"
                    fill="#FEF08A"
                    stroke="#000000"
                    strokeWidth="2.5"
                  />
                </g>

                {/* 5. CORAL TRIANGLE (Alert) */}
                <polygon points="135,210 95,240 175,240" fill="#FECDD3" stroke="#000000" strokeWidth="3" />
                <path d="M125 228 L131 232 M131 228 L125 232" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M139 228 L145 232 M145 228 L139 232" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />

                {/* 6. BLUE DROPLET (Sleepy) */}
                <circle cx="205" cy="205" r="24" fill="#BAE6FD" stroke="#000000" strokeWidth="3" />
                <line x1="195" y1="205" x2="203" y2="205" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="207" y1="205" x2="215" y2="205" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="205" cy="214" r="2.5" fill="#000000" />
              </svg>
            </div>

            {/* Instruction hint */}
            <span className="text-[11px] font-bold text-slate-500 text-center block">
              💡 Ketuk karakter di atas untuk melihat respon status emosinya!
            </span>

          </div>

        </div>
      </main>

      {/* ============================================================== */}
      {/* FOOTER & ROLE SHORTCUTS                                        */}
      {/* ============================================================== */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t-2 border-slate-200 text-xs font-semibold text-slate-600">
        <div>
          Kelompok 5 • <b>Tarina</b>, <b>Ardellio Satria</b>, <b>Nabila</b>, <b>Cinta</b>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSignup}
            className="text-black hover:underline font-bold flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Siswa Baru</span>
          </button>
          <span>•</span>
          <button
            onClick={onOpenLogin}
            className="text-black hover:underline font-bold flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Login Bendahara (PIN)</span>
          </button>
        </div>
      </footer>

    </div>
  );
};
