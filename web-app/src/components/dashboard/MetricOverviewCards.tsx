import React from 'react';
import { Coins, FileText, Heart, CheckCircle, TrendingUp } from 'lucide-react';
import type { ClassMetadata } from '../../types';

interface MetricOverviewCardsProps {
  classData: ClassMetadata;
  paidCount: number;
  unpaidCount: number;
  duesPercentage: string;
}

export const MetricOverviewCards: React.FC<MetricOverviewCardsProps> = ({
  classData,
  paidCount,
  unpaidCount,
  duesPercentage,
}) => {
  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const totalSafe = classData.saldo > 0 ? classData.saldo : 1;
  const opsPct = ((classData.alokasi.operasional / totalSafe) * 100).toFixed(1);
  const sosPct = ((classData.alokasi.sosial / totalSafe) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-space">
      
      {/* 1. TOTAL KAS CARD (PEACH #FFC6A8) */}
      <div className="bg-[#FFC6A8] p-5 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-black uppercase tracking-wider">Total Kas Kelas</span>
          <div className="w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center text-black">
            <Coins className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="my-3">
          <div className="text-3xl font-space font-extrabold text-black">{formatRupiah(classData.saldo)}</div>
          <span className="text-xs font-bold text-black flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-800 stroke-[2.5]" />
            Surplus Real-Time Firestore
          </span>
        </div>
        <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden flex border border-black/30">
          <div className="bg-orange-600 h-2 transition-all duration-500" style={{ width: `${opsPct}%` }} title="Operasional"></div>
          <div className="bg-violet-600 h-2 transition-all duration-500" style={{ width: `${sosPct}%` }} title="Sosial"></div>
        </div>
      </div>

      {/* 2. POS OPERASIONAL (MINT #B8FFA9) */}
      <div className="bg-[#B8FFA9] p-5 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-black uppercase tracking-wider">Pos Operasional</span>
          <div className="w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center text-black">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="my-2">
          <div className="text-2xl font-space font-extrabold text-black">{formatRupiah(classData.alokasi.operasional)}</div>
          <span className="text-xs font-bold text-emerald-900">{opsPct}% dari total kas</span>
        </div>
        <p className="text-[11px] text-slate-800 font-medium">Spidol, penghapus, alat kebersihan KBM</p>
      </div>

      {/* 3. POS SOSIAL (LAVENDER #EACEFF) */}
      <div className="bg-[#EACEFF] p-5 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-black uppercase tracking-wider">Pos Sosial & Peduli</span>
          <div className="w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center text-black">
            <Heart className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="my-2">
          <div className="text-2xl font-space font-extrabold text-black">{formatRupiah(classData.alokasi.sosial)}</div>
          <span className="text-xs font-bold text-purple-900">{sosPct}% dari total kas</span>
        </div>
        <p className="text-[11px] text-slate-800 font-medium">Menjenguk siswa sakit, santunan duka</p>
      </div>

      {/* 4. IURAN MINGGU KE-1 (CLEAN WHITE CARD) */}
      <div className="bg-white p-5 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-black uppercase tracking-wider">Iuran Minggu ke-1</span>
          <div className="w-8 h-8 rounded-full bg-[#B8FFA9] border border-black flex items-center justify-center text-black">
            <CheckCircle className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="my-2">
          <div className="text-3xl font-space font-extrabold text-black">{duesPercentage}%</div>
          <p className="text-xs text-slate-600 font-bold mt-0.5">
            {paidCount} Lunas • {unpaidCount} Belum Bayar
          </p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-black/20">
          <div className="bg-black h-2 rounded-full transition-all duration-500" style={{ width: `${duesPercentage}%` }}></div>
        </div>
      </div>

    </div>
  );
};
