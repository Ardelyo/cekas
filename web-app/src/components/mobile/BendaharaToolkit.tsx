import React, { useState } from 'react';
import {
  Zap,
  Calculator,
  Copy,
  CheckCircle2,
  FileSpreadsheet,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import type { ClassMetadata, WhitelistStudent, CategoryAllocations } from '../../types';

interface BendaharaToolkitProps {
  classData: ClassMetadata;
  students: WhitelistStudent[];
  onQuickTransaction: (data: {
    type: 'in' | 'out';
    amount: number;
    category: keyof CategoryAllocations;
    description: string;
  }) => void;
  onExportExcel: () => void;
}

export const BendaharaToolkit: React.FC<BendaharaToolkitProps> = ({
  classData,
  students,
  onQuickTransaction,
  onExportExcel,
}) => {
  // Cash Reconciler State (Fisik vs Sistem)
  const [cashInWallet, setCashInWallet] = useState<string>('');
  const [copiedReminder, setCopiedReminder] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'presets' | 'reconcile' | 'reminder'>('presets');

  const unpaidStudents = students.filter((s) => !s.paid);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Reconcile calculation
  const physicalCashNum = parseInt(cashInWallet.replace(/\D/g, ''), 10) || 0;
  const discrepancy = physicalCashNum - classData.saldo;

  // Copy Reminder Message
  const handleCopyReminder = () => {
    let msg = `📢 *PENGINGAT IURAN KAS XI-F2 SMA KARTIKA XIX-1*\n`;
    msg += `Periode: Minggu ke-1 (Target: Rp 10.000 / siswa)\n`;
    msg += `-------------------------------------------\n`;
    msg += `Teman-teman yang belum melunasi (${unpaidStudents.length} siswa):\n`;
    unpaidStudents.forEach((s, idx) => {
      msg += `${idx + 1}. ${s.namaResmi} (${s.nis})\n`;
    });
    msg += `-------------------------------------------\n`;
    msg += `Mohon segera diserahkan ke Bendahara (Tarina) saat jam istirahat. Terima kasih! ✨\n`;
    msg += `(Data otomatis tercatat di CEKAS • Saldo Terkini: ${formatRupiah(classData.saldo)})`;

    navigator.clipboard.writeText(msg);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 3000);
  };

  return (
    <div className="bg-white p-5 rounded-[34px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 font-space">
      
      {/* Header Tool */}
      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EACEFF] border-2 border-black flex items-center justify-center text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-space font-extrabold text-sm text-black leading-tight">
              Toolkit Cepat Bendahara
            </h3>
            <span className="text-[10px] text-slate-500 font-bold block">
              Efisiensi pencatatan & pelacakan kas
            </span>
          </div>
        </div>

        {/* Sub-tools Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-300 text-[10px] font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTool('presets')}
            className={`px-2 py-1 rounded-lg transition-all ${
              activeTool === 'presets' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'
            }`}
          >
            Pintas
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('reconcile')}
            className={`px-2 py-1 rounded-lg transition-all ${
              activeTool === 'reconcile' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'
            }`}
          >
            Fisik
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('reminder')}
            className={`px-2 py-1 rounded-lg transition-all ${
              activeTool === 'reminder' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'
            }`}
          >
            Tagih
          </button>
        </div>
      </div>

      {/* 1. PRESET CHIPS: 1-TAP CASH IN / OUT */}
      {activeTool === 'presets' && (
        <div className="space-y-3">
          <span className="text-[11px] font-extrabold text-slate-700 block">
            Pencatatan Cepat Sekali Ketuk:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
            {/* Quick In: 10k Iuran M1 */}
            <button
              type="button"
              onClick={() =>
                onQuickTransaction({
                  type: 'in',
                  amount: 10000,
                  category: 'operasional',
                  description: 'Iuran kas masuk (1 Minggu)',
                })
              }
              className="p-2.5 rounded-2xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
            >
              <div className="flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-800" />
                <span>+10k Iuran M1</span>
              </div>
            </button>

            {/* Quick In: 20k Iuran 2 Minggu */}
            <button
              type="button"
              onClick={() =>
                onQuickTransaction({
                  type: 'in',
                  amount: 20000,
                  category: 'operasional',
                  description: 'Iuran kas masuk (2 Minggu)',
                })
              }
              className="p-2.5 rounded-2xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
            >
              <div className="flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-800" />
                <span>+20k Iuran 2M</span>
              </div>
            </button>

            {/* Quick Out: -15k Spidol */}
            <button
              type="button"
              onClick={() =>
                onQuickTransaction({
                  type: 'out',
                  amount: 15000,
                  category: 'operasional',
                  description: 'Beli spidol whiteboard & isi tinta',
                })
              }
              className="p-2.5 rounded-2xl bg-[#FFC6A8] hover:bg-[#fbb18b] text-black border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
            >
              <div className="flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-orange-900" />
                <span>-15k Spidol KBM</span>
              </div>
            </button>

            {/* Quick Out: -35k Alat Pel / Kebersihan */}
            <button
              type="button"
              onClick={() =>
                onQuickTransaction({
                  type: 'out',
                  amount: 35000,
                  category: 'operasional',
                  description: 'Beli sapu dan alat pel kelas',
                })
              }
              className="p-2.5 rounded-2xl bg-[#FFC6A8] hover:bg-[#fbb18b] text-black border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce"
            >
              <div className="flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-orange-900" />
                <span>-35k Sapu & Pel</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. RECONCILER: CEK UANG FISIK VS SISTEM */}
      {activeTool === 'reconcile' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-black">
            <span>Rekonsiliasi Uang Fisik Dompet Kas</span>
            <Calculator className="w-4 h-4" />
          </div>

          <div className="relative">
            <input
              type="number"
              value={cashInWallet}
              onChange={(e) => setCashInWallet(e.target.value)}
              placeholder="Ketik total uang fisik di dompet (Rp)..."
              className="w-full text-xs bg-slate-50 border-2 border-black rounded-2xl p-3 font-extrabold text-black focus:outline-none focus:bg-white"
            />
          </div>

          {cashInWallet && (
            <div
              className={`p-3 rounded-2xl border-2 border-black text-xs font-extrabold space-y-1 ${
                discrepancy === 0
                  ? 'bg-[#B8FFA9] text-black'
                  : discrepancy > 0
                  ? 'bg-[#FEF08A] text-black'
                  : 'bg-[#FECDD3] text-black'
              }`}
            >
              <div className="flex justify-between">
                <span>Uang Fisik:</span>
                <span>{formatRupiah(physicalCashNum)}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo Sistem:</span>
                <span>{formatRupiah(classData.saldo)}</span>
              </div>
              <div className="border-t border-black/30 pt-1 flex justify-between font-black">
                <span>Status Selisih:</span>
                <span>
                  {discrepancy === 0
                    ? '✓ COCOK 100% (Selisih Rp 0)'
                    : discrepancy > 0
                    ? `Lebih Fisik (+${formatRupiah(discrepancy)})`
                    : `Tekor Fisik (${formatRupiah(discrepancy)})`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. BROADCAST REMINDER MESSAGE */}
      {activeTool === 'reminder' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-black">
            <span>Generator Pesan Penagihan Kas</span>
            <span className="text-[10px] bg-[#FECDD3] px-2 py-0.5 rounded-full border border-black">
              {unpaidStudents.length} Belum Bayar
            </span>
          </div>

          <p className="text-[11px] text-slate-600 font-medium">
            Salin draf teks sopan yang siap Anda tempel (*paste*) langsung ke grup WhatsApp atau Telegram kelas:
          </p>

          <button
            type="button"
            onClick={handleCopyReminder}
            className="w-full py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 tactile-bounce"
          >
            {copiedReminder ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#B8FFA9]" />
                <span>✓ Berhasil Disalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Pesan Pengingat Tagihan</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Export shortcut */}
      <div className="pt-2 border-t-2 border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500">Arsip Pertanggungjawaban:</span>
        <button
          type="button"
          onClick={onExportExcel}
          className="text-xs font-extrabold text-black hover:underline flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
          <span>Unduh Excel (.xlsx)</span>
        </button>
      </div>

    </div>
  );
};
