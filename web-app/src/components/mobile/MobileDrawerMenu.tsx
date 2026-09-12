import React from 'react';
import { X, FileSpreadsheet, MessageSquare, LogOut, Download } from 'lucide-react';
import type { UserSession } from '../../types';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  userSession: UserSession;
  onClose: () => void;
  onSwitchAccount: () => void;
  onExportExcel: () => void;
}

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  userSession,
  onClose,
  onSwitchAccount,
  onExportExcel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 font-space">
      <div className="bg-white w-full max-w-md rounded-t-[36px] sm:rounded-4xl p-6 border-t-3 sm:border-3 border-black shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EACEFF] border-2 border-black flex items-center justify-center font-extrabold text-black text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {userSession.role === 'bendahara' ? 'TR' : 'AS'}
            </div>
            <div>
              <h4 className="font-space font-extrabold text-sm text-black leading-tight">
                {userSession.nama || 'Ardellio Satria'}
              </h4>
              <span className="text-[10px] text-slate-500 font-bold capitalize">
                {userSession.role === 'bendahara' ? 'Bendahara (Akses Penuh)' : 'Siswa XI-F2 (Read-Only)'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-black flex items-center justify-center text-black font-extrabold"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Menu Actions */}
        <div className="space-y-2 text-xs font-extrabold">
          
          <button
            onClick={() => { onExportExcel(); onClose(); }}
            className="w-full p-3.5 rounded-2xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Rekap Excel (.xlsx)</span>
            </div>
            <Download className="w-4 h-4" />
          </button>

          <a
            href="https://t.me/kacekasbot"
            target="_blank"
            rel="noreferrer"
            className="w-full p-3.5 rounded-2xl bg-[#EACEFF] hover:bg-[#d8b4fe] text-black border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>Buka Bot Telegram Gateway</span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-black">@kacekasbot</span>
          </a>

          <button
            onClick={() => { onSwitchAccount(); onClose(); }}
            className="w-full p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Ganti Akun / Keluar</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">Ke Halaman Awal</span>
          </button>

        </div>

        {/* School Footer */}
        <div className="pt-2 text-center text-[11px] text-slate-400 font-bold border-t border-slate-100">
          Sistem CEKAS • SMA Kartika XIX-1 Bandung
        </div>

      </div>
    </div>
  );
};
