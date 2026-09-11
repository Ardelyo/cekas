/**
 * CEKAS (Catatan Keuangan Kelas)
 * Showcase Screen Design Generator & End-to-End Flowchart Builder
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUTPUT_DIR = path.resolve(__dirname, "../showcase_screens");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// --------------------------------------------------------------------------
// HTML TEMPLATES FOR INDIVIDUAL PHONE SCREENS (390 x 820 aspect ratio)
// --------------------------------------------------------------------------

const CSS_COMMON = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #EEF2F6; margin: 0; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .font-fredoka { font-family: 'Fredoka', cursive; }
    .phone-container {
      width: 380px;
      height: 780px;
      background: white;
      border-radius: 46px;
      overflow: hidden;
      box-shadow: 0 30px 70px -15px rgba(15, 23, 42, 0.25), 0 0 0 10px #0F172A, 0 0 0 12px #334155;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .phone-notch {
      width: 130px;
      height: 24px;
      background: #0F172A;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
      z-index: 50;
    }
  </style>
`;

// SCREEN 1: ONBOARDING / SPLASH
function getHtmlOnboarding() {
  return `<!DOCTYPE html><html><head>${CSS_COMMON}</head><body>
  <div class="phone-container justify-between p-6 pt-10">
    <div class="phone-notch"></div>
    <div class="mt-8 text-center">
      <h1 class="text-3xl font-fredoka font-bold text-slate-900 leading-tight">
        Bingung Soal Kas Kelas Kamu?
      </h1>
      <div class="mt-6 flex justify-center">
        <div class="bg-slate-100 border border-slate-200/90 rounded-full p-2 pl-6 flex items-center justify-between gap-5 text-xs font-bold text-slate-800 shadow-sm">
          <span>Biar CEKAS Bantu!</span>
          <span class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">→</span>
        </div>
      </div>
    </div>

    <!-- Geometric Mascot Cluster -->
    <div class="my-auto flex justify-center">
      <svg width="300" height="240" viewBox="0 0 300 240" fill="none">
        <!-- Green Serene Circle -->
        <circle cx="80" cy="130" r="46" fill="#BBF7D0" stroke="#86EFAC" stroke-width="3"/>
        <path d="M62 124 C68 116 76 116 82 124" stroke="#166534" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M88 124 C94 116 102 116 108 124" stroke="#166534" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M78 144 C82 148 90 148 94 144" stroke="#166534" stroke-width="3" stroke-linecap="round"/>

        <!-- Purple Spiral / Dizzy Receipt -->
        <circle cx="165" cy="100" r="44" fill="#DDD6FE" stroke="#C4B5FD" stroke-width="3"/>
        <circle cx="152" cy="94" r="5" fill="#5B21B6"/>
        <circle cx="178" cy="92" r="5.5" fill="#5B21B6"/>
        <path d="M156 114 Q165 106 174 114" stroke="#5B21B6" stroke-width="3" fill="none" stroke-linecap="round"/>

        <!-- Peach Rounded Square -->
        <rect x="205" y="80" width="70" height="70" rx="24" fill="#FED7AA" stroke="#FDBA74" stroke-width="3"/>
        <line x1="220" y1="102" x2="232" y2="106" stroke="#9A3412" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="260" y1="102" x2="248" y2="106" stroke="#9A3412" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="240" cy="122" r="6.5" fill="#9A3412"/>

        <!-- Coral Frustrated Triangle -->
        <polygon points="120,200 80,230 160,230" fill="#FECDD3" stroke="#FDA4AF" stroke-width="2"/>
        <path d="M110 218 L116 222 M116 218 L110 222" stroke="#9F1239" stroke-width="2" stroke-linecap="round"/>
        <path d="M124 218 L130 222 M130 218 L124 222" stroke="#9F1239" stroke-width="2" stroke-linecap="round"/>

        <!-- Yellow Sparkle Star -->
        <path d="M260 30 L264 48 L282 52 L264 56 L260 74 L256 56 L238 52 L256 48 Z" fill="#FEF08A" stroke="#FDE047" stroke-width="2"/>
      </svg>
    </div>

    <div class="text-center pb-4">
      <span class="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
        XI-F2 SMA Kartika XIX-1 Bandung
      </span>
      <p class="text-xs text-slate-400 mt-2">Geser untuk masuk ke dashboard kas →</p>
    </div>
  </div></body></html>`;
}

// SCREEN 2: MAIN DASHBOARD
function getHtmlDashboard() {
  return `<!DOCTYPE html><html><head>${CSS_COMMON}</head><body>
  <div class="phone-container justify-between bg-slate-900 text-white">
    <div class="phone-notch"></div>
    
    <!-- White Header Card -->
    <div class="bg-white text-slate-900 p-6 pt-10 rounded-b-4xl shadow-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-violet-200 border border-violet-300 flex items-center justify-center font-fredoka font-bold text-violet-950 text-base shadow-xs">
            AS
          </div>
          <div>
            <span class="text-[11px] text-slate-400 font-medium block">Selamat datang,</span>
            <h3 class="font-fredoka font-bold text-slate-900 text-sm leading-tight">Ardellio Satria</h3>
          </div>
        </div>
        <span class="text-[11px] text-slate-400 font-medium">11 Sep 2026</span>
      </div>

      <h2 class="text-base font-fredoka font-bold text-slate-900 mt-4 leading-snug">
        Halo Ardellio! Bagaimana kondisi kas kelas hari ini?
      </h2>

      <!-- Mood Kas Selector Bar -->
      <div class="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100">
        <div class="p-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <span class="text-lg block">😊</span>
          <span class="text-[10px] font-bold text-emerald-900 mt-0.5 block">Aman</span>
        </div>
        <div class="p-2 rounded-2xl bg-orange-50 border border-orange-200 text-center">
          <span class="text-lg block">😴</span>
          <span class="text-[10px] font-bold text-orange-950 mt-0.5 block">Tagihan</span>
        </div>
        <div class="p-2 rounded-2xl bg-violet-50 border border-violet-200 text-center">
          <span class="text-lg block">😡</span>
          <span class="text-[10px] font-bold text-violet-950 mt-0.5 block">Nunggak</span>
        </div>
        <div class="p-2 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <span class="text-lg block">🚀</span>
          <span class="text-[10px] font-bold text-amber-950 mt-0.5 block">Surplus</span>
        </div>
      </div>
    </div>

    <!-- Dark Navy Body Content -->
    <div class="p-5 flex-1 flex flex-col justify-around">
      
      <!-- Mini Widgets Row -->
      <div class="grid grid-cols-2 gap-3.5">
        
        <!-- Peach Sleep / Saldo Card -->
        <div class="bg-[#FED7AA] text-slate-900 p-4 rounded-3xl shadow-sm">
          <span class="text-xs font-bold text-orange-950 flex items-center gap-1.5">⏱️ Kas Masuk</span>
          <div class="my-2.5 flex items-end gap-1.5 h-10">
            <div class="w-2 bg-orange-400 rounded-full h-5"></div>
            <div class="w-2 bg-orange-500 rounded-full h-8"></div>
            <div class="w-2 bg-orange-400 rounded-full h-4"></div>
            <div class="w-2 bg-orange-600 rounded-full h-10"></div>
            <div class="w-2 bg-orange-500 rounded-full h-7"></div>
          </div>
          <div>
            <div class="text-lg font-fredoka font-bold text-slate-900">+Rp 100k</div>
            <span class="text-[10px] text-orange-900 font-medium">Minggu ke-1</span>
          </div>
        </div>

        <!-- Lilac Stress / Disiplin Card -->
        <div class="bg-[#DDD6FE] text-slate-900 p-4 rounded-3xl shadow-sm">
          <span class="text-xs font-bold text-violet-950 flex items-center gap-1.5">📊 Kedisiplinan</span>
          <div class="my-2.5 flex items-end gap-1.5 h-10">
            <div class="w-2.5 bg-violet-300 rounded-md h-3"></div>
            <div class="w-2.5 bg-violet-400 rounded-md h-5"></div>
            <div class="w-2.5 bg-violet-500 rounded-md h-7"></div>
            <div class="w-2.5 bg-violet-600 rounded-md h-10"></div>
          </div>
          <div>
            <div class="text-lg font-fredoka font-bold text-violet-950">Tinggi</div>
            <span class="text-[10px] text-violet-800 font-medium">83.3% Lunas</span>
          </div>
        </div>

      </div>

      <!-- Mint Green Interactive Voting Card -->
      <div class="bg-[#BBF7D0] text-slate-900 p-4 rounded-3xl shadow-sm border border-emerald-300">
        <div class="flex items-center justify-between text-[11px] font-bold text-emerald-950 mb-1.5">
          <span class="flex items-center gap-1">📝 Diskusi Kas</span>
          <span class="bg-white/80 px-2 py-0.5 rounded-full text-[10px]">1/3</span>
        </div>
        <p class="font-fredoka font-bold text-xs text-slate-900 leading-snug">
          "Apakah saldo kas operasional (Rp 110.000) cukup untuk beli spidol & alat pel?"
        </p>
        <div class="flex gap-2 mt-3">
          <button class="flex-1 bg-slate-900 text-white font-bold py-2 rounded-xl text-xs">Cukup (Ya)</button>
          <button class="flex-1 bg-white text-slate-900 font-bold py-2 rounded-xl text-xs border border-emerald-300">Perlu Iuran</button>
        </div>
      </div>

    </div>

    <!-- Bottom Navigation Bar -->
    <div class="bg-slate-950 px-8 py-3.5 border-t border-slate-800 flex items-center justify-around text-slate-400 text-base">
      <span class="text-white">🏠</span>
      <span>📊</span>
      <span>📅</span>
      <span>👤</span>
    </div>

  </div></body></html>`;
}

// SCREEN 3: ALOKASI POS DANA KAS
function getHtmlAlokasi() {
  return `<!DOCTYPE html><html><head>${CSS_COMMON}</head><body>
  <div class="phone-container justify-between bg-white text-slate-900">
    <div class="phone-notch"></div>

    <div class="p-6 pt-10">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-4">
        <span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">‹</span>
        <div class="text-center">
          <h2 class="font-fredoka font-bold text-base text-slate-900">Alokasi Kas Kelas</h2>
          <span class="text-[11px] text-slate-400 font-medium">Kelas XI-F2</span>
        </div>
        <span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">⚙️</span>
      </div>

      <!-- Main Balance Pill Card -->
      <div class="bg-slate-900 text-white p-5 rounded-3xl shadow-md my-4">
        <span class="text-[11px] text-slate-400 block font-medium">Total Kas Terkumpul</span>
        <div class="text-3xl font-fredoka font-bold text-white mt-1">Rp 160.000</div>
        <div class="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 font-semibold">
          <span>●</span>
          <span>Surplus 100% Real-Time Firestore</span>
        </div>
      </div>

      <!-- Bento Pockets Grid -->
      <div class="space-y-3 mt-4">
        <!-- Pocket 1: Operasional -->
        <div class="bg-[#BBF7D0] p-4 rounded-3xl border border-emerald-300 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-lg">🧹</span>
            <div>
              <h4 class="font-fredoka font-bold text-sm text-emerald-950">Operasional & KBM</h4>
              <span class="text-[11px] text-emerald-800">Spidol, penghapus, alat kebersihan</span>
            </div>
          </div>
          <div class="text-right">
            <div class="font-fredoka font-bold text-sm text-emerald-950">Rp 110.000</div>
            <span class="text-[10px] font-bold text-emerald-800">68.8%</span>
          </div>
        </div>

        <!-- Pocket 2: Sosial -->
        <div class="bg-[#DDD6FE] p-4 rounded-3xl border border-violet-300 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-lg">🤝</span>
            <div>
              <h4 class="font-fredoka font-bold text-sm text-violet-950">Sosial & Peduli</h4>
              <span class="text-[11px] text-violet-800">Menjenguk siswa sakit, santunan</span>
            </div>
          </div>
          <div class="text-right">
            <div class="font-fredoka font-bold text-sm text-violet-950">Rp 50.000</div>
            <span class="text-[10px] font-bold text-violet-800">31.2%</span>
          </div>
        </div>

        <!-- Pocket 3: Acara -->
        <div class="bg-[#FED7AA] p-4 rounded-3xl border border-orange-300 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-lg">🎪</span>
            <div>
              <h4 class="font-fredoka font-bold text-sm text-orange-950">Acara & Event</h4>
              <span class="text-[11px] text-orange-800">Tabungan bukber & perpisahan</span>
            </div>
          </div>
          <div class="text-right">
            <div class="font-fredoka font-bold text-sm text-orange-950">Rp 0</div>
            <span class="text-[10px] font-bold text-orange-800">0.0%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Nav -->
    <div class="bg-slate-950 px-8 py-3.5 border-t border-slate-800 flex items-center justify-around text-slate-400 text-base">
      <span>🏠</span>
      <span class="text-white">📊</span>
      <span>📅</span>
      <span>👤</span>
    </div>

  </div></body></html>`;
}

// SCREEN 4: KAS CALENDAR & MUTASI
function getHtmlCalendar() {
  return `<!DOCTYPE html><html><head>${CSS_COMMON}</head><body>
  <div class="phone-container justify-between bg-white text-slate-900">
    <div class="phone-notch"></div>

    <div class="p-6 pt-10">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-4">
        <span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">‹</span>
        <div class="text-center">
          <h2 class="font-fredoka font-bold text-base text-slate-900">Kalender Kas</h2>
          <span class="text-[11px] text-slate-400 font-medium">September 2026</span>
        </div>
        <span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🔍</span>
      </div>

      <!-- Calendar Days Header -->
      <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mt-4 mb-1">
        <div>S</div><div>S</div><div>R</div><div>K</div><div>J</div><div>S</div><div>M</div>
      </div>

      <!-- Calendar Grid of Days -->
      <div class="grid grid-cols-7 gap-1 text-center text-xs">
        <div class="p-2 rounded-xl bg-slate-50 text-slate-300">31</div>
        <div class="p-2 rounded-xl bg-[#BBF7D0] text-emerald-950 font-bold">1</div>
        <div class="p-2 rounded-xl bg-slate-50">2</div>
        <div class="p-2 rounded-xl bg-[#FED7AA] text-orange-950 font-bold">3</div>
        <div class="p-2 rounded-xl bg-[#BBF7D0] text-emerald-950 font-bold">4</div>
        <div class="p-2 rounded-xl bg-slate-50">5</div>
        <div class="p-2 rounded-xl bg-slate-50">6</div>
        <div class="p-2 rounded-xl bg-[#DDD6FE] text-violet-950 font-bold">7</div>
        <div class="p-2 rounded-xl bg-[#BBF7D0] text-emerald-950 font-bold">8</div>
        <div class="p-2 rounded-xl bg-slate-50">9</div>
        <div class="p-2 rounded-xl bg-slate-50">10</div>
        <div class="p-2 rounded-xl bg-[#FEF08A] text-amber-950 font-bold ring-2 ring-amber-400">11</div>
        <div class="p-2 rounded-xl bg-slate-50">12</div>
        <div class="p-2 rounded-xl bg-slate-50">13</div>
      </div>

      <!-- Monthly Kas Summary Card (Light Mint Card like Right Screen) -->
      <div class="mt-5 bg-[#BBF7D0] border border-emerald-200 p-4 rounded-3xl flex items-center gap-3">
        <span class="text-3xl">😌</span>
        <div>
          <span class="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Status Bulanan</span>
          <h4 class="font-fredoka font-bold text-emerald-950 text-sm">Kas Sehat & Transparan</h4>
          <p class="text-[11px] text-emerald-800 leading-tight mt-0.5">Semua pemasukan & pengeluaran tercatat rapi tanpa selisih.</p>
        </div>
      </div>

      <!-- Activity Metrics Pills -->
      <div class="grid grid-cols-3 gap-2 mt-4">
        <div class="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
          <span class="text-[9px] text-slate-400 block font-medium">Terkumpul</span>
          <span class="font-fredoka font-bold text-xs text-slate-900">Rp 300k</span>
        </div>
        <div class="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
          <span class="text-[9px] text-slate-400 block font-medium">Pengeluaran</span>
          <span class="font-fredoka font-bold text-xs text-slate-900">Rp 140k</span>
        </div>
        <div class="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
          <span class="text-[9px] text-slate-400 block font-medium">Lunas</span>
          <span class="font-fredoka font-bold text-xs text-emerald-600">83.3%</span>
        </div>
      </div>

    </div>

    <!-- Bottom Nav -->
    <div class="bg-slate-950 px-8 py-3.5 border-t border-slate-800 flex items-center justify-around text-slate-400 text-base">
      <span>🏠</span>
      <span>📊</span>
      <span class="text-white">📅</span>
      <span>👤</span>
    </div>

  </div></body></html>`;
}

// SCREEN 5: TAGIHAN & IURAN SISWA
function getHtmlTagihan() {
  return `<!DOCTYPE html><html><head>${CSS_COMMON}</head><body>
  <div class="phone-container justify-between bg-white text-slate-900">
    <div class="phone-notch"></div>

    <div class="p-6 pt-10">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-3">
        <span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">‹</span>
        <div class="text-center">
          <h2 class="font-fredoka font-bold text-base text-slate-900">Tagihan Kas Siswa</h2>
          <span class="text-[11px] text-slate-400 font-medium">Minggu ke-1 (Rp 10.000)</span>
        </div>
        <span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">📋</span>
      </div>

      <!-- Status Progress Bar -->
      <div class="bg-[#BBF7D0] p-4 rounded-3xl border border-emerald-300 my-3">
        <div class="flex items-center justify-between text-xs font-bold text-emerald-950">
          <span>Progres Iuran Kelas</span>
          <span>83.3% Lunas</span>
        </div>
        <div class="w-full bg-emerald-200 rounded-full h-2.5 mt-2 overflow-hidden">
          <div class="bg-emerald-600 h-2.5 rounded-full w-[83.3%]"></div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-emerald-900 mt-2 font-medium">
          <span>30 Siswa Lunas</span>
          <span>6 Belum Bayar</span>
        </div>
      </div>

      <!-- Student Checklist List -->
      <div class="space-y-2 mt-4">
        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[#BBF7D0] text-emerald-950 flex items-center justify-center text-[10px] font-bold">✓</span>
            <div>
              <div class="font-bold text-xs text-slate-900">Ardellio Satria Anindito</div>
              <div class="text-[10px] text-slate-400">NIS: 23241001</div>
            </div>
          </div>
          <span class="text-xs font-bold text-emerald-600">Lunas</span>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[#BBF7D0] text-emerald-950 flex items-center justify-center text-[10px] font-bold">✓</span>
            <div>
              <div class="font-bold text-xs text-slate-900">Tarina</div>
              <div class="text-[10px] text-slate-400">NIS: 23241015 (Bendahara)</div>
            </div>
          </div>
          <span class="text-xs font-bold text-emerald-600">Lunas</span>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[#BBF7D0] text-emerald-950 flex items-center justify-center text-[10px] font-bold">✓</span>
            <div>
              <div class="font-bold text-xs text-slate-900">Nabila</div>
              <div class="text-[10px] text-slate-400">NIS: 23241020</div>
            </div>
          </div>
          <span class="text-xs font-bold text-emerald-600">Lunas</span>
        </div>

        <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-rose-200 text-rose-950 flex items-center justify-center text-[10px] font-bold">!</span>
            <div>
              <div class="font-bold text-xs text-slate-900">Dwi Cahyo</div>
              <div class="text-[10px] text-slate-400">NIS: 23241008</div>
            </div>
          </div>
          <span class="text-xs font-bold text-rose-600">Belum Bayar</span>
        </div>

        <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-rose-200 text-rose-950 flex items-center justify-center text-[10px] font-bold">!</span>
            <div>
              <div class="font-bold text-xs text-slate-900">Gita Pratiwi</div>
              <div class="text-[10px] text-slate-400">NIS: 23241018</div>
            </div>
          </div>
          <span class="text-xs font-bold text-rose-600">Belum Bayar</span>
        </div>
      </div>
    </div>

    <!-- Bottom Nav -->
    <div class="bg-slate-950 px-8 py-3.5 border-t border-slate-800 flex items-center justify-around text-slate-400 text-base">
      <span>🏠</span>
      <span>📊</span>
      <span>📅</span>
      <span class="text-white">👤</span>
    </div>

  </div></body></html>`;
}

// SCREEN 6: 3-PHONE SHOWCASE PANORAMA
function getHtmlShowcaseTrio() {
  return `<!DOCTYPE html><html><head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #EEF2F6; margin: 0; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .font-fredoka { font-family: 'Fredoka', cursive; }
    .phone-mockup {
      width: 360px;
      height: 740px;
      border-radius: 44px;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.22), 0 0 0 10px #0f172a, 0 0 0 12px #334155;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .phone-notch {
      width: 120px;
      height: 22px;
      background: #0F172A;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-left-radius: 14px;
      border-bottom-right-radius: 14px;
      z-index: 50;
    }
  </style>
</head><body>
  <div class="flex items-center justify-center gap-10">
    
    <!-- LEFT PHONE: ONBOARDING -->
    <div class="phone-mockup bg-white p-6 pt-9 justify-between">
      <div class="phone-notch"></div>
      <div class="mt-6 text-center">
        <h2 class="text-3xl font-fredoka font-bold text-slate-900 leading-tight">
          Bingung Soal Kas Kelas Kamu?
        </h2>
        <div class="mt-5 flex justify-center">
          <div class="bg-slate-100 border border-slate-200 rounded-full p-2 pl-5 flex items-center justify-between gap-4 text-xs font-bold text-slate-800 shadow-xs">
            <span>Biar CEKAS Bantu!</span>
            <span class="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">→</span>
          </div>
        </div>
      </div>
      <div class="my-auto flex justify-center">
        <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
          <circle cx="65" cy="110" r="40" fill="#BBF7D0" stroke="#86EFAC" stroke-width="3"/>
          <path d="M52 105 C57 98 64 98 69 105" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
          <path d="M73 105 C78 98 85 98 90 105" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
          <path d="M64 122 C68 126 74 126 78 122" stroke="#166534" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="140" cy="85" r="38" fill="#DDD6FE" stroke="#C4B5FD" stroke-width="3"/>
          <circle cx="128" cy="80" r="4.5" fill="#5B21B6"/>
          <circle cx="150" cy="78" r="5" fill="#5B21B6"/>
          <path d="M132 98 Q140 92 148 98" stroke="#5B21B6" stroke-width="3" fill="none" stroke-linecap="round"/>
          <rect x="180" y="65" width="58" height="58" rx="20" fill="#FED7AA" stroke="#FDBA74" stroke-width="3"/>
          <line x1="192" y1="85" x2="202" y2="88" stroke="#9A3412" stroke-width="3" stroke-linecap="round"/>
          <line x1="225" y1="85" x2="215" y2="88" stroke="#9A3412" stroke-width="3" stroke-linecap="round"/>
          <circle cx="208" cy="102" r="5.5" fill="#9A3412"/>
          <path d="M228 25 L232 40 L248 44 L232 48 L228 64 L224 48 L208 44 L224 40 Z" fill="#FEF08A" stroke="#FDE047" stroke-width="2"/>
        </svg>
      </div>
      <div class="text-center text-xs text-slate-400 mb-2">
        XI-F2 SMA Kartika XIX-1 Bandung
      </div>
    </div>

    <!-- MIDDLE PHONE: HOME DASHBOARD -->
    <div class="phone-mockup bg-slate-900 text-white justify-between">
      <div class="phone-notch"></div>
      <div class="bg-white text-slate-900 p-5 pt-8 rounded-b-4xl shadow-md">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center font-fredoka font-bold text-xs text-violet-950">AS</div>
            <div>
              <span class="text-[10px] text-slate-400 font-medium">Selamat datang,</span>
              <h4 class="font-fredoka font-bold text-xs text-slate-900">Ardellio Satria</h4>
            </div>
          </div>
          <span class="text-[10px] text-slate-400 font-medium">11 Sep 2026</span>
        </div>
        <h3 class="text-sm font-fredoka font-bold text-slate-900 mt-3">Halo Ardellio! Bagaimana kondisi kas kelas hari ini?</h3>
        <div class="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-slate-100">
          <div class="p-1.5 rounded-xl bg-emerald-50 text-center"><span class="text-base block">😊</span><span class="text-[9px] font-bold text-emerald-900">Aman</span></div>
          <div class="p-1.5 rounded-xl bg-orange-50 text-center"><span class="text-base block">😴</span><span class="text-[9px] font-bold text-orange-950">Tagihan</span></div>
          <div class="p-1.5 rounded-xl bg-violet-50 text-center"><span class="text-base block">😡</span><span class="text-[9px] font-bold text-violet-950">Nunggak</span></div>
          <div class="p-1.5 rounded-xl bg-amber-50 text-center"><span class="text-base block">🚀</span><span class="text-[9px] font-bold text-amber-950">Surplus</span></div>
        </div>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-around">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-[#FED7AA] text-slate-900 p-3.5 rounded-3xl">
            <span class="text-[10px] font-bold text-orange-950">⏱️ Kas Masuk</span>
            <div class="my-2 flex items-end gap-1 h-7">
              <div class="w-1.5 bg-orange-400 rounded-full h-4"></div>
              <div class="w-1.5 bg-orange-500 rounded-full h-7"></div>
              <div class="w-1.5 bg-orange-400 rounded-full h-3"></div>
              <div class="w-1.5 bg-orange-600 rounded-full h-8"></div>
            </div>
            <div class="text-sm font-fredoka font-bold">+Rp 100k</div>
          </div>
          <div class="bg-[#DDD6FE] text-slate-900 p-3.5 rounded-3xl">
            <span class="text-[10px] font-bold text-violet-950">📊 Disiplin</span>
            <div class="my-2 flex items-end gap-1 h-7">
              <div class="w-2 bg-violet-300 rounded-md h-2"></div>
              <div class="w-2 bg-violet-400 rounded-md h-4"></div>
              <div class="w-2 bg-violet-500 rounded-md h-6"></div>
              <div class="w-2 bg-violet-600 rounded-md h-8"></div>
            </div>
            <div class="text-sm font-fredoka font-bold">83.3%</div>
          </div>
        </div>
        <div class="bg-[#BBF7D0] text-slate-900 p-3.5 rounded-3xl">
          <div class="flex items-center justify-between text-[10px] font-bold text-emerald-950 mb-1">
            <span>📝 Diskusi Kas</span><span>1/3</span>
          </div>
          <p class="font-fredoka font-bold text-xs text-slate-900">Apakah saldo kas operasional cukup untuk beli spidol & pel?</p>
          <div class="flex gap-2 mt-2.5">
            <button class="flex-1 bg-slate-900 text-white font-bold py-1.5 rounded-xl text-[10px]">Ya</button>
            <button class="flex-1 bg-white text-slate-900 font-bold py-1.5 rounded-xl text-[10px] border border-emerald-300">Tidak</button>
          </div>
        </div>
      </div>
      <div class="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-around text-slate-400 text-sm">
        <span class="text-white">🏠</span><span>📊</span><span>📅</span><span>👤</span>
      </div>
    </div>

    <!-- RIGHT PHONE: MOOD CALENDAR -->
    <div class="phone-mockup bg-white p-5 pt-8 justify-between">
      <div class="phone-notch"></div>
      <div>
        <div class="flex items-center justify-between">
          <span class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs">‹</span>
          <div class="text-center">
            <h4 class="font-fredoka font-bold text-sm text-slate-900">Kalender Kas</h4>
            <span class="text-[10px] text-slate-400 font-medium">September 2026</span>
          </div>
          <span class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs">🔍</span>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mt-4 mb-1">
          <div>S</div><div>S</div><div>R</div><div>K</div><div>J</div><div>S</div><div>M</div>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-[10px]">
          <div class="p-1.5 rounded-lg bg-slate-50 text-slate-300">31</div>
          <div class="p-1.5 rounded-lg bg-[#BBF7D0] text-emerald-950 font-bold">1</div>
          <div class="p-1.5 rounded-lg bg-slate-50">2</div>
          <div class="p-1.5 rounded-lg bg-[#FED7AA] text-orange-950 font-bold">3</div>
          <div class="p-1.5 rounded-lg bg-[#BBF7D0] text-emerald-950 font-bold">4</div>
          <div class="p-1.5 rounded-lg bg-slate-50">5</div>
          <div class="p-1.5 rounded-lg bg-slate-50">6</div>
          <div class="p-1.5 rounded-lg bg-[#DDD6FE] text-violet-950 font-bold">7</div>
          <div class="p-1.5 rounded-lg bg-[#BBF7D0] text-emerald-950 font-bold">8</div>
          <div class="p-1.5 rounded-lg bg-slate-50">9</div>
          <div class="p-1.5 rounded-lg bg-slate-50">10</div>
          <div class="p-1.5 rounded-lg bg-[#FEF08A] text-amber-950 font-bold ring-2 ring-amber-400">11</div>
          <div class="p-1.5 rounded-lg bg-slate-50">12</div>
          <div class="p-1.5 rounded-lg bg-slate-50">13</div>
        </div>
        <div class="mt-4 bg-[#BBF7D0] border border-emerald-200 p-3.5 rounded-3xl flex items-center gap-2.5">
          <span class="text-2xl">😌</span>
          <div>
            <span class="text-[9px] font-bold text-emerald-800 uppercase">Status Kas</span>
            <h5 class="font-fredoka font-bold text-emerald-950 text-xs">Kas Sehat & Surplus</h5>
            <p class="text-[10px] text-emerald-800">Transparansi 100% terjaga.</p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-1.5 mt-3">
          <div class="bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center"><span class="text-[8px] text-slate-400 block">Terkumpul</span><span class="font-fredoka font-bold text-[11px] text-slate-900">Rp 300k</span></div>
          <div class="bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center"><span class="text-[8px] text-slate-400 block">Pengeluaran</span><span class="font-fredoka font-bold text-[11px] text-slate-900">Rp 140k</span></div>
          <div class="bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center"><span class="text-[8px] text-slate-400 block">Lunas</span><span class="font-fredoka font-bold text-[11px] text-emerald-600">83.3%</span></div>
        </div>
      </div>
      <div class="bg-slate-950 -mx-5 -mb-5 px-6 py-3 flex items-center justify-around text-slate-400 text-sm">
        <span>🏠</span><span>📊</span><span class="text-white">📅</span><span>👤</span>
      </div>
    </div>

  </div>
</body></html>`;
}

// --------------------------------------------------------------------------
// HTML TEMPLATE FOR END-TO-END FLOWCHART (BAHASA INDONESIA)
// --------------------------------------------------------------------------
function getHtmlFlowchart() {
  return `<!DOCTYPE html><html><head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0F172A; color: white; margin: 0; padding: 50px; display: flex; justify-content: center; }
    .font-fredoka { font-family: 'Fredoka', cursive; }
    .node-box {
      border-radius: 20px;
      padding: 16px 22px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
      border: 1.5px solid rgba(255,255,255,0.15);
      position: relative;
    }
    .node-start { background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; }
    .node-decision { background: #1E293B; border-color: #F59E0B; }
    .node-process { background: #1E293B; border-color: #38BDF8; }
    .node-bendahara { background: #1E293B; border-color: #A855F7; }
    .node-siswa { background: #1E293B; border-color: #10B981; }
    .node-db { background: linear-gradient(135deg, #1E293B, #0F172A); border-color: #FB923C; }
    .node-end { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border: none; }
    .flow-line { width: 3px; height: 32px; background: #64748B; margin: 0 auto; position: relative; }
    .flow-line::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: -4px;
      width: 11px;
      height: 11px;
      border-bottom: 3px solid #64748B;
      border-right: 3px solid #64748B;
      transform: rotate(45deg);
    }
  </style>
</head><body>

  <div class="max-w-4xl w-full">
    
    <!-- Title Card -->
    <div class="text-center mb-10 pb-6 border-b border-slate-800">
      <div class="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 mb-3">
        DIAGRAM ALIR SISTEM INFORMASI (FLOWCHART)
      </div>
      <h1 class="text-3xl font-fredoka font-bold text-white tracking-tight">
        Alur Logika & Transparansi Aplikasi CEKAS
      </h1>
      <p class="text-sm text-slate-400 mt-2">
        Kelas XI-F2 SMA Kartika XIX-1 Bandung • Ekosistem Bot Telegram + Cloud Firestore + Web Dashboard
      </p>
    </div>

    <!-- Flow Steps -->
    <div class="flex flex-col items-center space-y-4">

      <!-- Step 1: MULAI -->
      <div class="node-box node-start font-fredoka font-bold text-lg px-8 py-3 rounded-full flex items-center gap-2">
        <span>▶️</span> MULAI
      </div>

      <div class="flow-line"></div>

      <!-- Step 2: AKSES PLATFORM -->
      <div class="node-box node-process text-center w-96">
        <div class="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Pintu Masuk Pengguna</div>
        <div class="font-bold text-sm text-white">Siswa / Bendahara Membuka Bot Telegram (@kacekasbot) atau Web</div>
      </div>

      <div class="flow-line"></div>

      <!-- Step 3: CEK STATUS PENDAFTARAN -->
      <div class="node-box node-decision text-center w-[460px]">
        <div class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Keputusan 1</div>
        <div class="font-bold text-base text-white">Apakah ID Telegram Sudah Terdaftar di Whitelist NIS?</div>
      </div>

      <!-- Branching: Tidak vs Ya -->
      <div class="w-full flex justify-between gap-8 pt-2">
        
        <!-- Sisi Kiri: BELUM TERDAFTAR -->
        <div class="flex-1 flex flex-col items-center">
          <div class="text-xs font-bold text-rose-400 mb-2">❌ TIDAK / BELUM</div>
          <div class="flow-line"></div>
          
          <div class="node-box bg-slate-900 border-rose-500 text-center w-full mt-2">
            <div class="text-xs text-rose-400 font-bold">Kirim Command:</div>
            <div class="text-sm font-bold text-white mt-1">/daftar [NIS] [Nama Lengkap]</div>
            <p class="text-[11px] text-slate-400 mt-1">Sistem memvalidasi NIS ke koleksi whitelist_students XI-F2</p>
          </div>

          <div class="flow-line"></div>

          <div class="node-box bg-slate-900 border-amber-500 text-center w-full">
            <div class="text-xs text-amber-400 font-bold">Validasi Whitelist:</div>
            <div class="text-xs text-white mt-1">Jika NIS Cocok & Belum Diklaim: Tautkan Akun ✅</div>
            <div class="text-xs text-rose-300 mt-0.5">Jika NIS Tidak Dikenal: Tolak ⛔</div>
          </div>
        </div>

        <!-- Sisi Kanan: SUDAH TERDAFTAR -->
        <div class="flex-1 flex flex-col items-center">
          <div class="text-xs font-bold text-emerald-400 mb-2">✅ YA / TERDAFTAR RESMI</div>
          <div class="flow-line"></div>

          <div class="node-box bg-slate-900 border-emerald-500 text-center w-full mt-2">
            <div class="text-xs text-emerald-400 font-bold">Otentikasi Berhasil:</div>
            <div class="text-sm font-bold text-white mt-1">Akun Terhubung Sebagai Siswa / Bendahara</div>
            <p class="text-[11px] text-slate-400 mt-1">Preferensi push notifikasi solo aktif</p>
          </div>

          <div class="flow-line"></div>

          <div class="node-box node-decision text-center w-full">
            <div class="text-xs text-purple-400 font-bold">Pemeriksaan Peran (RBAC):</div>
            <div class="text-xs text-white mt-1">Apakah Pengguna Memiliki Role Bendahara?</div>
          </div>
        </div>

      </div>

      <!-- Merge Point: Menu Peran -->
      <div class="w-full pt-6 border-t border-slate-800">
        <div class="grid grid-cols-2 gap-6">
          
          <!-- Menu Siswa -->
          <div class="node-box node-siswa">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-emerald-800/60">
              <span class="font-fredoka font-bold text-emerald-400 text-sm">👤 MENU SEMUA SISWA</span>
              <span class="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Read-Only</span>
            </div>
            <ul class="text-xs space-y-1.5 text-slate-300">
              <li>• <code class="text-emerald-300 font-bold">/saldo</code>: Saldo total & ringkasan pos</li>
              <li>• <code class="text-emerald-300 font-bold">/alokasi</code>: Rincian pos Operasional, Sosial, Event</li>
              <li>• <code class="text-emerald-300 font-bold">/tagihan</code>: Rekap siapa sudah bayar vs nunggak</li>
              <li>• <code class="text-emerald-300 font-bold">/riwayat</code>: 10 transaksi kas terakhir</li>
              <li>• <code class="text-emerald-300 font-bold">/notif [on/off]</code>: Atur notifikasi personal</li>
            </ul>
          </div>

          <!-- Menu Bendahara -->
          <div class="node-box node-bendahara">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-purple-800/60">
              <span class="font-fredoka font-bold text-purple-400 text-sm">🔑 MENU KHUSUS BENDAHARA</span>
              <span class="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full font-bold">Write Access</span>
            </div>
            <ul class="text-xs space-y-1.5 text-slate-300">
              <li>• <code class="text-purple-300 font-bold">/tambah [nom] [pos] [ket]</code>: Input kas masuk</li>
              <li>• <code class="text-purple-300 font-bold">/kurang [nom] [pos] [ket]</code>: Input kas keluar</li>
              <li>• <code class="text-purple-300 font-bold">/bayar [NIS] [m?]</code>: Tandai iuran lunas</li>
              <li>• <code class="text-purple-300 font-bold">/koreksi [id] [alasan]</code>: Append-only reversal</li>
              <li>• <code class="text-purple-300 font-bold">/klaimbendahara [PIN]</code>: Aktivasi role bendahara</li>
            </ul>
          </div>

        </div>
      </div>

      <div class="flow-line"></div>

      <!-- Step 4: IDEMPOTENCY & TRANSAKSI ATOMIK -->
      <div class="node-box node-db text-center w-[500px]">
        <div class="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Backend & Database Engine</div>
        <div class="font-bold text-base text-white">Eksekusi Transaksi Atomik di Google Cloud Firestore</div>
        <div class="text-xs text-slate-300 mt-2 space-y-0.5">
          <div>1. Validasi Idempotency (cegah klik ganda dalam 5 detik)</div>
          <div>2. Update Saldo Total + Saldo Pos Alokasi (Atomic Lock)</div>
          <div>3. Simpan Dokumen Riwayat Mutasi ke <code>classes/XI-F2/transactions</code></div>
        </div>
      </div>

      <div class="flow-line"></div>

      <!-- Step 5: BROADCAST SOLO DIRECT NOTIFICATION -->
      <div class="node-box bg-slate-900 border-sky-400 text-center w-[460px]">
        <div class="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Otomasi Notifikasi Solo</div>
        <div class="font-bold text-sm text-white">Bot Mengirim Push Notification (DM) ke Seluruh Siswa Terdaftar</div>
        <p class="text-[11px] text-slate-400 mt-1">Setiap siswa menerima rincian uang masuk/keluar langsung di HP tanpa perlu grup</p>
      </div>

      <div class="flow-line"></div>

      <!-- Step 6: WEB DASHBOARD VISUALISASI -->
      <div class="node-box bg-slate-900 border-slate-700 text-center w-96">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Visualisasi & Laporan</div>
        <div class="font-bold text-sm text-white">Dashboard Web Terupdate Real-Time</div>
        <p class="text-[11px] text-slate-400 mt-1">Bento Grid, Kalender Kas, & Matriks Siswa sinkron otomatis</p>
      </div>

      <div class="flow-line"></div>

      <!-- Step 7: SELESAI -->
      <div class="node-box node-end font-fredoka font-bold text-lg px-8 py-3 rounded-full flex items-center gap-2">
        <span>⏹️</span> SELESAI
      </div>

    </div>

  </div>

</body></html>`;
}

// --------------------------------------------------------------------------
// RENDER PAGES TO HIGH-RES PNG USING HEADLESS EDGE
// --------------------------------------------------------------------------

const pagesToRender = [
  { name: "screen_01_onboarding", fn: getHtmlOnboarding, width: 480, height: 920 },
  { name: "screen_02_dashboard", fn: getHtmlDashboard, width: 480, height: 920 },
  { name: "screen_03_alokasi", fn: getHtmlAlokasi, width: 480, height: 920 },
  { name: "screen_04_calendar_riwayat", fn: getHtmlCalendar, width: 480, height: 920 },
  { name: "screen_05_tagihan_siswa", fn: getHtmlTagihan, width: 480, height: 920 },
  { name: "showcase_3phones_presentation", fn: getHtmlShowcaseTrio, width: 1360, height: 900 },
  { name: "flowchart_cekas_sistem", fn: getHtmlFlowchart, width: 1080, height: 1850 },
];

async function generateAll() {
  console.log("==================================================");
  console.log("🎨 Generating CEKAS Showcase Screens & Flowchart...");
  console.log("==================================================");

  for (const page of pagesToRender) {
    const tempHtmlPath = path.join(OUTPUT_DIR, `${page.name}.html`);
    const outputPngPath = path.join(OUTPUT_DIR, `${page.name}.png`);

    // Write temp html
    fs.writeFileSync(tempHtmlPath, page.fn(), "utf8");

    console.log(`⏳ Rendering ${page.name}.png (${page.width}x${page.height})...`);
    
    // Execute headless Edge
    const cmd = `"${EDGE_PATH}" --headless --disable-gpu --screenshot="${outputPngPath}" --window-size=${page.width},${page.height} "${tempHtmlPath}"`;
    try {
      execSync(cmd, { stdio: "ignore" });
      const stats = fs.statSync(outputPngPath);
      console.log(`  ✅ Done: ${page.name}.png (${Math.round(stats.size / 1024)} KB)`);
    } catch (err) {
      console.error(`  ❌ Failed to render ${page.name}:`, err.message);
    }
  }

  console.log("\n🎉 All Showcase Screens & Flowchart generated successfully!");
  console.log(`Location: ${OUTPUT_DIR}\n`);
}

generateAll();
