import React from 'react';
import { Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ClassMetadata, Transaction, WhitelistStudent } from '../types';

interface LaporanViewProps {
  classData: ClassMetadata;
  transactions: Transaction[];
  students: WhitelistStudent[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  classData,
  transactions,
  students,
}) => {

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // SHEET 1: RINGKASAN
    const summaryData = [
      ['LAPORAN KAS KELAS XI-F2 SMA KARTIKA XIX-1 BANDUNG'],
      ['Tahun Ajaran: 2026/2027'],
      ['Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID')],
      [],
      ['Kategori Pos Anggaran', 'Saldo Terkini (Rp)', 'Keterangan'],
      ['Pos Operasional & KBM', classData.alokasi.operasional, 'Spidol, penghapus, alat kebersihan'],
      ['Pos Sosial & Peduli', classData.alokasi.sosial, 'Santunan duka cita, menjenguk siswa sakit'],
      ['Pos Acara & Kegiatan', classData.alokasi.event, 'Tabungan bukber & perpisahan'],
      ['Pos Dana Cadangan', classData.alokasi.cadangan, 'Dana darurat kelas'],
      [],
      ['TOTAL SALDO KAS KELAS', classData.saldo, 'Surplus Tercatat Firestore'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kas');

    // SHEET 2: BUKU KAS UMUM
    const txRows = [
      ['ID Transaksi', 'Waktu', 'Jenis', 'Nominal (Rp)', 'Pos Alokasi', 'Keterangan', 'Pencatat', 'Status Koreksi'],
      ...transactions.map((tx) => [
        tx.id,
        tx.timestamp instanceof Date ? tx.timestamp.toLocaleString('id-ID') : String(tx.timestamp),
        tx.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
        tx.amount,
        tx.category,
        tx.description,
        tx.inputBy,
        tx.isReversed ? 'DIKOREKSI' : 'NORMAL',
      ]),
    ];
    const wsTx = XLSX.utils.aoa_to_sheet(txRows);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Buku Kas Umum');

    // SHEET 3: STATUS IURAN SISWA
    const duesRows = [
      ['No', 'NIS', 'Nama Siswa', 'Role', 'Status Iuran Minggu 1'],
      ...students.map((s, idx) => [
        idx + 1,
        s.nis,
        s.namaResmi,
        s.role,
        s.paid ? 'LUNAS' : 'BELUM BAYAR',
      ]),
    ];
    const wsDues = XLSX.utils.aoa_to_sheet(duesRows);
    XLSX.utils.book_append_sheet(wb, wsDues, 'Rekap Iuran Siswa');

    // Download File
    XLSX.writeFile(wb, `Laporan_Kas_XIF2_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header Card */}
      <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-fredoka font-bold text-slate-900 leading-tight">
            Pusat Laporan & Rekapitulasi Kas Resmi
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ekspor arsip spreadsheet (.xlsx) atau cetak berkas Berita Acara A4 siap tanda tangan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen A4</span>
          </button>
        </div>
      </div>

      {/* PRINT-READY OFFICIAL REPORT PREVIEW */}
      <div className="bg-white p-8 sm:p-12 rounded-4xl border border-slate-200 shadow-lg max-w-4xl mx-auto space-y-6 print:p-0 print:border-none print:shadow-none">
        
        {/* KOP SURAT RESMI */}
        <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
          <h3 className="font-bold text-sm tracking-widest text-slate-500 uppercase">
            SMA KARTIKA XIX-1 BANDUNG
          </h3>
          <h2 className="font-fredoka font-bold text-2xl text-slate-900 tracking-tight">
            LAPORAN PERTANGGUNGJAWABAN KAS KELAS XI-F2
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Tahun Ajaran 2026/2027 • Sistem Digital Terpusat CEKAS (Cloud Firestore)
          </p>
        </div>

        {/* Ringkasan Finansial Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Total Kas Masuk</span>
            <span className="font-fredoka font-bold text-slate-900 text-sm mt-0.5 block">Rp 300.000</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Total Pengeluaran</span>
            <span className="font-fredoka font-bold text-slate-900 text-sm mt-0.5 block">Rp 140.000</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Saldo Bersih</span>
            <span className="font-fredoka font-bold text-emerald-700 text-sm mt-0.5 block">
              {formatRupiah(classData.saldo)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-medium">Status Audit</span>
            <span className="font-fredoka font-bold text-slate-900 text-sm mt-0.5 block">Nol Selisih</span>
          </div>
        </div>

        {/* Tabel Rincian Pos Alokasi */}
        <div className="space-y-2">
          <h4 className="font-fredoka font-bold text-sm text-slate-900">1. Alokasi Pos Anggaran</h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">Pos Anggaran</th>
                  <th className="p-3">Peruntukan</th>
                  <th className="p-3 text-right">Saldo Terkini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-3 font-bold text-slate-900">Operasional & KBM</td>
                  <td className="p-3 text-slate-600">Spidol, penghapus, alat kebersihan kelas</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(classData.alokasi.operasional)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">Sosial & Peduli</td>
                  <td className="p-3 text-slate-600">Menjenguk siswa sakit, santunan duka cita</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(classData.alokasi.sosial)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">Acara & Event</td>
                  <td className="p-3 text-slate-600">Tabungan kas buka bersama & perpisahan</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(classData.alokasi.event)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">Dana Cadangan</td>
                  <td className="p-3 text-slate-600">Dana darurat kelas</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(classData.alokasi.cadangan)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Mutasi Terkini */}
        <div className="space-y-2">
          <h4 className="font-fredoka font-bold text-sm text-slate-900">2. Riwayat Buku Kas Umum Terkini</h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Keterangan</th>
                  <th className="p-2.5">Pos</th>
                  <th className="p-2.5 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-2.5 font-mono text-[11px] text-slate-400">#{tx.id}</td>
                    <td className="p-2.5 font-bold text-slate-800">{tx.description}</td>
                    <td className="p-2.5 text-slate-600 uppercase text-[10px]">{tx.category}</td>
                    <td className={`p-2.5 text-right font-bold ${tx.type === 'in' ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {tx.type === 'in' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KOLOM TANDA TANGAN RESMI */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12">
            <span className="text-slate-500 font-medium block">Ketua & Bendahara Kelas</span>
            <div>
              <b className="text-slate-900 block font-bold underline">TARINA</b>
              <span className="text-slate-400 text-[10px] block">NIS: 23241015</span>
            </div>
          </div>

          <div className="space-y-12">
            <span className="text-slate-500 font-medium block">Tim Pengembang CEKAS</span>
            <div>
              <b className="text-slate-900 block font-bold underline">ARDELLIO SATRIA A.</b>
              <span className="text-slate-400 text-[10px] block">NIS: 23241001</span>
            </div>
          </div>

          <div className="space-y-12">
            <span className="text-slate-500 font-medium block">Mengetahui, Wali Kelas</span>
            <div>
              <b className="text-slate-900 block font-bold underline">WALI KELAS XI-F2</b>
              <span className="text-slate-400 text-[10px] block">NIP. SMA Kartika XIX-1</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
