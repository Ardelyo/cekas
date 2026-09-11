import React, { useState, useEffect } from 'react';
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  Clock,
  FileText,
  Calendar,
  Search,
  Plus,
  ArrowRight,
  Download,
  CheckCircle,
  AlertCircle,
  Heart,
  MessageSquare,
  ThumbsUp,
  LayoutGrid,
  Smartphone,
  Monitor
} from 'lucide-react';
import { doc, collection, onSnapshot, runTransaction, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import type { ClassMetadata, Transaction, WhitelistStudent, FinancialMood } from './types';
import { AnimatedMascot } from './components/AnimatedMascot';
import { TransactionModal } from './components/TransactionModal';

// Initial class fallback state
const INITIAL_CLASS_STATE: ClassMetadata = {
  id: 'XI-F2',
  nama: 'Kelas XI-F2 SMA Kartika XIX-1 Bandung',
  tahun_ajaran: '2026/2027',
  saldo: 160000,
  alokasi: {
    operasional: 110000,
    sosial: 50000,
    event: 0,
    cadangan: 0,
  },
};

// Initial student roster
const INITIAL_STUDENTS: WhitelistStudent[] = [
  { nis: '23241001', namaResmi: 'Ardellio Satria Anindito', role: 'siswa', paid: true },
  { nis: '23241015', namaResmi: 'Tarina', role: 'bendahara', paid: true },
  { nis: '23241020', namaResmi: 'Nabila', role: 'siswa', paid: true },
  { nis: '23241025', namaResmi: 'Cinta', role: 'siswa', paid: true },
  { nis: '23241005', namaResmi: 'Budi Santoso', role: 'siswa', paid: true },
  { nis: '23241008', namaResmi: 'Dwi Cahyo', role: 'siswa', paid: false },
  { nis: '23241012', namaResmi: 'Farhan Maulana', role: 'siswa', paid: true },
  { nis: '23241018', namaResmi: 'Gita Pratiwi', role: 'siswa', paid: false },
  { nis: '23241022', namaResmi: 'Rian Hidayat', role: 'siswa', paid: true },
  { nis: '23241028', namaResmi: 'Zahra Amelia', role: 'siswa', paid: true },
  { nis: '23241031', namaResmi: 'Ahmad Fauzi', role: 'siswa', paid: true },
  { nis: '23241035', namaResmi: 'Bayu Pratama', role: 'siswa', paid: true },
];

export const App: React.FC = () => {
  // Live State
  const [classData, setClassData] = useState<ClassMetadata>(INITIAL_CLASS_STATE);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx_101',
      type: 'in',
      amount: 10000,
      category: 'operasional',
      description: 'Iuran kas Ardellio (M1)',
      inputBy: 'Tarina',
      timestamp: new Date(),
    },
    {
      id: 'tx_102',
      type: 'out',
      amount: 15000,
      category: 'operasional',
      description: 'Beli spidol whiteboard & isi tinta',
      inputBy: 'Tarina',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'tx_103',
      type: 'in',
      amount: 25000,
      category: 'sosial',
      description: 'Donasi santunan duka cita',
      inputBy: 'Tarina',
      timestamp: new Date(Date.now() - 86400000),
    },
  ]);
  const [students, setStudents] = useState<WhitelistStudent[]>(INITIAL_STUDENTS);

  // UI state
  const [activeMood, setActiveMood] = useState<FinancialMood>('aman');
  const [activeView, setActiveView] = useState<'desktop' | 'showcase' | 'mobile'>('desktop');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [nisSearchInput, setNisSearchInput] = useState<string>('');
  const [nisSearchResult, setNisSearchResult] = useState<{ found: boolean; student?: WhitelistStudent } | null>(null);
  const [studentSearchFilter, setStudentSearchFilter] = useState<string>('');
  const [votingSubmitted, setVotingSubmitted] = useState<string | null>(null);

  // Connect to Google Cloud Firestore (onSnapshot Real-time Listener)
  useEffect(() => {
    try {
      const classRef = doc(db, 'classes', 'XI-F2');
      const unsubscribeClass = onSnapshot(classRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setClassData((prev) => ({
            ...prev,
            saldo: Number(data.saldo) || prev.saldo,
            alokasi: data.alokasi || prev.alokasi,
            nama: data.nama || prev.nama,
          }));
        }
      });

      const txQuery = query(collection(db, 'classes', 'XI-F2', 'transactions'), orderBy('timestamp', 'desc'), limit(10));
      const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
        if (!snapshot.empty) {
          const list: Transaction[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              type: data.type || 'in',
              amount: Number(data.amount) || 0,
              category: data.category || 'operasional',
              description: data.description || '',
              inputBy: data.inputBy || 'Bendahara',
              timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
              isReversed: data.isReversed || false,
            });
          });
          setTransactions(list);
        }
      });

      return () => {
        unsubscribeClass();
        unsubscribeTx();
      };
    } catch (err) {
      console.warn('Firestore offline or fallback mode enabled:', err);
    }
  }, []);

  // Format Indonesian Rupiah
  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Add new transaction
  const handleAddTransaction = async (data: {
    type: 'in' | 'out';
    amount: number;
    category: keyof ClassMetadata['alokasi'];
    description: string;
  }) => {
    const diff = data.type === 'in' ? data.amount : -data.amount;
    const newTotal = classData.saldo + diff;
    const newCatTotal = (classData.alokasi[data.category] || 0) + diff;

    // Local state update for immediate feedback
    setClassData((prev) => ({
      ...prev,
      saldo: newTotal,
      alokasi: {
        ...prev.alokasi,
        [data.category]: newCatTotal,
      },
    }));

    const newTx: Transaction = {
      id: 'tx_' + Date.now().toString().slice(-4),
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      inputBy: 'Tarina (Bendahara)',
      timestamp: new Date(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Firestore atomic commit
    try {
      const classRef = doc(db, 'classes', 'XI-F2');
      const newTxRef = doc(collection(db, 'classes', 'XI-F2', 'transactions'));

      await runTransaction(db, async (t) => {
        const snap = await t.get(classRef);
        let currSaldo = 0;
        let currAlokasi = { operasional: 0, sosial: 0, event: 0, cadangan: 0 };

        if (snap.exists()) {
          const d = snap.data();
          currSaldo = Number(d.saldo) || 0;
          currAlokasi = d.alokasi || currAlokasi;
        }

        const updatedSaldo = currSaldo + diff;
        currAlokasi[data.category] = (currAlokasi[data.category] || 0) + diff;

        t.set(classRef, { saldo: updatedSaldo, alokasi: currAlokasi, updatedAt: serverTimestamp() }, { merge: true });
        t.set(newTxRef, {
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          inputBy: 'Tarina',
          inputMethod: 'web',
          timestamp: serverTimestamp(),
        });
      });
    } catch (e) {
      console.warn('Committed to local state:', e);
    }
  };

  // Toggle student paid status
  const toggleStudentPaid = (nis: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.nis === nis) {
          const isNowPaid = !s.paid;
          if (isNowPaid) {
            // Trigger 10k cash entry
            handleAddTransaction({
              type: 'in',
              amount: 10000,
              category: 'operasional',
              description: `Iuran kas M1 - ${s.namaResmi} (${s.nis})`,
            });
          }
          return { ...s, paid: isNowPaid };
        }
        return s;
      })
    );
  };

  // Whitelist NIS Search
  const handleNisLookup = () => {
    if (!nisSearchInput.trim()) return;
    const found = students.find((s) => s.nis === nisSearchInput.trim());
    setNisSearchResult({ found: !!found, student: found });
  };

  // Export to CSV
  const handleExportCsv = () => {
    let csv = 'NIS,Nama Siswa,Role,Status Iuran M1\n';
    students.forEach((s) => {
      csv += `${s.nis},"${s.namaResmi}",${s.role},${s.paid ? 'Lunas' : 'Belum Bayar'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CEKAS_Iuran_XIF2_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Percentages & Ratios
  const totalSaldoSafe = classData.saldo > 0 ? classData.saldo : 1;
  const opsPct = ((classData.alokasi.operasional / totalSaldoSafe) * 100).toFixed(1);
  const sosPct = ((classData.alokasi.sosial / totalSaldoSafe) * 100).toFixed(1);

  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.paid).length;
  const unpaidCount = totalStudents - paidCount;
  const duesPercentage = ((paidCount / totalStudents) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-slate-800 antialiased flex flex-col font-sans">
      
      {/* ============================================================== */}
      {/* TOP NAVIGATION BAR (CLEAN LUCIDE ICONS, ZERO EMOJIS)          */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
              <Coins className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-fredoka font-bold text-xl text-slate-900 tracking-tight">CEKAS</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  v2.5 Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Catatan Keuangan • Kelas XI-F2 SMA Kartika XIX-1 Bandung</p>
            </div>
          </div>

          {/* Device View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveView('desktop')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeView === 'desktop' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop Bento
            </button>
            <button
              onClick={() => setActiveView('showcase')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeView === 'showcase' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              3-Phone Showcase
            </button>
            <button
              onClick={() => setActiveView('mobile')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeView === 'mobile' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile App
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#BBF7D0] text-emerald-950 hover:bg-emerald-300 transition-all border border-emerald-300 shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-800" />
              Catat Transaksi
            </button>
            <a
              href="https://t.me/kacekasbot"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              @kacekasbot
            </a>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* VIEW 1: DESKTOP BENTO GRID DASHBOARD                           */}
      {/* ============================================================== */}
      {activeView === 'desktop' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Top Metric Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Total Kas Card (Peach) */}
            <div className="bg-[#FED7AA] p-5 rounded-3xl border border-orange-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">Total Kas Kelas</span>
                <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-orange-900 shadow-xs">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-3xl font-fredoka font-bold text-slate-900">{formatRupiah(classData.saldo)}</div>
                <span className="text-xs font-semibold text-orange-900 flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  Surplus 100% Tercatat Firestore
                </span>
              </div>
              <div className="w-full bg-orange-300/60 rounded-full h-2 overflow-hidden flex">
                <div className="bg-orange-600 h-2 transition-all duration-500" style={{ width: `${opsPct}%` }}></div>
                <div className="bg-violet-600 h-2 transition-all duration-500" style={{ width: `${sosPct}%` }}></div>
              </div>
            </div>

            {/* Pos Operasional */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pos Operasional</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-fredoka font-bold text-slate-900">{formatRupiah(classData.alokasi.operasional)}</div>
                <span className="text-xs font-semibold text-emerald-700">{opsPct}% dari total kas</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Spidol, penghapus, alat kebersihan KBM</p>
            </div>

            {/* Pos Sosial */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pos Sosial & Peduli</span>
                <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-800 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-fredoka font-bold text-slate-900">{formatRupiah(classData.alokasi.sosial)}</div>
                <span className="text-xs font-semibold text-violet-700">{sosPct}% dari total kas</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Menjenguk siswa sakit, santunan duka</p>
            </div>

            {/* Tagihan Minggu 1 */}
            <div className="bg-[#BBF7D0] p-5 rounded-3xl border border-emerald-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Iuran Minggu ke-1</span>
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-emerald-900">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-3xl font-fredoka font-bold text-emerald-950">{duesPercentage}%</div>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  {paidCount} Lunas • {unpaidCount} Belum Bayar
                </p>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-700 h-2 rounded-full transition-all duration-500" style={{ width: `${duesPercentage}%` }}></div>
              </div>
            </div>

          </div>

          {/* Main 3-Column Bento Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1 (3 Cols): ONBOARDING & ANIMATED MASCOT */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-200 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Transparansi Kelas
                  </div>
                  <h2 className="text-2xl font-fredoka font-bold text-slate-900 leading-tight">
                    Bingung Soal Kas Kelas Kamu?
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-2">
                    Pantau arus iuran mingguan, alokasi pos KBM, dan verifikasi absensi kelas langsung.
                  </p>
                </div>

                {/* Animated Mascot Character */}
                <div className="mt-4 pt-2 border-t border-slate-100">
                  <AnimatedMascot mood={activeMood} />
                </div>

                {/* CTA Button */}
                <div className="mt-4">
                  <a
                    href="#sectionTagihan"
                    className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full p-2 pl-5 flex items-center justify-between text-xs font-bold text-slate-800 transition-all"
                  >
                    <span>Periksa Status Tagihan</span>
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </a>
                </div>
              </div>

              {/* NIS Verification Widget */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Search className="w-4 h-4" />
                  </div>
                  <h3 className="font-fredoka font-bold text-sm text-slate-900">Verifikasi NIS Resmi</h3>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={nisSearchInput}
                    onChange={(e) => setNisSearchInput(e.target.value)}
                    placeholder="Ketik NIS (contoh: 23241001)"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 pr-12 font-medium"
                  />
                  <button
                    onClick={handleNisLookup}
                    className="absolute right-2 top-2 text-xs bg-slate-900 text-white rounded-xl px-2.5 py-1 font-bold"
                  >
                    Cek
                  </button>
                </div>
                {nisSearchResult && (
                  <div
                    className={`text-xs p-3 rounded-2xl font-medium ${
                      nisSearchResult.found
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                        : 'bg-rose-50 text-rose-950 border border-rose-300'
                    }`}
                  >
                    {nisSearchResult.found ? (
                      <>
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          Terverifikasi Whitelist XI-F2
                        </div>
                        <div className="mt-1">Nama: <b>{nisSearchResult.student?.namaResmi}</b></div>
                        <div>Status Iuran M1: <b>{nisSearchResult.student?.paid ? 'Lunas' : 'Belum Bayar'}</b></div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-700" />
                        NIS "{nisSearchInput}" tidak terdaftar di absensi.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* COLUMN 2 (5 Cols): CENTER DASHBOARD (NAVY POD) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-200 flex items-center justify-center font-fredoka font-bold text-violet-950 text-base border border-violet-300">
                      AS
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Selamat datang,</span>
                      <h3 className="font-fredoka font-bold text-slate-900 text-base leading-tight">Ardellio Satria Anindito</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">11 September 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Siswa XI-F2
                    </span>
                  </div>
                </div>

                <h1 className="text-xl font-fredoka font-bold text-slate-900 mt-5 leading-snug">
                  Halo Ardellio! Bagaimana kondisi kas kelas hari ini?
                </h1>

                {/* Mood Selector Buttons (Dynamic Mascot Trigger) */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setActiveMood('aman')}
                    className={`p-2.5 rounded-2xl text-center transition-all ${
                      activeMood === 'aman'
                        ? 'bg-emerald-100 border border-emerald-300 ring-2 ring-emerald-500'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 mx-auto text-emerald-700" />
                    <span className="text-[11px] font-bold text-emerald-950 mt-1 block">Aman</span>
                  </button>

                  <button
                    onClick={() => setActiveMood('tagihan')}
                    className={`p-2.5 rounded-2xl text-center transition-all ${
                      activeMood === 'tagihan'
                        ? 'bg-orange-100 border border-orange-300 ring-2 ring-orange-500'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto text-orange-700" />
                    <span className="text-[11px] font-bold text-orange-950 mt-1 block">Tagihan</span>
                  </button>

                  <button
                    onClick={() => setActiveMood('surplus')}
                    className={`p-2.5 rounded-2xl text-center transition-all ${
                      activeMood === 'surplus'
                        ? 'bg-violet-100 border border-violet-300 ring-2 ring-violet-500'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 mx-auto text-violet-700" />
                    <span className="text-[11px] font-bold text-violet-950 mt-1 block">Surplus</span>
                  </button>

                  <button
                    onClick={() => setActiveMood('audit')}
                    className={`p-2.5 rounded-2xl text-center transition-all ${
                      activeMood === 'audit'
                        ? 'bg-amber-100 border border-amber-300 ring-2 ring-amber-500'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto text-amber-700" />
                    <span className="text-[11px] font-bold text-amber-950 mt-1 block">Audit</span>
                  </button>
                </div>
              </div>

              {/* Dark Navy Bento Pod */}
              <div className="bg-[#0F172A] text-white p-6 rounded-4xl border border-slate-800 shadow-xl space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Peach Card */}
                  <div className="bg-[#FED7AA] text-slate-900 p-4 rounded-3xl flex flex-col justify-between shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-800" />
                      <span>Arus Kas Masuk</span>
                    </div>
                    <div className="my-3 flex items-end gap-1.5 h-12">
                      <div className="w-2.5 bg-orange-400 rounded-full h-6"></div>
                      <div className="w-2.5 bg-orange-500 rounded-full h-9"></div>
                      <div className="w-2.5 bg-orange-400 rounded-full h-5"></div>
                      <div className="w-2.5 bg-orange-600 rounded-full h-12"></div>
                      <div className="w-2.5 bg-orange-500 rounded-full h-8"></div>
                    </div>
                    <div>
                      <div className="text-xl font-fredoka font-bold text-slate-900">+Rp 100k</div>
                      <span className="text-[10px] text-orange-900 font-semibold block">Periode Minggu 1</span>
                    </div>
                  </div>

                  {/* Lilac Card */}
                  <div className="bg-[#DDD6FE] text-slate-900 p-4 rounded-3xl flex flex-col justify-between shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-950">
                      <ShieldCheck className="w-3.5 h-3.5 text-violet-800" />
                      <span>Tingkat Disiplin</span>
                    </div>
                    <div className="my-3 flex items-end gap-1.5 h-12">
                      <div className="w-3 bg-violet-300 rounded-md h-3"></div>
                      <div className="w-3 bg-violet-400 rounded-md h-6"></div>
                      <div className="w-3 bg-violet-500 rounded-md h-9"></div>
                      <div className="w-3 bg-violet-600 rounded-md h-12"></div>
                    </div>
                    <div>
                      <div className="text-xl font-fredoka font-bold text-violet-950">Tinggi</div>
                      <span className="text-[10px] text-violet-800 font-semibold block">{duesPercentage}% Lunas</span>
                    </div>
                  </div>
                </div>

                {/* Mint Voting Poll Card */}
                <div className="bg-[#BBF7D0] text-slate-900 p-5 rounded-3xl shadow-sm border border-emerald-300">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-2">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-800" />
                      <span>Musyawarah Kas Kelas</span>
                    </div>
                    <span className="bg-white/80 px-2 py-0.5 rounded-full text-[10px] font-bold">Pertanyaan 1/3</span>
                  </div>

                  <p className="font-fredoka font-bold text-slate-900 text-sm leading-snug">
                    "Apakah dana operasional kas ({formatRupiah(classData.alokasi.operasional)}) cukup untuk pembelian spidol & alat pel?"
                  </p>

                  <div className="flex gap-2.5 mt-4">
                    <button
                      onClick={() => setVotingSubmitted('yes')}
                      className={`flex-1 font-bold py-2 px-4 rounded-xl text-xs transition-all ${
                        votingSubmitted === 'yes' ? 'bg-slate-900 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'
                      }`}
                    >
                      Sangat Cukup (Ya)
                    </button>
                    <button
                      onClick={() => setVotingSubmitted('no')}
                      className={`flex-1 font-bold py-2 px-4 rounded-xl text-xs transition-all border border-emerald-400 ${
                        votingSubmitted === 'no' ? 'bg-white text-slate-900' : 'bg-white/80 text-slate-900 hover:bg-white'
                      }`}
                    >
                      Perlu Tambahan
                    </button>
                  </div>
                  {votingSubmitted && (
                    <div className="text-[11px] font-bold text-emerald-900 mt-2.5 text-center">
                      Suara Anda telah dicatat untuk musyawarah kelas.
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 font-medium">
                  <span>Bendahara: <b className="text-slate-200">Tarina</b></span>
                  <span>Wali Kelas: <b className="text-slate-200">Pembimbing XI-F2</b></span>
                </div>

              </div>

            </div>

            {/* COLUMN 3 (4 Cols): KAS CALENDAR & FEED */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-fredoka font-bold text-base text-slate-900">Kalender Kas</h3>
                    <p className="text-xs text-slate-400 font-medium">September 2026</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                  <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-300">31</div>
                  <div className="p-2 rounded-xl bg-[#BBF7D0] text-emerald-950 font-bold">1</div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600">2</div>
                  <div className="p-2 rounded-xl bg-[#FED7AA] text-orange-950 font-bold">3</div>
                  <div className="p-2 rounded-xl bg-[#BBF7D0] text-emerald-950 font-bold">4</div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600">5</div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600">6</div>
                  <div className="p-2 rounded-xl bg-[#DDD6FE] text-violet-950 font-bold">7</div>
                  <div className="p-2 rounded-xl bg-[#BBF7D0] text-emerald-950 font-bold">8</div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600">9</div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600">10</div>
                  <div className="p-2 rounded-xl bg-[#FEF08A] text-amber-950 font-bold ring-2 ring-amber-400">11</div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600">12</div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600">13</div>
                </div>

                <div className="mt-5 bg-emerald-50 border border-emerald-300 p-4 rounded-3xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#BBF7D0] flex items-center justify-center text-emerald-900 shrink-0">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Ringkasan Bulan Ini</span>
                    <h4 className="font-fredoka font-bold text-emerald-950 text-sm">Kas Sehat & Transparan</h4>
                    <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">Semua pemasukan & pengeluaran tercatat rapi tanpa selisih.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[9px] text-slate-400 block font-medium">Terkumpul</span>
                    <span className="font-fredoka font-bold text-xs text-slate-900 block mt-0.5">Rp 300k</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[9px] text-slate-400 block font-medium">Pengeluaran</span>
                    <span className="font-fredoka font-bold text-xs text-slate-900 block mt-0.5">Rp 140k</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[9px] text-slate-400 block font-medium">Kelunasan</span>
                    <span className="font-fredoka font-bold text-xs text-emerald-700 block mt-0.5">{duesPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Transactions Feed */}
              <div className="bg-white p-5 rounded-4xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-fredoka font-bold text-sm text-slate-900">Mutasi Kas Terakhir</h3>
                  <span className="text-xs text-slate-400 font-medium">Audit Trail</span>
                </div>
                
                <div className="space-y-2.5">
                  {transactions.slice(0, 5).map((tx) => {
                    const isIn = tx.type === 'in';
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isIn ? 'bg-[#BBF7D0] text-emerald-800' : 'bg-[#FED7AA] text-orange-800'
                            }`}
                          >
                            <TrendingUp className={`w-4 h-4 ${!isIn ? 'rotate-180' : ''}`} />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{tx.description}</div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Oleh {tx.inputBy} • Pos {tx.category}
                            </div>
                          </div>
                        </div>
                        <span className={`font-fredoka font-bold text-xs ${isIn ? 'text-emerald-700' : 'text-orange-700'}`}>
                          {isIn ? '+' : '-'}{formatRupiah(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* DUES CHECKLIST SECTION */}
          <div className="mt-8 bg-white p-6 rounded-4xl border border-slate-200 shadow-sm" id="sectionTagihan">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-fredoka font-bold text-lg text-slate-900">Daftar Status Iuran Kas Minggu ke-1</h3>
                <p className="text-xs text-slate-500 font-medium">Target nominal: Rp 10.000 / siswa • Absensi Whitelist XI-F2</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={studentSearchFilter}
                  onChange={(e) => setStudentSearchFilter(e.target.value)}
                  placeholder="Cari nama atau NIS..."
                  className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 w-full sm:w-48 font-medium"
                />
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {students
                .filter(
                  (s) =>
                    s.namaResmi.toLowerCase().includes(studentSearchFilter.toLowerCase()) ||
                    s.nis.includes(studentSearchFilter)
                )
                .map((student) => (
                  <div
                    key={student.nis}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      student.paid ? 'bg-slate-50/80 border-slate-200' : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          student.paid ? 'bg-[#BBF7D0] text-emerald-950' : 'bg-rose-200 text-rose-950'
                        }`}
                      >
                        {student.paid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{student.namaResmi}</div>
                        <div className="text-[10px] text-slate-400 font-medium">NIS: {student.nis}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStudentPaid(student.nis)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                        student.paid
                          ? 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                          : 'text-rose-800 bg-rose-100 border border-rose-300'
                      }`}
                    >
                      {student.paid ? 'Lunas' : 'Tandai Lunas'}
                    </button>
                  </div>
                ))}
            </div>
          </div>

        </main>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: 3-PHONE SHOWCASE VIEW (MATCHING ATTACHED SCREENSHOT)   */}
      {/* ============================================================== */}
      {activeView === 'showcase' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex items-center justify-center">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10 py-6">
            
            {/* Phone 1: Splash */}
            <div className="phone-mockup justify-between p-6 pt-9">
              <div className="phone-notch"></div>
              <div className="mt-6 text-center">
                <h2 className="text-3xl font-fredoka font-bold text-slate-900 leading-tight">
                  Bingung Soal Kas Kelas Kamu?
                </h2>
                <div className="mt-5 flex justify-center">
                  <div className="bg-slate-100 border border-slate-200 rounded-full p-2 pl-6 flex items-center justify-between gap-5 text-xs font-bold text-slate-800 shadow-xs">
                    <span>Biar CEKAS Bantu!</span>
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="my-auto flex justify-center">
                <AnimatedMascot mood="aman" />
              </div>
              <div className="text-center text-xs text-slate-400 font-medium mb-3">
                XI-F2 SMA Kartika XIX-1 Bandung
              </div>
            </div>

            {/* Phone 2: Dashboard */}
            <div className="phone-mockup justify-between bg-[#0F172A] text-white">
              <div className="phone-notch"></div>
              <div className="bg-white text-slate-900 p-5 pt-8 rounded-b-4xl shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center font-fredoka font-bold text-xs text-violet-950">
                      AS
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Selamat datang,</span>
                      <h4 className="font-fredoka font-bold text-xs text-slate-900">Ardellio Satria</h4>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">11 Sep 2026</span>
                </div>
                <h3 className="text-sm font-fredoka font-bold text-slate-900 mt-3">Halo Ardellio! Bagaimana kondisi kas kelas hari ini?</h3>
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <div className="p-1.5 rounded-xl bg-emerald-50 text-center">
                    <ShieldCheck className="w-4 h-4 mx-auto text-emerald-800" />
                    <span className="text-[9px] font-bold text-emerald-950 block mt-0.5">Aman</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-orange-50 text-center">
                    <Clock className="w-4 h-4 mx-auto text-orange-800" />
                    <span className="text-[9px] font-bold text-orange-950 block mt-0.5">Tagihan</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-violet-50 text-center">
                    <TrendingUp className="w-4 h-4 mx-auto text-violet-800" />
                    <span className="text-[9px] font-bold text-violet-950 block mt-0.5">Surplus</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-amber-50 text-center">
                    <FileText className="w-4 h-4 mx-auto text-amber-800" />
                    <span className="text-[9px] font-bold text-amber-950 block mt-0.5">Audit</span>
                  </div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-around">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FED7AA] text-slate-900 p-3.5 rounded-3xl">
                    <span className="text-[10px] font-bold text-orange-950">Arus Masuk</span>
                    <div className="my-2 flex items-end gap-1 h-7">
                      <div className="w-1.5 bg-orange-400 rounded-full h-4"></div>
                      <div className="w-1.5 bg-orange-500 rounded-full h-7"></div>
                      <div className="w-1.5 bg-orange-400 rounded-full h-3"></div>
                      <div className="w-1.5 bg-orange-600 rounded-full h-8"></div>
                    </div>
                    <div className="text-sm font-fredoka font-bold">+Rp 100k</div>
                  </div>
                  <div className="bg-[#DDD6FE] text-slate-900 p-3.5 rounded-3xl">
                    <span className="text-[10px] font-bold text-violet-950">Kedisiplinan</span>
                    <div className="my-2 flex items-end gap-1 h-7">
                      <div className="w-2 bg-violet-300 rounded-md h-2"></div>
                      <div className="w-2 bg-violet-400 rounded-md h-4"></div>
                      <div className="w-2 bg-violet-500 rounded-md h-6"></div>
                      <div className="w-2 bg-violet-600 rounded-md h-8"></div>
                    </div>
                    <div className="text-sm font-fredoka font-bold">{duesPercentage}%</div>
                  </div>
                </div>
                <div className="bg-[#BBF7D0] text-slate-900 p-3.5 rounded-3xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-950 mb-1">
                    <span>Diskusi Kas</span><span>1/3</span>
                  </div>
                  <p className="font-fredoka font-bold text-xs text-slate-900">Apakah saldo kas operasional cukup untuk beli spidol & pel?</p>
                  <div className="flex gap-2 mt-2.5">
                    <button className="flex-1 bg-slate-900 text-white font-bold py-1.5 rounded-xl text-[10px]">Cukup</button>
                    <button className="flex-1 bg-white text-slate-900 font-bold py-1.5 rounded-xl text-[10px] border border-emerald-300">Kurang</button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-around text-slate-400 text-sm">
                <span className="text-white"><Coins className="w-4 h-4" /></span>
                <span><Clock className="w-4 h-4" /></span>
                <span><Calendar className="w-4 h-4" /></span>
                <span><ShieldCheck className="w-4 h-4" /></span>
              </div>
            </div>

            {/* Phone 3: Calendar */}
            <div className="phone-mockup justify-between bg-white p-5 pt-8">
              <div className="phone-notch"></div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-700">‹</span>
                  <div className="text-center">
                    <h4 className="font-fredoka font-bold text-sm text-slate-900">Kalender Kas</h4>
                    <span className="text-[10px] text-slate-400 font-medium">September 2026</span>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-700">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mt-4 mb-1">
                  <div>S</div><div>S</div><div>R</div><div>K</div><div>J</div><div>S</div><div>M</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-300">31</div>
                  <div className="p-1.5 rounded-lg bg-[#BBF7D0] text-emerald-950 font-bold">1</div>
                  <div className="p-1.5 rounded-lg bg-slate-50">2</div>
                  <div className="p-1.5 rounded-lg bg-[#FED7AA] text-orange-950 font-bold">3</div>
                  <div className="p-1.5 rounded-lg bg-[#BBF7D0] text-emerald-950 font-bold">4</div>
                  <div className="p-1.5 rounded-lg bg-slate-50">5</div>
                  <div className="p-1.5 rounded-lg bg-slate-50">6</div>
                  <div className="p-1.5 rounded-lg bg-[#DDD6FE] text-violet-950 font-bold">7</div>
                  <div className="p-1.5 rounded-lg bg-[#BBF7D0] text-emerald-950 font-bold">8</div>
                  <div className="p-1.5 rounded-lg bg-slate-50">9</div>
                  <div className="p-1.5 rounded-lg bg-slate-50">10</div>
                  <div className="p-1.5 rounded-lg bg-[#FEF08A] text-amber-950 font-bold ring-2 ring-amber-400">11</div>
                  <div className="p-1.5 rounded-lg bg-slate-50">12</div>
                  <div className="p-1.5 rounded-lg bg-slate-50">13</div>
                </div>
                <div className="mt-4 bg-emerald-50 border border-emerald-300 p-3.5 rounded-3xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#BBF7D0] flex items-center justify-center text-emerald-900 shrink-0">
                    <ThumbsUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Status Kas</span>
                    <h5 className="font-fredoka font-bold text-emerald-950 text-xs">Kas Sehat & Surplus</h5>
                    <p className="text-[10px] text-emerald-800">Transparansi 100% terjaga.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center"><span className="text-[8px] text-slate-400 block font-medium">Terkumpul</span><span className="font-fredoka font-bold text-[11px] text-slate-900">Rp 300k</span></div>
                  <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center"><span className="text-[8px] text-slate-400 block font-medium">Pengeluaran</span><span className="font-fredoka font-bold text-[11px] text-slate-900">Rp 140k</span></div>
                  <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center"><span className="text-[8px] text-slate-400 block font-medium">Lunas</span><span className="font-fredoka font-bold text-[11px] text-emerald-700">{duesPercentage}%</span></div>
                </div>
              </div>
              <div className="bg-slate-950 -mx-5 -mb-5 px-6 py-3 flex items-center justify-around text-slate-400 text-sm">
                <span><Coins className="w-4 h-4" /></span>
                <span><Clock className="w-4 h-4" /></span>
                <span className="text-white"><Calendar className="w-4 h-4" /></span>
                <span><ShieldCheck className="w-4 h-4" /></span>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: MOBILE INTERACTIVE APP VIEW                            */}
      {/* ============================================================== */}
      {activeView === 'mobile' && (
        <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-5 pb-24">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center font-fredoka font-bold text-sm text-violet-950">
                  AS
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Selamat datang</span>
                  <h4 className="font-fredoka font-bold text-xs text-slate-900">Ardellio Satria</h4>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950">XI-F2</span>
            </div>
            <h3 className="font-fredoka font-bold text-sm text-slate-900 mt-3">
              Halo Ardellio! Bagaimana kondisi kas kelas hari ini?
            </h3>
          </div>

          <div className="bg-[#0F172A] text-white p-5 rounded-3xl shadow-lg space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Saldo Kas Terkini</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-3xl font-fredoka font-bold text-white">{formatRupiah(classData.saldo)}</div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Pos Operasional</span>
                <span className="font-bold text-[#BBF7D0]">{formatRupiah(classData.alokasi.operasional)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Pos Sosial</span>
                <span className="font-bold text-[#DDD6FE]">{formatRupiah(classData.alokasi.sosial)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-[#BBF7D0] text-emerald-950 font-bold py-3.5 rounded-2xl shadow-sm text-xs border border-emerald-300 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-800" />
            Catat Pemasukan / Pengeluaran
          </button>
        </main>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
      />

    </div>
  );
};

export default App;
