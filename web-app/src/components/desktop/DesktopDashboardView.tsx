import React, { useState } from 'react';
import {
  Coins,
  TrendingUp,
  ShieldCheck,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  Eye,
  Crown,
  GraduationCap,
  ShieldAlert,
  Smartphone,
  LogOut,
  FileSpreadsheet,
  Copy
} from 'lucide-react';
import type {
  ClassMetadata,
  Transaction,
  WhitelistStudent,
  FinancialMood,
  UserSession,
  CategoryAllocations
} from '../../types';

interface DesktopDashboardViewProps {
  classData: ClassMetadata;
  transactions: Transaction[];
  students: WhitelistStudent[];
  userSession: UserSession;
  activeMood: FinancialMood;
  duesPercentage: string;
  onSelectMood: (mood: FinancialMood) => void;
  onOpenCatatModal: () => void;
  onSelectReversalTx: (tx: Transaction) => void;
  onToggleStudentPaid: (nis: string) => void;
  onQuickTransaction: (data: {
    type: 'in' | 'out';
    amount: number;
    category: keyof CategoryAllocations;
    description: string;
  }) => void;
  onExportExcel: () => void;
  onSwitchAccount: () => void;
  onToggleViewport: () => void;
}

export const DesktopDashboardView: React.FC<DesktopDashboardViewProps> = ({
  classData,
  transactions,
  students,
  userSession,
  activeMood,
  duesPercentage,
  onSelectMood,
  onOpenCatatModal,
  onSelectReversalTx,
  onToggleStudentPaid,
  onExportExcel,
  onSwitchAccount,
  onToggleViewport,
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'tagihan' | 'mutasi' | 'kalender'>('ringkasan');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [searchTx, setSearchTx] = useState<string>('');
  const [filterStudentMode, setFilterStudentMode] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [voteSubmitted, setVoteSubmitted] = useState<'yes' | 'no' | null>(null);
  const [copiedBroadcast, setCopiedBroadcast] = useState<boolean>(false);

  const isBendahara = userSession.role === 'bendahara';
  const isKetuaKelas = userSession.role === 'ketuakelas';
  const isWaliKelas = userSession.role === 'walikelas';
  const isTamu = userSession.role === 'tamu';

  const canWriteCash = isBendahara;

  const totalStudents = students.length;
  const paidStudents = students.filter((s) => s.paid);
  const unpaidStudents = students.filter((s) => !s.paid);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const opsPct = classData.saldo > 0 ? Math.round((classData.alokasi.operasional / classData.saldo) * 100) : 0;
  const sosPct = classData.saldo > 0 ? Math.round((classData.alokasi.sosial / classData.saldo) * 100) : 0;

  // Copy broadcast tagihan
  const handleCopyBroadcast = () => {
    let msg = `📢 *PENGINGAT IURAN KAS XI-F2 SMA KARTIKA XIX-1*\n`;
    msg += `Periode: Minggu ke-1 (Target: Rp 10.000 / siswa)\n`;
    msg += `-------------------------------------------\n`;
    msg += `Teman-teman yang belum melunasi (${unpaidStudents.length} siswa):\n`;
    unpaidStudents.forEach((s, idx) => {
      msg += `${idx + 1}. ${s.namaResmi} (${s.nis})\n`;
    });
    msg += `-------------------------------------------\n`;
    msg += `Mohon segera diserahkan ke Bendahara (Tarina) saat jam istirahat. Terima kasih! ✨\n`;
    navigator.clipboard.writeText(msg);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col font-space">
      
      {/* ============================================================== */}
      {/* 1. TOP NAVIGATION BAR (PC COMPATIBLE DESAIN)                   */}
      {/* ============================================================== */}
      <header className="bg-white border-b-2 border-black sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand & Class Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#B8FFA9] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-space font-black text-2xl text-black tracking-tight leading-none">CEKAS</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EACEFF] text-black border border-black shadow-xs">
                  XI-F2
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider hidden sm:inline">
                  Live Firestore
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">SMA Kartika XIX-1 Bandung • TA 2026/2027</p>
            </div>
          </div>

          {/* Role Status & Control Buttons */}
          <div className="flex items-center gap-2.5">
            
            {/* Hierarchy Badge */}
            <div className={`px-3 py-1.5 rounded-xl border-2 border-black font-space font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              isBendahara
                ? 'bg-[#B8FFA9] text-black'
                : isWaliKelas
                ? 'bg-[#FEF08A] text-black'
                : isKetuaKelas
                ? 'bg-[#EACEFF] text-black'
                : isTamu
                ? 'bg-slate-100 text-slate-800'
                : 'bg-sky-100 text-sky-950'
            }`}>
              {isBendahara && <ShieldCheck className="w-4 h-4 stroke-[2.5]" />}
              {isWaliKelas && <ShieldAlert className="w-4 h-4 stroke-[2.5]" />}
              {isKetuaKelas && <Crown className="w-4 h-4 stroke-[2.5]" />}
              {isTamu && <Eye className="w-4 h-4 stroke-[2.5]" />}
              {!isBendahara && !isWaliKelas && !isKetuaKelas && !isTamu && <GraduationCap className="w-4 h-4 stroke-[2.5]" />}
              
              <span>
                {isBendahara && `Bendahara: ${userSession.nama || 'Tarina'}`}
                {isWaliKelas && 'Wali Kelas XI-F2'}
                {isKetuaKelas && 'Ketua Kelas XI-F2'}
                {isTamu && 'Mode Publik (Read-Only)'}
                {!isBendahara && !isWaliKelas && !isKetuaKelas && !isTamu && `Siswa: ${userSession.nama || 'Ardellio'}`}
              </span>
            </div>

            {/* Viewport Toggle: Mobile vs PC */}
            <button
              onClick={onToggleViewport}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 tactile-bounce"
              title="Beralih ke Tampilan Mobile Phone"
            >
              <Smartphone className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden md:inline">Mode Ponsel</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={onExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#B8FFA9] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 tactile-bounce"
              title="Unduh Rekap Laporan Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-800 stroke-[2.2]" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>

            {/* Logout / Switch Account */}
            <button
              onClick={onSwitchAccount}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-800 hover:text-rose-900 border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 tactile-bounce"
              title="Ganti Akun / Keluar"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="hidden sm:inline">{isTamu ? 'Login' : 'Keluar'}</span>
            </button>

          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. PUBLIC DASHBOARD TRANSPARENCY NOTICE (IF TAMU)              */}
      {/* ============================================================== */}
      {isTamu && (
        <div className="bg-[#FEF08A] border-b-2 border-black px-4 py-2.5 text-center text-xs font-black text-black flex items-center justify-center gap-2">
          <Eye className="w-4 h-4 text-black stroke-[2.5]" />
          <span>Anda sedang melihat Dashboard Transparansi Kas Publik Kelas XI-F2 (Akses Baca Bebas untuk Siswa & Orang Tua).</span>
          <button
            onClick={onSwitchAccount}
            className="underline ml-2 hover:text-slate-800 font-extrabold"
          >
            Masuk sebagai Pengurus →
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN PC CONTENT CONTAINER (MAX-W-7XL)                       */}
      {/* ============================================================== */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        
        {/* TOP ROW: BENTO PODS (SALDO, ARUS MASUK, DISIPLIN, MOOD) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Pod 1: Main Balance & 4-Pocket Allocations (Col 5) */}
          <div className="md:col-span-5 bg-white p-6 rounded-[32px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-black/30">
                  Total Saldo Kas Berjalan
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#B8FFA9] text-black border border-black shadow-xs">
                  Surplus 100%
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-lg font-space font-black text-black/60">Rp</span>
                <span className="text-4xl lg:text-5xl font-num font-black text-black tracking-tight leading-none">
                  {Math.abs(classData.saldo).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                </span>
              </div>
            </div>

            {/* 4 Pockets Allocation Progress */}
            <div className="space-y-2 pt-3 border-t-2 border-slate-100">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight block">
                Alokasi 4 Pos Anggaran Terisolasi:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FAF5FF] p-2.5 rounded-xl border border-black/40">
                  <span className="text-[10px] text-slate-500 font-bold block">Operasional ({opsPct}%)</span>
                  <span className="font-num font-black text-black">{formatRupiah(classData.alokasi.operasional)}</span>
                </div>

                <div className="bg-[#F0FDF4] p-2.5 rounded-xl border border-black/40">
                  <span className="text-[10px] text-slate-500 font-bold block">Sosial ({sosPct}%)</span>
                  <span className="font-num font-black text-black">{formatRupiah(classData.alokasi.sosial)}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-black/40">
                  <span className="text-[10px] text-slate-500 font-bold block">Event / Bazar</span>
                  <span className="font-num font-black text-black">{formatRupiah(classData.alokasi.event)}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-black/40">
                  <span className="text-[10px] text-slate-500 font-bold block">Cadangan Darurat</span>
                  <span className="font-num font-black text-black">{formatRupiah(classData.alokasi.cadangan)}</span>
                </div>
              </div>
            </div>

            {/* Quick Action for Bendahara */}
            {canWriteCash && (
              <button
                onClick={onOpenCatatModal}
                className="w-full py-3 rounded-2xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black font-black text-sm border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 tactile-bounce"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Catat Transaksi Kas Baru (Pemasukan / Pengeluaran)</span>
              </button>
            )}
          </div>

          {/* Pod 2: Visual Bento Split (Arus Kas & Disiplin) (Col 4) */}
          <div className="md:col-span-4 flex flex-col gap-4">
            
            {/* Peach Arus Masuk Card */}
            <div className="bg-[#FFC6A8] p-5 rounded-[28px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-black">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  <span>Arus Kas Masuk</span>
                </div>
                <span className="text-[10px] font-black bg-white/70 px-2 py-0.5 rounded-md border border-black">
                  Minggu 1
                </span>
              </div>

              <div className="my-2 flex items-end gap-2 h-12">
                <div className="w-3 bg-orange-400 rounded-full h-5 border border-black"></div>
                <div className="w-3 bg-orange-500 rounded-full h-8 border border-black"></div>
                <div className="w-3 bg-orange-400 rounded-full h-4 border border-black"></div>
                <div className="w-3 bg-orange-600 rounded-full h-12 border border-black"></div>
                <div className="w-3 bg-orange-500 rounded-full h-7 border border-black"></div>
              </div>

              <div>
                <div className="text-3xl font-num font-black text-black tracking-tight leading-none">
                  +Rp 100.000
                </div>
                <span className="text-xs text-slate-800 font-bold block mt-1">
                  Total Dihimpun Pekan Ini
                </span>
              </div>
            </div>

            {/* Lavender Disiplin Card */}
            <div className="bg-[#EACEFF] p-5 rounded-[28px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-black">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Tingkat Kelunasan Iuran</span>
                </div>
                <span className="text-[10px] font-black bg-white/70 px-2 py-0.5 rounded-md border border-black">
                  {duesPercentage}% Lunas
                </span>
              </div>

              <div className="my-2 flex items-end gap-2 h-12">
                <div className="w-3.5 bg-violet-300 rounded-md h-3 border border-black"></div>
                <div className="w-3.5 bg-violet-400 rounded-md h-6 border border-black"></div>
                <div className="w-3.5 bg-violet-500 rounded-md h-9 border border-black"></div>
                <div className="w-3.5 bg-violet-600 rounded-md h-12 border border-black"></div>
              </div>

              <div>
                <div className="text-3xl font-num font-black text-black tracking-tight leading-none">
                  {paidStudents.length} / {totalStudents} Siswa
                </div>
                <span className="text-xs text-slate-800 font-bold block mt-1">
                  Kepatuhan Keuangan Kelas Tinggi
                </span>
              </div>
            </div>

          </div>

          {/* Pod 3: Mood Selector & Musyawarah Card (Col 3) */}
          <div className="md:col-span-3 flex flex-col gap-4">
            
            {/* Mood Selector Row */}
            <div className="bg-white p-4.5 rounded-[28px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight block">
                Indikator Suasana Kas Kelas:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectMood('aman')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 font-black text-xs transition-all ${
                    activeMood === 'aman'
                      ? 'bg-[#B8FFA9] border-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Aman</span>
                </button>

                <button
                  onClick={() => onSelectMood('tagihan')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 font-black text-xs transition-all ${
                    activeMood === 'tagihan'
                      ? 'bg-[#FFC6A8] border-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>Tagihan</span>
                </button>

                <button
                  onClick={() => onSelectMood('audit')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 font-black text-xs transition-all ${
                    activeMood === 'audit'
                      ? 'bg-[#EACEFF] border-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Audit</span>
                </button>

                <button
                  onClick={() => onSelectMood('surplus')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 font-black text-xs transition-all ${
                    activeMood === 'surplus'
                      ? 'bg-[#FEF08A] border-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span>Surplus</span>
                </button>
              </div>
            </div>

            {/* Musyawarah Kas Quiz Widget */}
            <div className="bg-[#B8FFA9] p-4.5 rounded-[28px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-black text-black">
                  <span>Musyawarah Kas</span>
                  <span className="bg-white px-2 py-0.5 rounded-full border border-black text-[9px] font-mono">
                    1/3
                  </span>
                </div>
                <p className="font-space font-extrabold text-xs text-black leading-snug mt-1.5">
                  "Apakah dana kas cukup untuk beli spidol & alat pel minggu ini?"
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setVoteSubmitted('yes')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black border-2 border-black transition-all ${
                    voteSubmitted === 'yes'
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-black text-white hover:bg-slate-800'
                  }`}
                >
                  Cukup (Ya)
                </button>
                <button
                  onClick={() => setVoteSubmitted('no')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black border-2 border-black transition-all ${
                    voteSubmitted === 'no'
                      ? 'bg-white text-black shadow-xs'
                      : 'bg-white text-black hover:bg-slate-50'
                  }`}
                >
                  Kurang
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* DESKTOP CONTENT TABS (TAGIHAN SISWA & BUKU KAS)                */}
        {/* ============================================================== */}
        <div className="bg-white rounded-[32px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6">
          
          {/* Tab Selector Buttons */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ringkasan')}
                className={`px-4 py-2 rounded-2xl text-xs font-black border-2 border-black transition-all ${
                  activeTab === 'ringkasan'
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Ringkasan Eksekutif
              </button>

              <button
                onClick={() => setActiveTab('tagihan')}
                className={`px-4 py-2 rounded-2xl text-xs font-black border-2 border-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'tagihan'
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Pelacakan Tagihan</span>
                <span className="px-1.5 py-0.2 rounded-md bg-[#FECDD3] text-black text-[10px]">
                  {unpaidStudents.length} Nunggak
                </span>
              </button>

              <button
                onClick={() => setActiveTab('mutasi')}
                className={`px-4 py-2 rounded-2xl text-xs font-black border-2 border-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'mutasi'
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Buku Kas Umum</span>
                <span className="px-1.5 py-0.2 rounded-md bg-[#B8FFA9] text-black text-[10px]">
                  {transactions.length} Mutasi
                </span>
              </button>
            </div>

            {/* Quick Broadcast Action for Bendahara / Wali Kelas */}
            <button
              onClick={handleCopyBroadcast}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#FEF08A] text-black border-2 border-black font-black text-xs shadow-xs flex items-center gap-1.5 tactile-bounce"
            >
              {copiedBroadcast ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                  <span>✓ Tersalin ke Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Pesan Tagihan WA</span>
                </>
              )}
            </button>
          </div>

          {/* TAB 1: RINGKASAN EKSEKUTIF (PC LAYOUT) */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border-2 border-black">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Total Pemasukan</span>
                  <span className="text-2xl font-num font-black text-emerald-900 block mt-1">Rp 300.000</span>
                  <span className="text-xs text-slate-600 font-bold">Dari iuran kas siswa terdata</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF1F2] border-2 border-black">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Total Pengeluaran</span>
                  <span className="text-2xl font-num font-black text-rose-900 block mt-1">Rp 140.000</span>
                  <span className="text-xs text-slate-600 font-bold">Kebutuhan belajar & operasional</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF5FF] border-2 border-black">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Sisa Saldo Kas Bersih</span>
                  <span className="text-2xl font-num font-black text-purple-900 block mt-1">Rp 160.000</span>
                  <span className="text-xs text-slate-600 font-bold">100% Cocok antara fisik & sistem</span>
                </div>
              </div>

              {/* Recent 5 Transactions Preview Table */}
              <div>
                <h4 className="font-space font-black text-base text-black mb-3">5 Transaksi Terakhir</h4>
                <div className="overflow-x-auto rounded-2xl border-2 border-black">
                  <table className="w-full text-left text-xs font-space">
                    <thead className="bg-slate-100 border-b-2 border-black text-slate-700 font-black">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3">Pos Anggaran</th>
                        <th className="p-3">Pencatat</th>
                        <th className="p-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-slate-200">
                      {transactions.slice(0, 5).map((tx) => {
                        const isIn = tx.type === 'in';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-500">#{tx.id}</td>
                            <td className="p-3 font-black text-black">{tx.description}</td>
                            <td className="p-3 font-bold uppercase text-[10px] text-slate-600">Pos {tx.category}</td>
                            <td className="p-3 font-bold text-slate-700">{tx.inputBy}</td>
                            <td className={`p-3 text-right font-num font-black ${isIn ? 'text-emerald-800' : 'text-orange-900'}`}>
                              {isIn ? '+' : '-'}{formatRupiah(tx.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATRIKS TAGIHAN SISWA (PC TABLE) */}
          {activeTab === 'tagihan' && (
            <div className="space-y-4">
              {/* Search & Filter Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Cari nama atau NIS siswa..."
                    className="w-full text-xs bg-slate-50 border-2 border-black rounded-xl pl-10 pr-3 py-2.5 font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStudentMode('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black ${
                      filterStudentMode === 'all' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Semua ({totalStudents})
                  </button>
                  <button
                    onClick={() => setFilterStudentMode('unpaid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black ${
                      filterStudentMode === 'unpaid' ? 'bg-[#FECDD3] text-black font-black' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Nunggak ({unpaidStudents.length})
                  </button>
                  <button
                    onClick={() => setFilterStudentMode('paid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black ${
                      filterStudentMode === 'paid' ? 'bg-[#B8FFA9] text-black font-black' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Lunas ({paidStudents.length})
                  </button>
                </div>
              </div>

              {/* Full Desktop Table */}
              <div className="overflow-x-auto rounded-2xl border-2 border-black">
                <table className="w-full text-left text-xs font-space">
                  <thead className="bg-slate-100 border-b-2 border-black text-slate-700 font-black">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">NIS</th>
                      <th className="p-3">Peran</th>
                      <th className="p-3">Status Iuran M1</th>
                      {canWriteCash && <th className="p-3 text-right">Aksi Bendahara</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y border-slate-200">
                    {students
                      .filter((s) => {
                        if (filterStudentMode === 'paid') return s.paid;
                        if (filterStudentMode === 'unpaid') return !s.paid;
                        return true;
                      })
                      .filter((s) => {
                        const q = searchStudent.toLowerCase();
                        return s.namaResmi.toLowerCase().includes(q) || s.nis.includes(q);
                      })
                      .map((student, idx) => {
                        const isPaid = student.paid;
                        return (
                          <tr key={student.nis} className={`hover:bg-slate-50 ${isPaid ? '' : 'bg-[#FFF1F2]/40'}`}>
                            <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-black text-black">{student.namaResmi}</td>
                            <td className="p-3 font-mono font-bold text-slate-600">{student.nis}</td>
                            <td className="p-3 font-bold">
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] ${
                                student.role === 'bendahara'
                                  ? 'bg-[#EACEFF] border-black text-black'
                                  : 'bg-slate-100 border-slate-300 text-slate-700'
                              }`}>
                                {student.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${
                                isPaid
                                  ? 'bg-[#B8FFA9] border-black text-emerald-950'
                                  : 'bg-rose-200 border-black text-rose-950'
                              }`}>
                                {isPaid ? 'Lunas M1 (Rp 10.000) ✓' : 'Belum Membayar !'}
                              </span>
                            </td>
                            {canWriteCash && (
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => onToggleStudentPaid(student.nis)}
                                  className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-black transition-all ${
                                    isPaid
                                      ? 'bg-white hover:bg-slate-100 text-slate-700 shadow-xs'
                                      : 'bg-[#B8FFA9] hover:bg-[#a3f792] text-black shadow-xs'
                                  }`}
                                >
                                  {isPaid ? 'Batalkan' : '+ Tandai Lunas'}
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BUKU KAS UMUM (PC LEDGER TABLE) */}
          {activeTab === 'mutasi' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchTx}
                    onChange={(e) => setSearchTx(e.target.value)}
                    placeholder="Cari transaksi atau pencatat..."
                    className="w-full text-xs bg-slate-50 border-2 border-black rounded-xl pl-10 pr-3 py-2.5 font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                {canWriteCash && (
                  <button
                    onClick={onOpenCatatModal}
                    className="px-4 py-2 rounded-xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black border-2 border-black font-black text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Catat Mutasi Kas</span>
                  </button>
                )}
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-2xl border-2 border-black">
                <table className="w-full text-left text-xs font-space">
                  <thead className="bg-slate-100 border-b-2 border-black text-slate-700 font-black">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Jenis</th>
                      <th className="p-3">Keterangan</th>
                      <th className="p-3">Pos Anggaran</th>
                      <th className="p-3">Pencatat</th>
                      <th className="p-3 text-right">Nominal</th>
                      {canWriteCash && <th className="p-3 text-center">Aksi Audit</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y border-slate-200">
                    {transactions
                      .filter((tx) => {
                        const q = searchTx.toLowerCase();
                        return tx.description.toLowerCase().includes(q) || tx.inputBy.toLowerCase().includes(q);
                      })
                      .map((tx) => {
                        const isIn = tx.type === 'in';
                        const isReversed = tx.isReversed;
                        return (
                          <tr key={tx.id} className={`hover:bg-slate-50 ${isReversed ? 'bg-amber-50/70' : ''}`}>
                            <td className="p-3 font-mono font-bold text-slate-500">#{tx.id}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${
                                isIn ? 'bg-[#B8FFA9] border-black text-black' : 'bg-[#FFC6A8] border-black text-black'
                              }`}>
                                {isIn ? 'MASUK' : 'KELUAR'}
                              </span>
                            </td>
                            <td className="p-3 font-black text-black">
                              <span className={isReversed ? 'line-through text-slate-500' : ''}>
                                {tx.description}
                              </span>
                              {isReversed && (
                                <span className="ml-2 text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-200 border border-black text-amber-950">
                                  Dikoreksi
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-bold uppercase text-[10px] text-slate-600">Pos {tx.category}</td>
                            <td className="p-3 font-bold text-slate-700">{tx.inputBy}</td>
                            <td className={`p-3 text-right font-num font-black ${
                              isReversed ? 'line-through text-slate-400' : isIn ? 'text-emerald-800' : 'text-orange-900'
                            }`}>
                              {isIn ? '+' : '-'}{formatRupiah(tx.amount)}
                            </td>
                            {canWriteCash && (
                              <td className="p-3 text-center">
                                {!isReversed && !tx.isCorrection && (
                                  <button
                                    onClick={() => onSelectReversalTx(tx)}
                                    title="Koreksi transaksi ini"
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FEF08A] border border-black text-[11px] font-black flex items-center gap-1 mx-auto"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Koreksi</span>
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  );
};
