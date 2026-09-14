import React from 'react';
import { LayoutDashboard, Calendar, CheckSquare, Receipt } from 'lucide-react';
import type { AppTab } from '../../types';

interface MobileBottomNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'laporan', label: 'Kalender', icon: Calendar },
    { id: 'tagihan', label: 'Tagihan', icon: CheckSquare },
    { id: 'transaksi', label: 'Mutasi', icon: Receipt },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[390px] select-none font-space">
      <div className="bg-[#0F172A] border-2 border-black rounded-[32px] px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.25)] flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 tactile-bounce relative ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/10 rounded-2xl border border-white/20 -z-10 shadow-xs"></div>
              )}
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#B8FFA9] stroke-[2.4]' : 'stroke-[2]'}`} />
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
