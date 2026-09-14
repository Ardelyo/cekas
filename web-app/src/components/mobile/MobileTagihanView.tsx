import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Copy,
  Users,
  X,
  Plus
} from 'lucide-react';
import type { WhitelistStudent } from '../../types';

interface MobileTagihanViewProps {
  students: WhitelistStudent[];
  duesPercentage: string;
  onToggleStudentPaid: (nis: string) => void;
  onOpenCatatModal: () => void;
}

export const MobileTagihanView: React.FC<MobileTagihanViewProps> = ({
  students,
  duesPercentage,
  onToggleStudentPaid,
  onOpenCatatModal,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const totalStudents = students.length;
  const paidStudents = students.filter((s) => s.paid);
  const unpaidStudents = students.filter((s) => !s.paid);

  const targetNominal = totalStudents * 10000;
  const collectedNominal = paidStudents.length * 10000;
  const remainingNominal = unpaidStudents.length * 10000;

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Filtered Student List
  const filteredStudents = students
    .filter((s) => {
      if (filterMode === 'paid') return s.paid;
      if (filterMode === 'unpaid') return !s.paid;
      return true;
    })
    .filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      return s.namaResmi.toLowerCase().includes(q) || s.nis.includes(q);
    });

  // Copy WhatsApp / Telegram Reminder Message
  const handleCopyReminder = () => {
    let msg = `📢 *PENGINGAT IURAN KAS XI-F2 SMA KARTIKA XIX-1*\n`;
    msg += `Periode: Minggu ke-${selectedWeek} (Target: Rp 10.000 / siswa)\n`;
    msg += `-------------------------------------------\n`;
    msg += `Teman-teman yang belum melunasi (${unpaidStudents.length} siswa):\n`;
    unpaidStudents.forEach((s, idx) => {
      msg += `${idx + 1}. ${s.namaResmi} (${s.nis})\n`;
    });
    msg += `-------------------------------------------\n`;
    msg += `Mohon segera diserahkan ke Bendahara (Tarina) saat jam istirahat. Terima kasih! ✨\n`;
    msg += `(Terkumpul: ${formatRupiah(collectedNominal)} / ${formatRupiah(targetNominal)} - ${duesPercentage}%)`;

    navigator.clipboard.writeText(msg);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 pb-24 font-space">
      
      {/* ============================================================== */}
      {/* 1. TOP CONTROL & KPI CARD                                      */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-b-[36px] border-b-2 border-black shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-4">
        
        {/* Header & Title */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Pelacakan Kas Siswa
            </span>
            <h2 className="text-xl font-space font-black text-black leading-tight tracking-tight">
              Iuran & Tagihan Siswa
            </h2>
          </div>

          <button
            onClick={onOpenCatatModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 tactile-bounce"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Catat Kas</span>
          </button>
        </div>

        {/* Weekly Period Selector (Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[1, 2, 3, 4].map((wk) => (
            <button
              key={wk}
              type="button"
              onClick={() => setSelectedWeek(wk)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-black border-2 border-black transition-all whitespace-nowrap ${
                selectedWeek === wk
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Minggu {wk}
            </button>
          ))}
        </div>

        {/* Financial KPI Summary Box (Numeric Excellence) */}
        <div className="p-4 rounded-3xl bg-[#F0FDF4] border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-black">
            <span>Capaian Kas Minggu ke-{selectedWeek}</span>
            <span className="text-base font-num font-black text-emerald-800">{duesPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-black">
            <div
              className="bg-[#B8FFA9] h-3 rounded-full transition-all duration-500 border-r border-black"
              style={{ width: `${duesPercentage}%` }}
            ></div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-black/40 shadow-xs">
              <span className="text-[9px] text-slate-500 font-black block uppercase tracking-tight">Terkumpul</span>
              <span className="font-num font-black text-black text-xs sm:text-sm block mt-0.5">{formatRupiah(collectedNominal)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-black/40 shadow-xs">
              <span className="text-[9px] text-slate-500 font-black block uppercase tracking-tight">Target Total</span>
              <span className="font-num font-black text-black text-xs sm:text-sm block mt-0.5">{formatRupiah(targetNominal)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-black/40 shadow-xs">
              <span className="text-[9px] text-rose-600 font-black block uppercase tracking-tight">Tunggakan</span>
              <span className="font-num font-black text-rose-800 text-xs sm:text-sm block mt-0.5">{formatRupiah(remainingNominal)}</span>
            </div>
          </div>
        </div>

        {/* 1-Click WhatsApp / Telegram Reminder Action Bar */}
        <button
          onClick={handleCopyReminder}
          className="w-full py-2.5 px-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 tactile-bounce"
        >
          {copiedNotification ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#B8FFA9]" />
              <span>✓ Teks Pengingat Tersalin ke Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Salin Pesan Tagihan ({unpaidStudents.length} Siswa Nunggak)</span>
            </>
          )}
        </button>

      </div>

      {/* ============================================================== */}
      {/* 2. SEARCH & SEGMENT FILTER BAR                                 */}
      {/* ============================================================== */}
      <div className="px-4 space-y-3">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa berdasarkan nama atau NIS..."
            className="w-full text-xs bg-white border-2 border-black rounded-2xl pl-10 pr-8 py-3 font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl border-2 border-black text-xs font-black">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`py-2 rounded-xl transition-all ${
              filterMode === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            Semua ({totalStudents})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('unpaid')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              filterMode === 'unpaid'
                ? 'bg-[#FECDD3] text-black border border-black font-black shadow-xs'
                : 'text-rose-800 hover:text-black'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span>Nunggak ({unpaidStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('paid')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              filterMode === 'paid'
                ? 'bg-[#B8FFA9] text-black border border-black font-black shadow-xs'
                : 'text-emerald-800 hover:text-black'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Lunas ({paidStudents.length})</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. STUDENT CHECKLIST MATRIX (HIGHLY READABLE CARDS)            */}
      {/* ============================================================== */}
      <div className="px-4 space-y-2.5 flex-1">
        {filteredStudents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border-2 border-black text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-space font-extrabold text-sm text-black">Tidak Ada Siswa Ditemukan</div>
            <p className="text-xs text-slate-500 font-medium">Periksa kembali kata kunci pencarian Anda.</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isPaid = student.paid;
            const initials = student.namaResmi
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={student.nis}
                className={`p-3.5 rounded-3xl border-2 border-black transition-all flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  isPaid ? 'bg-white' : 'bg-[#FFF1F2]'
                }`}
              >
                {/* Left: Avatar & Identity */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl border-2 border-black flex items-center justify-center font-space font-black text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0 ${
                      isPaid ? 'bg-[#B8FFA9] text-black' : 'bg-[#FECDD3] text-black'
                    }`}
                  >
                    {initials}
                  </div>

                  <div>
                    <div className="font-space font-black text-xs sm:text-sm text-black leading-tight flex items-center gap-1.5">
                      <span>{student.namaResmi}</span>
                      {student.role === 'bendahara' && (
                        <span className="text-[9px] font-black bg-[#EACEFF] px-1.5 py-0.2 rounded-md border border-black">
                          Bendahara
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-black font-mono">NIS: {student.nis}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-[#B8FFA9] text-emerald-950 border-black'
                            : 'bg-rose-200 text-rose-950 border-black'
                        }`}
                      >
                        {isPaid ? 'Lunas M1 ✓' : 'Nunggak 1 Minggu !'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Tactile 1-Click Pay/Undo Action */}
                <button
                  type="button"
                  onClick={() => onToggleStudentPaid(student.nis)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tactile-bounce ${
                    isPaid
                      ? 'bg-white hover:bg-slate-100 text-slate-700'
                      : 'bg-[#B8FFA9] hover:bg-[#a3f792] text-black'
                  }`}
                >
                  {isPaid ? 'Batalkan' : '+ Bayar 10k'}
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
