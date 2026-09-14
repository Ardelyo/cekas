import React, { useState, useEffect, useRef } from 'react';
import {
  Coins,
  CheckCircle2,
  X,
  Plus,
  ChevronDown
} from 'lucide-react';
import gsap from 'gsap';
import type { ClassMetadata } from '../../types';

interface DynamicIslandProps {
  classData: ClassMetadata;
  duesPercentage: string;
  recentAlert?: {
    type: 'in' | 'out' | 'info';
    message: string;
    amount?: number;
  } | null;
  onClearAlert?: () => void;
  onOpenCatatModal: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  classData,
  duesPercentage,
  recentAlert,
  onClearAlert,
  onOpenCatatModal,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const islandRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const formatRupiahWhole = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // GSAP Morph Animation on Expand / Collapse
  useEffect(() => {
    if (!islandRef.current) return;

    if (recentAlert) {
      // Alert Animation (Attention Wave)
      gsap.fromTo(
        islandRef.current,
        { scale: 0.95, y: -4 },
        {
          scale: 1,
          y: 0,
          duration: 0.45,
          ease: 'back.out(1.8)',
        }
      );
    } else if (isExpanded) {
      // Expanded HUD
      gsap.to(islandRef.current, {
        width: '92%',
        maxWidth: 380,
        height: 'auto',
        borderRadius: 28,
        duration: 0.4,
        ease: 'power3.out',
      });
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, y: 10, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.3, delay: 0.1, ease: 'power2.out' }
        );
      }
    } else {
      // Compact Pill
      gsap.to(islandRef.current, {
        width: 'auto',
        maxWidth: 260,
        height: 38,
        borderRadius: 9999,
        duration: 0.35,
        ease: 'power3.inOut',
      });
    }
  }, [isExpanded, recentAlert]);

  // Auto-dismiss alert after 3.2s
  useEffect(() => {
    if (recentAlert && onClearAlert) {
      const timer = setTimeout(() => {
        onClearAlert();
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [recentAlert, onClearAlert]);

  return (
    <div className="w-full flex justify-center py-2 px-4 sticky top-1 z-40 select-none font-space pointer-events-none">
      <div
        ref={islandRef}
        onClick={() => {
          if (!recentAlert) setIsExpanded(!isExpanded);
        }}
        className={`pointer-events-auto bg-[#0F172A] text-white border-2 border-black/80 shadow-[0_8px_20px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.2)] transition-colors duration-200 cursor-pointer overflow-hidden relative ${
          recentAlert ? 'border-emerald-400/60 ring-2 ring-emerald-400/40' : ''
        }`}
        style={{ minWidth: recentAlert ? 300 : 210 }}
      >
        
        {/* ============================================================== */}
        {/* CASE 1: LIVE NOTIFICATION ALERT STATE                          */}
        {/* ============================================================== */}
        {recentAlert ? (
          <div className="px-4 py-2 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#B8FFA9] text-black flex items-center justify-center font-black shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="font-space font-black text-white text-[11px] block">
                  {recentAlert.message}
                </span>
                {recentAlert.amount && (
                  <span className="text-[10px] text-emerald-400 font-num font-bold">
                    {recentAlert.type === 'in' ? '+' : '-'}
                    {formatRupiahWhole(recentAlert.amount)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClearAlert) onClearAlert();
              }}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : isExpanded ? (
          /* ============================================================== */
          /* CASE 2: EXPANDED HUD STATE                                     */
          /* ============================================================== */
          <div ref={contentRef} className="p-4 space-y-3">
            {/* Top Row: Class Identity & Close */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#B8FFA9] text-black border border-black flex items-center justify-center shadow-xs">
                  <Coins className="w-4 h-4 stroke-[2.4]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-black text-xs text-white">CEKAS Dynamic Island</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-[#EACEFF] text-black text-[9px] font-black">
                      XI-F2
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Real-time Cloud HUD</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Middle Row: Balance & Dues Status */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Saldo Kas</span>
                <span className="font-num font-black text-sm text-[#B8FFA9] block mt-0.5">
                  {formatRupiahWhole(classData.saldo)}
                </span>
              </div>

              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Kelunasan M1</span>
                <span className="font-num font-black text-sm text-emerald-300 block mt-0.5">
                  {duesPercentage}% Lunas
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                  onOpenCatatModal();
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-xs tactile-bounce"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Input Kas Cepat</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* CASE 3: COMPACT PILL STATE                                     */
          /* ============================================================== */
          <div className="px-3.5 py-1.5 flex items-center justify-between gap-3 text-xs leading-none h-full">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="font-black text-white text-[11px] tracking-tight">XI-F2</span>
            </div>

            <div className="w-px h-3 bg-white/20"></div>

            <div className="flex items-center gap-1">
              <span className="font-num font-black text-xs text-[#B8FFA9]">
                {formatRupiahWhole(classData.saldo)}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
