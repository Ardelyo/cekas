import React, { useState } from 'react';

interface MascotCharacterInfo {
  id: string;
  name: string;
  quote: string;
  tag: string;
  color: string;
  textColor: string;
}

const MASCOT_CHARACTERS: MascotCharacterInfo[] = [
  {
    id: 'mint',
    name: 'Si Hijau Aman',
    quote: 'Kas kelas dalam kondisi sangat sehat dan surplus Rp 160.000!',
    tag: 'Status: Surplus',
    color: '#B8FFA9',
    textColor: '#0F172A',
  },
  {
    id: 'lavender',
    name: 'Si Ungu Spiral',
    quote: 'Saya memvalidasi rekonsiliasi saldo agar tidak terjadi selisih satu rupiah pun!',
    tag: 'Status: Audit Presisi',
    color: '#EACEFF',
    textColor: '#0F172A',
  },
  {
    id: 'peach',
    name: 'Si Oranye Waspada',
    quote: 'Ada 2 siswa yang belum melunasi iuran minggu ini. Yuk segera diselesaikan!',
    tag: 'Status: 2 Nunggak',
    color: '#FFC6A8',
    textColor: '#0F172A',
  },
  {
    id: 'lemon',
    name: 'Si Bintang Ceria',
    quote: 'Target pengumpulan iuran minggu ini sudah tercapai 83.3%!',
    tag: 'Status: Target Tercapai',
    color: '#FEF08A',
    textColor: '#0F172A',
  },
  {
    id: 'coral',
    name: 'Si Segitiga Siaga',
    quote: 'Perlu alokasi Rp 15.000 untuk beli spidol whiteboard & alat pel kelas!',
    tag: 'Status: Kebutuhan KBM',
    color: '#FECDD3',
    textColor: '#0F172A',
  },
  {
    id: 'sky',
    name: 'Si Biru Tenang',
    quote: 'Semua riwayat mutasi tersimpan rapi dan tahan risiko di Cloud Firestore.',
    tag: 'Status: Database Aman',
    color: '#BAE6FD',
    textColor: '#0F172A',
  },
];

export const InteractiveMascotStage: React.FC = () => {
  const [selectedMascot, setSelectedMascot] = useState<MascotCharacterInfo>(MASCOT_CHARACTERS[0]);

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      
      {/* Speech Bubble Display (Dynamic Background & Pointer) */}
      <div
        className="w-full p-4 sm:p-5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative select-none"
        style={{ backgroundColor: selectedMascot.color, color: selectedMascot.textColor }}
      >
        <div className="flex items-center justify-between text-xs font-space font-extrabold mb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
            {selectedMascot.name}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white border-2 border-black text-[10px] font-extrabold tracking-tight">
            {selectedMascot.tag}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-space font-bold leading-snug">
          "{selectedMascot.quote}"
        </p>
        
        {/* Pointer Arrow */}
        <div
          className="w-4 h-4 border-b-2 border-r-2 border-black absolute -bottom-2 left-10 rotate-45"
          style={{ backgroundColor: selectedMascot.color }}
        ></div>
      </div>

      {/* SVG Canvas with Interactive Mascot Characters */}
      <div className="w-full bg-[#FAF5FF] rounded-[32px] border-3 border-black p-4 sm:p-6 flex items-center justify-center relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <svg
          className="w-full max-w-[340px] h-auto anim-float select-none relative z-10"
          viewBox="0 0 340 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 1. MINT GREEN SERENE CIRCLE (Kas Aman) */}
          <g
            className="cursor-pointer group transition-transform hover:scale-105"
            onClick={() => setSelectedMascot(MASCOT_CHARACTERS[0])}
          >
            <circle cx="85" cy="140" r="48" fill="#B8FFA9" stroke="#000000" strokeWidth="3.5" />
            
            {/* Animated Blinking Eyes */}
            <g className="anim-blink">
              <path d="M66 134 C72 126 80 126 86 134" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M94 134 C100 126 108 126 114 134" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            </g>

            {/* Peaceful Smile */}
            <path d="M84 154 C88 158 96 158 100 154" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            
            {/* Cheeks */}
            <circle cx="68" cy="146" r="4.5" fill="#FCA5A5" opacity="0.6" />
            <circle cx="112" cy="146" r="4.5" fill="#FCA5A5" opacity="0.6" />
          </g>

          {/* 2. LAVENDER SPIRAL (Audit & Presisi) */}
          <g
            className="cursor-pointer group transition-transform hover:scale-105"
            onClick={() => setSelectedMascot(MASCOT_CHARACTERS[1])}
          >
            <circle cx="180" cy="110" r="44" fill="#EACEFF" stroke="#000000" strokeWidth="3.5" />
            <g className="anim-blink">
              <circle cx="167" cy="104" r="5" fill="#000000" />
              <circle cx="193" cy="101" r="5.5" fill="#000000" />
            </g>
            <path d="M170 125 Q180 117 190 125" stroke="#000000" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Swirl body line */}
            <path d="M152 118 Q166 135 184 128" stroke="#000000" strokeWidth="2" strokeDasharray="3 3" fill="none" />
          </g>

          {/* 3. PEACH ROUNDED SQUARE (Waspada Tagihan) */}
          <g
            className="cursor-pointer group transition-transform hover:scale-105"
            onClick={() => setSelectedMascot(MASCOT_CHARACTERS[2])}
          >
            <rect x="230" y="85" width="70" height="70" rx="24" fill="#FFC6A8" stroke="#000000" strokeWidth="3.5" />
            <line x1="245" y1="108" x2="256" y2="112" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="284" y1="108" x2="273" y2="112" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="264" cy="130" r="6" fill="#000000" />
          </g>

          {/* 4. YELLOW SPARKLE STAR (Surplus & Keren) */}
          <g
            className="cursor-pointer group"
            onClick={() => setSelectedMascot(MASCOT_CHARACTERS[3])}
          >
            <path
              className="anim-spark"
              d="M285 30 L290 48 L308 52 L290 56 L285 74 L280 56 L262 52 L280 48 Z"
              fill="#FEF08A"
              stroke="#000000"
              strokeWidth="2.5"
            />
          </g>

          {/* 5. CORAL TRIANGLE (Kebutuhan KBM) */}
          <g
            className="cursor-pointer group transition-transform hover:scale-105"
            onClick={() => setSelectedMascot(MASCOT_CHARACTERS[4])}
          >
            <polygon points="135,205 95,245 175,245" fill="#FECDD3" stroke="#000000" strokeWidth="3" />
            <path d="M125 228 L131 232 M131 228 L125 232" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M139 228 L145 232 M145 228 L139 232" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* 6. SOFT BLUE DROPLET (Tenang & Aman) */}
          <g
            className="cursor-pointer group transition-transform hover:scale-105"
            onClick={() => setSelectedMascot(MASCOT_CHARACTERS[5])}
          >
            <circle cx="215" cy="215" r="26" fill="#BAE6FD" stroke="#000000" strokeWidth="3" />
            <line x1="205" y1="214" x2="213" y2="214" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="217" y1="214" x2="225" y2="214" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="215" cy="223" r="2.5" fill="#000000" />
          </g>
        </svg>

      </div>

      {/* Interactive Helper Text */}
      <span className="text-[11px] font-space font-extrabold text-slate-500 text-center block tracking-tight">
        Ketuk karakter di atas untuk melihat respon status emosi finansialnya!
      </span>

    </div>
  );
};
