import React, { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Receipt,
  Calendar,
  FileSpreadsheet,
  Plus,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Eye,
  GraduationCap,
  LogOut,
  Smartphone
} from 'lucide-react';
import gsap from 'gsap';
import type { AppTab, UserSession } from '../../types';

interface DesktopSidebarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  userSession: UserSession;
  unpaidCount: number;
  txCount: number;
  onOpenCatatModal: () => void;
  onExportExcel: () => void;
  onSwitchAccount: () => void;
  onSwitchToMobilePreview: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onSelectTab,
  userSession,
  unpaidCount,
  txCount,
  onOpenCatatModal,
  onExportExcel,
  onSwitchAccount,
  onSwitchToMobilePreview,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const isBendahara = userSession.role === 'bendahara';
  const isKetuaKelas = userSession.role === 'ketuakelas';
  const isWaliKelas = userSession.role === 'walikelas';
  const isTamu = userSession.role === 'tamu';

  const navItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Ringkasan Kas', icon: LayoutDashboard },
    {
      id: 'tagihan',
      label: 'Tagihan Siswa',
      icon: CheckSquare,
      badge: unpaidCount > 0 ? `${unpaidCount} Nunggak` : 'Lunas',
      badgeColor: unpaidCount > 0 ? 'bg-[#FECDD3] text-rose-950' : 'bg-[#B8FFA9] text-emerald-950'
    },
    {
      id: 'transaksi',
      label: 'Buku Kas Umum',
      icon: Receipt,
      badge: `${txCount} Log`,
      badgeColor: 'bg-slate-100 text-slate-800'
    },
    { id: 'laporan', label: 'Kalender Kas', icon: Calendar },
  ];

  return (
    <aside
      ref={sidebarRef}
      className="w-72 bg-white border-r-2 border-black flex flex-col justify-between shrink-0 select-none font-space h-screen sticky top-0 z-40 p-5 shadow-[4px_0px_0px_0px_rgba(0,0,0,0.04)]"
    >
      {/* ============================================================== */}
      {/* 1. TOP BRANDING & BADGE                                        */}
      {/* ============================================================== */}
      <div className="space-y-6">
        
        {/* Logo & School Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#B8FFA9] border-2 border-black flex items-center justify-center text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
            <Coins className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-space font-black text-2xl text-black tracking-tight leading-none">
                CEKAS
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EACEFF] text-black border border-black shadow-xs">
                XI-F2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-1 leading-tight">
              SMA Kartika XIX-1 Bandung
            </p>
          </div>
        </div>

        {/* User Role Card (Dribbble Bento Style) */}
        <div className={`p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 ${
          isBendahara
            ? 'bg-[#B8FFA9]'
            : isWaliKelas
            ? 'bg-[#FEF08A]'
            : isKetuaKelas
            ? 'bg-[#EACEFF]'
            : isTamu
            ? 'bg-slate-100'
            : 'bg-sky-100'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-white border border-black flex items-center justify-center text-black shrink-0 shadow-xs">
            {isBendahara && <ShieldCheck className="w-5 h-5 stroke-[2.4]" />}
            {isWaliKelas && <ShieldAlert className="w-5 h-5 stroke-[2.4]" />}
            {isKetuaKelas && <Crown className="w-5 h-5 stroke-[2.4]" />}
            {isTamu && <Eye className="w-5 h-5 stroke-[2.4]" />}
            {!isBendahara && !isWaliKelas && !isKetuaKelas && !isTamu && <GraduationCap className="w-5 h-5 stroke-[2.4]" />}
          </div>

          <div className="overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-wider text-black/60 block">
              {isTamu ? 'Akses Publik' : 'Pengguna Aktif'}
            </span>
            <div className="font-space font-black text-xs text-black truncate">
              {userSession.nama || 'Ardellio Satria'}
            </div>
            <span className="text-[10px] font-extrabold text-black/80 capitalize">
              Role: {userSession.role}
            </span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between border-2 tactile-bounce ${
                  isActive
                    ? 'bg-black text-white border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-transparent text-slate-700 hover:bg-slate-100 border-transparent hover:border-black/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#B8FFA9] stroke-[2.5]' : 'text-slate-600 stroke-[2]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border border-black/30 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {isBendahara && (
            <button
              onClick={onOpenCatatModal}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 tactile-bounce"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Catat Kas Baru</span>
            </button>
          )}

          <button
            onClick={onExportExcel}
            className="w-full py-2 px-3 rounded-2xl bg-white hover:bg-slate-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 tactile-bounce"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-800 stroke-[2.2]" />
            <span>Unduh Rekap Excel (.xlsx)</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. BOTTOM CONTROL & LOGOUT                                     */}
      {/* ============================================================== */}
      <div className="space-y-2 pt-4 border-t-2 border-slate-100">
        
        {/* Switch to Mobile Preview Mode Button */}
        <button
          onClick={onSwitchToMobilePreview}
          className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-black border border-black/30 text-[11px] font-black flex items-center justify-center gap-2 transition-all"
          title="Lihat Pratinjau Tampilan Smartphone"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Pratinjau Mode Ponsel</span>
        </button>

        {/* Logout / Switch Account */}
        <button
          onClick={onSwitchAccount}
          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-900 border border-black/30 text-[11px] font-black flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isTamu ? 'Masuk ke Akun' : 'Ganti Akun / Keluar'}</span>
        </button>

        <div className="text-[10px] text-slate-400 font-bold text-center pt-1">
          CEKAS v1.2 • Firestore Sync
        </div>
      </div>

    </aside>
  );
};
