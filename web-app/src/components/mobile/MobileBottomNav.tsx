import React from 'react';
import { LayoutDashboard, Calendar, CheckSquare, Receipt } from 'lucide-react';
import type { AppTab } from '../../types';

interface MobileBottomNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[390px] select-none">
      <div className="bg-[#0F172A] border-2 border-black rounded-full px-5 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.2)] flex items-center justify-around">
        
        {/* 1. Home Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center transition-all ${
            currentTab === 'dashboard'
              ? 'text-white scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Beranda Kas"
        >
          <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[9px] font-space font-extrabold mt-0.5">Beranda</span>
        </button>

        {/* 2. Kalender Kas */}
        <button
          onClick={() => onSelectTab('laporan')} // Or dedicated calendar view
          className={`flex flex-col items-center justify-center transition-all ${
            currentTab === 'laporan'
              ? 'text-white scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Kalender & Ringkasan"
        >
          <Calendar className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[9px] font-space font-extrabold mt-0.5">Kalender</span>
        </button>

        {/* 3. Iuran Siswa */}
        <button
          onClick={() => onSelectTab('tagihan')}
          className={`flex flex-col items-center justify-center transition-all ${
            currentTab === 'tagihan'
              ? 'text-white scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Status Iuran Siswa"
        >
          <CheckSquare className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[9px] font-space font-extrabold mt-0.5">Tagihan</span>
        </button>

        {/* 4. Buku Kas / Transaksi */}
        <button
          onClick={() => onSelectTab('transaksi')}
          className={`flex flex-col items-center justify-center transition-all ${
            currentTab === 'transaksi'
              ? 'text-white scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Buku Kas & Mutasi"
        >
          <Receipt className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[9px] font-space font-extrabold mt-0.5">Mutasi</span>
        </button>

      </div>
    </div>
  );
};
