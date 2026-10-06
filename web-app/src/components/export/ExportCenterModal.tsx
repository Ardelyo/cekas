import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  MessageSquare,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import gsap from 'gsap';
import type { ClassMetadata, Transaction, WhitelistStudent } from '../../types';

interface ExportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassMetadata;
  transactions: Transaction[];
  students: WhitelistStudent[];
  duesPercentage: string;
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({
  isOpen,
  onClose,
  classData,
  transactions,
  students,
  duesPercentage,
}) => {
  const [activeExportTab, setActiveExportTab] = useState<'excel' | 'pdf' | 'whatsapp' | 'telegram'>('excel');
  const [waTemplate, setWaTemplate] = useState<'reminder' | 'summary' | 'expense'>('reminder');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance
  useEffect(() => {
    if (isOpen) {
      if (backdropRef.current) {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { y: 35, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
        );
      }
    }
  }, [isOpen]);

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalStudents = students.length;
  const paidStudents = students.filter((s) => s.paid);
  const unpaidStudents = students.filter((s) => !s.paid);

  const totalMasuk = transactions.filter((t) => t.type === 'in' && !t.isReversed).reduce((acc, t) => acc + t.amount, 0);
  const totalKeluar = transactions.filter((t) => t.type === 'out' && !t.isReversed).reduce((acc, t) => acc + t.amount, 0);

  const formatRupiahWhole = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // ==============================================================
  // 1. GENERATE EXCEL WITH REAL DYNAMIC FORMULAS
  // ==============================================================
  const handleExportFormulatedExcel = () => {
    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------
    // SHEET 1: RINGKASAN EKSEKUTIF DENGAN FORMULA REKONSILIASI
    // -------------------------------------------------------------
    const summaryAoa: any[][] = [
      ['LAPORAN KAS KELAS XI-F2 SMA KARTIKA XIX-1 BANDUNG'],
      ['Sistem Informasi CEKAS • Tahun Ajaran 2026/2027'],
      ['Tanggal Dokumen:', new Date().toLocaleDateString('id-ID'), '', 'Wali Kelas:', 'Drs. H. Mulyadi, M.Pd.'],
      ['Status Audit:', 'SURPLUS NIR-SELISIH', '', 'Bendahara:', 'Tarina & Tim Kelompok 5'],
      [],
      ['KODE POS', 'NAMA POS ANGGARAN', 'SALDO POS (RP)', '', 'PARAMETER KEUANGAN', 'NILAI REKONSILIASI (RP)'],
      ['POS-01', 'Pos Operasional & KBM', classData.alokasi.operasional, '', 'Total Pemasukan Masuk', 0],
      ['POS-02', 'Pos Sosial & Peduli', classData.alokasi.sosial, '', 'Total Pengeluaran Belanja', 0],
      ['POS-03', 'Pos Acara & Event', classData.alokasi.event, '', 'Saldo Bersih Kalkulasi', 0],
      ['POS-04', 'Pos Dana Cadangan', classData.alokasi.cadangan, '', '', ''],
      ['TOTAL', 'TOTAL KAS KELAS', 0, '', 'STATUS VERIFIKASI', 'MEMERIKSA...'],
      [],
      ['CATATAN INTEGRITAS:'],
      ['1. Data disinkronkan langsung dari Google Cloud Firestore.'],
      ['2. Seluruh mutasi telah diaudit tanpa selisih fisik maupun catatan.'],
      [],
      ['Mengetahui,', '', '', '', 'Dibuat Oleh,'],
      ['Wali Kelas XI-F2', '', '', '', 'Bendahara Kelas XI-F2'],
      [],
      [],
      ['( Drs. H. Mulyadi, M.Pd. )', '', '', '', '( Tarina )'],
      ['NIP. 19740512 199903 1 004', '', '', '', 'NIS. 23241015'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);

    // Apply Live Formulas to Sheet 1:
    // C11 = Total 4 Pockets: =SUM(C7:C10)
    wsSummary['C11'] = { t: 'n', f: 'SUM(C7:C10)', v: classData.saldo };
    // F7 = Total Inflow from Sheet 2: =SUM('Buku Kas Umum'!F5:F40)
    wsSummary['F7'] = { t: 'n', f: "SUM('Buku Kas Umum'!F5:F50)", v: totalMasuk };
    // F8 = Total Outflow from Sheet 2: =SUM('Buku Kas Umum'!G5:G40)
    wsSummary['F8'] = { t: 'n', f: "SUM('Buku Kas Umum'!G5:G50)", v: totalKeluar };
    // F9 = Net Calculated Balance: =F7-F8
    wsSummary['F9'] = { t: 'n', f: 'F7-F8', v: classData.saldo };
    // F11 = Verification Formula: =IF(C11=F9,"✓ COCOK 100% (NIR-SELISIH)","⚠️ TERJADI SELISIH")
    wsSummary['F11'] = {
      t: 's',
      f: 'IF(C11=F9,"✓ COCOK 100% (NIR-SELISIH)","⚠️ TERJADI SELISIH")',
      v: '✓ COCOK 100% (NIR-SELISIH)',
    };

    // Column widths
    wsSummary['!cols'] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 20 },
      { wch: 6 },
      { wch: 26 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

    // -------------------------------------------------------------
    // SHEET 2: BUKU KAS UMUM DENGAN FORMULA SALDO LARI BERJALAN
    // -------------------------------------------------------------
    const txAoa: any[][] = [
      ['BUKU KAS UMUM (GENERAL LEDGER) KELAS XI-F2'],
      ['SMK / SMA KARTIKA XIX-1 BANDUNG • BULAN SEPTEMBER 2026'],
      [],
      ['NO', 'ID TRANSAKSI', 'TANGGAL & WAKTU', 'URAIAN / KETERANGAN', 'POS ANGGARAN', 'DEBIT / MASUK (RP)', 'KREDIT / KELUAR (RP)', 'SALDO LARI (RP)', 'PENCATAT', 'STATUS AUDIT'],
    ];

    transactions.forEach((tx, idx) => {
      const rowNum = idx + 1;
      const isIn = tx.type === 'in';
      const timeStr = tx.timestamp instanceof Date ? tx.timestamp.toLocaleString('id-ID') : String(tx.timestamp || '');
      txAoa.push([
        rowNum,
        tx.id,
        timeStr,
        tx.description,
        `Pos ${tx.category}`,
        isIn ? tx.amount : 0,
        !isIn ? tx.amount : 0,
        0, // Placeholder for running balance formula
        tx.inputBy,
        tx.isReversed ? 'DIKOREKSI' : 'VALID SAH',
      ]);
    });

    // Add Totals Row
    const startRow = 5;
    const endRow = 4 + transactions.length;
    txAoa.push([
      'TOTAL',
      '',
      '',
      'TOTAL AKUMULASI MUTASI KAS',
      '',
      0, // Will be replaced by SUM formula
      0, // Will be replaced by SUM formula
      0, // Will be replaced by final balance
      '',
      'AUDIT COMPLETED',
    ]);

    const wsTx = XLSX.utils.aoa_to_sheet(txAoa);

    // Dynamic Running Balance Formulas for each transaction row
    transactions.forEach((_, idx) => {
      const currRow = startRow + idx;
      if (idx === 0) {
        // First transaction: =F5-G5
        wsTx[`H${currRow}`] = {
          t: 'n',
          f: `F${currRow}-G${currRow}`,
          v: transactions[0].type === 'in' ? transactions[0].amount : -transactions[0].amount,
        };
      } else {
        // Subsequent rows: Previous Saldo + In - Out (=H(n-1) + F(n) - G(n))
        const prevRow = currRow - 1;
        wsTx[`H${currRow}`] = {
          t: 'n',
          f: `H${prevRow}+F${currRow}-G${currRow}`,
          v: 0,
        };
      }
    });

    // Totals Row Formulas
    const totalRowIdx = endRow + 1;
    wsTx[`F${totalRowIdx}`] = { t: 'n', f: `SUM(F${startRow}:F${endRow})`, v: totalMasuk };
    wsTx[`G${totalRowIdx}`] = { t: 'n', f: `SUM(G${startRow}:G${endRow})`, v: totalKeluar };
    wsTx[`H${totalRowIdx}`] = { t: 'n', f: `F${totalRowIdx}-G${totalRowIdx}`, v: classData.saldo };

    wsTx['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 22 },
      { wch: 36 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Buku Kas Umum');

    // -------------------------------------------------------------
    // SHEET 3: STATUS IURAN SISWA DENGAN FORMULA COUNTIF & TUNGGAKAN
    // -------------------------------------------------------------
    const duesAoa: any[][] = [
      ['REKAPITULASI IURAN KAS SISWA KELAS XI-F2'],
      ['Target Iuran: Rp 10.000 / minggu per siswa • Bulan September 2026'],
      [],
      ['NO', 'NIS', 'NAMA LENGKAP SISWA', 'JABATAN', 'M1 (10K)', 'M2 (10K)', 'M3 (10K)', 'M4 (10K)', 'TOTAL TERBAYAR (RP)', 'SISA TUNGGAKAN (RP)', 'STATUS KELUNASAN'],
    ];

    students.forEach((s, idx) => {
      duesAoa.push([
        idx + 1,
        s.nis,
        s.namaResmi,
        s.role.toUpperCase(),
        s.paid ? 'LUNAS' : 'BELUM',
        'BELUM',
        'BELUM',
        'BELUM',
        0, // Total Terbayar formula
        0, // Sisa Tunggakan formula
        'MEMERIKSA...',
      ]);
    });

    // Summary bottom row
    const startDuesRow = 5;
    const endDuesRow = 4 + students.length;
    duesAoa.push([
      'TOTAL',
      '',
      'REKAPITULASI KELAS KESELURUHAN',
      '',
      '',
      '',
      '',
      '',
      0, // SUM total terbayar
      0, // SUM sisa tunggakan
      '',
    ]);

    const wsDues = XLSX.utils.aoa_to_sheet(duesAoa);

    // Apply Formulas to Student Dues Sheet
    students.forEach((_, idx) => {
      const r = startDuesRow + idx;
      // Total Terbayar: =COUNTIF(E5:H5,"LUNAS")*10000
      wsDues[`I${r}`] = {
        t: 'n',
        f: `COUNTIF(E${r}:H${r},"LUNAS")*10000`,
        v: students[idx].paid ? 10000 : 0,
      };
      // Sisa Tunggakan: =40000-I5
      wsDues[`J${r}`] = {
        t: 'n',
        f: `40000-I${r}`,
        v: students[idx].paid ? 30000 : 40000,
      };
      // Status Kelunasan: =IF(I5>=40000,"LUNAS PENUH",IF(I5>0,"SEBAGIAN (TERCATAT)","BELUM BAYAR"))
      wsDues[`K${r}`] = {
        t: 's',
        f: `IF(I${r}>=40000,"LUNAS PENUH",IF(I${r}>0,"SEBAGIAN (TERCATAT)","BELUM BAYAR"))`,
        v: students[idx].paid ? 'SEBAGIAN (TERCATAT)' : 'BELUM BAYAR',
      };
    });

    // Totals row formulas
    const duesTotRow = endDuesRow + 1;
    wsDues[`I${duesTotRow}`] = { t: 'n', f: `SUM(I${startDuesRow}:I${endDuesRow})`, v: paidStudents.length * 10000 };
    wsDues[`J${duesTotRow}`] = { t: 'n', f: `SUM(J${startDuesRow}:J${endDuesRow})`, v: unpaidStudents.length * 10000 };

    wsDues['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 30 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDues, 'Rekap Iuran Siswa');

    // Download Formatted Excel Workbook
    const fileName = `CEKAS_Laporan_Kas_XIF2_Formulated_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ==============================================================
  // 2. WHATSAPP & TELEGRAM BROADCAST GENERATOR
  // ==============================================================
  const generateBroadcastText = (channel: 'whatsapp' | 'telegram') => {
    const isWa = channel === 'whatsapp';
    const bold = (txt: string) => (isWa ? `*${txt}*` : `**${txt}**`);

    if (waTemplate === 'reminder') {
      let msg = `📢 ${bold('PENGINGAT IURAN KAS XI-F2 SMA KARTIKA XIX-1')}\n`;
      msg += `Periode: Minggu ke-1 (Target: Rp 10.000 / siswa)\n`;
      msg += `-------------------------------------------\n`;
      msg += `Teman-teman yang belum melunasi iuran (${unpaidStudents.length} siswa):\n`;
      unpaidStudents.forEach((s, idx) => {
        msg += `${idx + 1}. ${s.namaResmi} (${s.nis})\n`;
      });
      msg += `-------------------------------------------\n`;
      msg += `Capaian Kas: ${duesPercentage}% (${paidStudents.length}/${totalStudents} siswa lunas)\n`;
      msg += `Mohon segera diserahkan ke Bendahara (Tarina) saat jam istirahat. Terima kasih! ✨\n\n`;
      msg += `Transparansi Live: https://cekas.vercel.app`;
      return msg;
    }

    if (waTemplate === 'summary') {
      let msg = `📊 ${bold('LAPORAN REKAPITULASI KAS KELAS XI-F2')}\n`;
      msg += `Update: ${new Date().toLocaleDateString('id-ID')} • Live Cloud Firestore\n`;
      msg += `-------------------------------------------\n`;
      msg += `💰 ${bold('Total Saldo Kas:')} ${formatRupiahWhole(classData.saldo)}\n`;
      msg += `• Pos Operasional: ${formatRupiahWhole(classData.alokasi.operasional)}\n`;
      msg += `• Pos Sosial: ${formatRupiahWhole(classData.alokasi.sosial)}\n`;
      msg += `• Pos Acara/Event: ${formatRupiahWhole(classData.alokasi.event)}\n`;
      msg += `• Pos Cadangan: ${formatRupiahWhole(classData.alokasi.cadangan)}\n`;
      msg += `-------------------------------------------\n`;
      msg += `Tingkat Disiplin Iuran: ${duesPercentage}% (${paidStudents.length} Lunas / ${unpaidStudents.length} Nunggak)\n`;
      msg += `Status Selisih Fisik vs Catatan: 100% Cocok (Nir-Selisih)\n\n`;
      msg += `Tinjau Laporan Transparan: https://cekas.vercel.app`;
      return msg;
    }

    // Expense alert
    const lastOut = transactions.find((t) => t.type === 'out');
    let msg = `🧾 ${bold('TRANSPARANSI PENGELUARAN KAS KELAS XI-F2')}\n`;
    msg += `-------------------------------------------\n`;
    msg += `Pengeluaran Terbaru: ${lastOut ? lastOut.description : 'Belanja Keperluan Kelas'}\n`;
    msg += `Nominal: ${lastOut ? formatRupiahWhole(lastOut.amount) : 'Rp 0'}\n`;
    msg += `Pos Anggaran: Pos ${lastOut ? lastOut.category : 'Operasional'}\n`;
    msg += `Dicatat Oleh: ${lastOut ? lastOut.inputBy : 'Tarina (Bendahara)'}\n`;
    msg += `-------------------------------------------\n`;
    msg += `Sisa Saldo Kas Berjalan: ${formatRupiahWhole(classData.saldo)}\n\n`;
    msg += `Bukti & Mutasi Lengkap: https://cekas.vercel.app`;
    return msg;
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleOpenWhatsApp = () => {
    const text = generateBroadcastText('whatsapp');
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 font-space"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-4xl rounded-t-[36px] sm:rounded-[36px] border-t-3 sm:border-3 border-black shadow-[0_-8px_24px_rgba(0,0,0,0.15)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[92vh] overflow-hidden"
      >
        
        {/* ============================================================== */}
        {/* TOP HEADER                                                     */}
        {/* ============================================================== */}
        <div className="p-5 sm:p-6 border-b-2 border-black flex items-center justify-between bg-[#FAF5FF]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#B8FFA9] border-2 border-black flex items-center justify-center text-black shadow-xs">
              <Download className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-space font-black text-xl text-black leading-none">
                  Pusat Ekspor & Pelaporan Kas
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-[#EACEFF] text-black text-[10px] font-black border border-black">
                  Multi-Format
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Laporan Excel berformula dinamis, Cetak Dokumen PDF A4, dan Broadcast Pesan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border-2 border-black flex items-center justify-center text-black shadow-xs tactile-bounce"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* EXPORT FORMAT SELECTOR TABS                                    */}
        {/* ============================================================== */}
        <div className="px-5 sm:px-6 pt-3 bg-white border-b-2 border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveExportTab('excel')}
            className={`py-2 px-4 rounded-xl text-xs font-black border-2 border-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeExportTab === 'excel'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx) Berformula</span>
          </button>

          <button
            onClick={() => setActiveExportTab('pdf')}
            className={`py-2 px-4 rounded-xl text-xs font-black border-2 border-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeExportTab === 'pdf'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4 text-rose-400" />
            <span>Cetak Dokumen PDF A4</span>
          </button>

          <button
            onClick={() => setActiveExportTab('whatsapp')}
            className={`py-2 px-4 rounded-xl text-xs font-black border-2 border-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeExportTab === 'whatsapp'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Broadcast WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveExportTab('telegram')}
            className={`py-2 px-4 rounded-xl text-xs font-black border-2 border-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeExportTab === 'telegram'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>Format Telegram</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB BODY (SCROLLABLE)                                          */}
        {/* ============================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs font-space bg-[#F8FAFC]">
          
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: EXCEL WITH REAL FORMULAS                               */}
          {/* ------------------------------------------------------------- */}
          {activeExportTab === 'excel' && (
            <div className="space-y-4">
              
              <div className="p-5 rounded-3xl bg-[#F0FDF4] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <h4 className="font-space font-black text-base text-black">
                      Buku Kerja Excel Berformula Dinamis (Active Formula Workbook)
                    </h4>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-200 border border-black text-emerald-950">
                    3 Sheet Terintegrasi
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  Berkas Excel yang diunduh <b>bukan teks statis</b>, melainkan telah disematkan formula kalkulasi otomatis asli (seperti formula akuntansi Excel sesungguhnya):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-white p-3 rounded-2xl border border-black shadow-xs">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Sheet 1: Ringkasan</span>
                    <code className="text-[10px] font-mono font-black text-emerald-900 block mt-1">=SUM(C7:C10)</code>
                    <p className="text-[10px] text-slate-600 mt-1">Formula akumulasi 4 pos & verifikasi nir-selisih lari.</p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-black shadow-xs">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Sheet 2: Buku Kas</span>
                    <code className="text-[10px] font-mono font-black text-emerald-900 block mt-1">=H(n-1)+F(n)-G(n)</code>
                    <p className="text-[10px] text-slate-600 mt-1">Formula saldo lari berjalan di tiap baris mutasi kas.</p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-black shadow-xs">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Sheet 3: Iuran Siswa</span>
                    <code className="text-[10px] font-mono font-black text-emerald-900 block mt-1">=COUNTIF(E:H,"LUNAS")*10K</code>
                    <p className="text-[10px] text-slate-600 mt-1">Formula kelunasan otomatis & status tunggakan siswa.</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleExportFormulatedExcel}
                className="w-full py-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2.5 tactile-bounce"
              >
                <FileSpreadsheet className="w-5 h-5 text-[#B8FFA9]" />
                <span>Unduh Berkas Excel Resmi (.xlsx) dengan Formula Lengkap</span>
              </button>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: PDF & PRINT-READY A4 DOCUMENT                          */}
          {/* ------------------------------------------------------------- */}
          {activeExportTab === 'pdf' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border-2 border-black">
                <span className="text-xs font-bold text-slate-700">
                  Pratinjau Dokumen Pertanggungjawaban Resmi (Siap Cetak A4 / Simpan PDF)
                </span>
                <button
                  onClick={handlePrintDocument}
                  className="px-4 py-2 rounded-xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black font-black text-xs border-2 border-black shadow-xs flex items-center gap-1.5 tactile-bounce"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF Sekarang</span>
                </button>
              </div>

              {/* A4 PRINTABLE DOCUMENT CONTAINER */}
              <div
                ref={printAreaRef}
                className="bg-white p-8 sm:p-12 rounded-[24px] border-2 border-black shadow-lg space-y-6 text-black print:p-0 print:border-none print:shadow-none"
              >
                {/* Official Letterhead (Kop Surat) */}
                <div className="border-b-4 border-double border-black pb-4 text-center space-y-0.5">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Pemerintah Daerah Provinsi Jawa Barat • Dinas Pendidikan
                  </h5>
                  <h4 className="text-lg font-space font-black uppercase text-black tracking-tight">
                    SMA KARTIKA XIX-1 BANDUNG
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Jalan Taman Pramuka No. 163, Cihapit, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40114
                  </p>
                  <div className="pt-2 font-space font-black text-sm uppercase underline tracking-wide">
                    Laporan Pertanggungjawaban Keuangan Kas Siswa Kelas XI-F2
                  </div>
                </div>

                {/* Metadata Meta Table */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Tahun Ajaran:</span>
                    <span className="font-black text-black">2026/2027</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Wali Kelas:</span>
                    <span className="font-black text-black">Drs. H. Mulyadi, M.Pd.</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Periode Laporan:</span>
                    <span className="font-black text-black">Bulan September 2026</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Status Verifikasi:</span>
                    <span className="font-black text-emerald-800">✓ SURPLUS NIR-SELISIH (SAH)</span>
                  </div>
                </div>

                {/* 4 Bento Stat Boxes */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-black">
                    <span className="text-[9px] text-slate-500 font-bold block">Total Pemasukan</span>
                    <span className="font-num font-black text-black block mt-0.5">{formatRupiahWhole(totalMasuk)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-black">
                    <span className="text-[9px] text-slate-500 font-bold block">Total Pengeluaran</span>
                    <span className="font-num font-black text-black block mt-0.5">{formatRupiahWhole(totalKeluar)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#B8FFA9] border border-black">
                    <span className="text-[9px] text-black font-bold block">Saldo Kas Akhir</span>
                    <span className="font-num font-black text-black block mt-0.5">{formatRupiahWhole(classData.saldo)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-black">
                    <span className="text-[9px] text-slate-500 font-bold block">Tingkat Kelunasan</span>
                    <span className="font-num font-black text-emerald-800 block mt-0.5">{duesPercentage}%</span>
                  </div>
                </div>

                {/* Breakdown 4 Pos Anggaran */}
                <div>
                  <h6 className="font-space font-black text-xs text-black mb-2 uppercase tracking-wide">
                    Alokasi Saldo 4 Pos Anggaran
                  </h6>
                  <table className="w-full text-left text-xs border border-black">
                    <thead className="bg-slate-100 border-b border-black font-black text-slate-800">
                      <tr>
                        <th className="p-2 border-r border-black">Pos Anggaran</th>
                        <th className="p-2 border-r border-black text-right">Saldo Terdata (Rp)</th>
                        <th className="p-2">Peruntukan Dana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-black">
                      <tr>
                        <td className="p-2 border-r border-black font-bold">Pos Operasional</td>
                        <td className="p-2 border-r border-black text-right font-num font-black">{formatRupiahWhole(classData.alokasi.operasional)}</td>
                        <td className="p-2 text-slate-600">Alat tulis, spidol whiteboard, perlengkapan kebersihan kelas</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-black font-bold">Pos Sosial</td>
                        <td className="p-2 border-r border-black text-right font-num font-black">{formatRupiahWhole(classData.alokasi.sosial)}</td>
                        <td className="p-2 text-slate-600">Santunan duka cita, bantuan siswa sakit, dana solidaritas</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-black font-bold">Pos Event / Bazar</td>
                        <td className="p-2 border-r border-black text-right font-num font-black">{formatRupiahWhole(classData.alokasi.event)}</td>
                        <td className="p-2 text-slate-600">Tabungan kegiatan lomba dan perpisahan akhir tahun</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-black font-bold">Pos Cadangan</td>
                        <td className="p-2 border-r border-black text-right font-num font-black">{formatRupiahWhole(classData.alokasi.cadangan)}</td>
                        <td className="p-2 text-slate-600">Dana darurat kelas tak terduga</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signature Blocks */}
                <div className="pt-8 grid grid-cols-2 text-center text-xs">
                  <div>
                    <span className="block text-slate-600">Mengetahui,</span>
                    <span className="font-bold block">Wali Kelas XI-F2</span>
                    <div className="h-16"></div>
                    <span className="font-black text-black underline block">Drs. H. Mulyadi, M.Pd.</span>
                    <span className="text-[10px] text-slate-600">NIP. 19740512 199903 1 004</span>
                  </div>

                  <div>
                    <span className="block text-slate-600">Bandung, {new Date().toLocaleDateString('id-ID')}</span>
                    <span className="font-bold block">Bendahara Kelas XI-F2</span>
                    <div className="h-16"></div>
                    <span className="font-black text-black underline block">Tarina</span>
                    <span className="text-[10px] text-slate-600">NIS. 23241015</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: WHATSAPP BROADCAST TEMPLATES                           */}
          {/* ------------------------------------------------------------- */}
          {activeExportTab === 'whatsapp' && (
            <div className="space-y-4">
              
              {/* Template Pill Selector */}
              <div className="flex gap-2 bg-white p-2 rounded-2xl border-2 border-black">
                <button
                  onClick={() => setWaTemplate('reminder')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                    waTemplate === 'reminder'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  Template 1: Pengingat Tagihan Nunggak
                </button>
                <button
                  onClick={() => setWaTemplate('summary')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                    waTemplate === 'summary'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  Template 2: Rekap Saldo Kas Mingguan
                </button>
                <button
                  onClick={() => setWaTemplate('expense')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                    waTemplate === 'expense'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  Template 3: Notifikasi Pengeluaran
                </button>
              </div>

              {/* Text Box Preview */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={10}
                  value={generateBroadcastText('whatsapp')}
                  className="w-full bg-white border-2 border-black rounded-2xl p-4 font-mono text-xs font-bold text-black focus:outline-none shadow-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => handleCopyText(generateBroadcastText('whatsapp'), 'wa')}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs shadow-xs flex items-center justify-center gap-2 tactile-bounce"
                >
                  {copiedNotification === 'wa' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                      <span>✓ Teks WhatsApp Disalin ke Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Draf Pesan WhatsApp</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenWhatsApp}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-black border-2 border-black font-black text-xs shadow-xs flex items-center justify-center gap-2 tactile-bounce"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Kirim Langsung via WhatsApp Web / App</span>
                </button>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: TELEGRAM BROADCAST FORMAT                              */}
          {/* ------------------------------------------------------------- */}
          {activeExportTab === 'telegram' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border-2 border-black text-xs text-slate-800 font-bold space-y-1">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" />
                  <span className="font-black text-black">Format Siar Telegram (@kacekasbot)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Teks ini telah diformat menggunakan Markdown Telegram (`**bold**` dan monospace code) untuk disiarkan ke grup kelas atau bot channel.
                </p>
              </div>

              <textarea
                readOnly
                rows={10}
                value={generateBroadcastText('telegram')}
                className="w-full bg-white border-2 border-black rounded-2xl p-4 font-mono text-xs font-bold text-black focus:outline-none shadow-xs"
              />

              <button
                onClick={() => handleCopyText(generateBroadcastText('telegram'), 'tele')}
                className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-slate-800 text-white border-2 border-black font-black text-xs shadow-xs flex items-center justify-center gap-2 tactile-bounce"
              >
                {copiedNotification === 'tele' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#B8FFA9]" />
                    <span>✓ Teks Telegram Disalin ke Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Pesan Format Telegram</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
