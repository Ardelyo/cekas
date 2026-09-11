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
  CheckCircle,
  AlertCircle,
  Heart,
  MessageSquare,
  ThumbsUp,
  LogOut,
  LayoutDashboard,
  Receipt,
  CheckSquare,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import { doc, collection, onSnapshot, runTransaction, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import type { ClassMetadata, Transaction, WhitelistStudent, FinancialMood, UserSession, AppTab } from './types';
import { AnimatedMascot } from './components/AnimatedMascot';
import { TransactionModal } from './components/TransactionModal';
import { ReversalModal } from './components/ReversalModal';
import { OnboardingView } from './components/OnboardingView';
import { AuthView } from './components/AuthView';
import { LaporanView } from './components/LaporanView';

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
  pinBendahara: '192837',
};

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
  // WORKFLOW STAGE: 'onboarding' -> 'auth' -> 'app'
  const [workflowStage, setWorkflowStage] = useState<'onboarding' | 'auth' | 'app'>('onboarding');
  const [authInitialMode, setAuthInitialMode] = useState<'login-siswa' | 'login-bendahara' | 'signup'>('login-siswa');

  // USER SESSION
  const [userSession, setUserSession] = useState<UserSession>({
    isLoggedIn: false,
    role: 'siswa',
    nis: '23241001',
    nama: 'Ardellio Satria Anindito',
  });

  // ACTIVE TAB
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');

  // LIVE DATA STATE
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

  // INTERACTIVE WIDGET STATE
  const [activeMood, setActiveMood] = useState<FinancialMood>('aman');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reversalTargetTx, setReversalTargetTx] = useState<Transaction | null>(null);

  // FILTERS
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [studentSearchFilter, setStudentSearchFilter] = useState<string>('');
  const [votingSubmitted, setVotingSubmitted] = useState<string | null>(null);

  // CONNECT TO FIRESTORE (onSnapshot Real-time Listener)
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
            pinBendahara: data.pinBendahara || prev.pinBendahara,
          }));
        }
      });

      const txQuery = query(collection(db, 'classes', 'XI-F2', 'transactions'), orderBy('timestamp', 'desc'), limit(20));
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
              isCorrection: data.isCorrection || false,
              correctedTxId: data.correctedTxId || undefined,
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
      console.warn('Firestore real-time listener:', err);
    }
  }, []);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // ADD NEW TRANSACTION
  const handleAddTransaction = async (data: {
    type: 'in' | 'out';
    amount: number;
    category: keyof ClassMetadata['alokasi'];
    description: string;
  }) => {
    const diff = data.type === 'in' ? data.amount : -data.amount;
    const newTotal = classData.saldo + diff;
    const newCatTotal = (classData.alokasi[data.category] || 0) + diff;

    setClassData((prev) => ({
      ...prev,
      saldo: newTotal,
      alokasi: {
        ...prev.alokasi,
        [data.category]: newCatTotal,
      },
    }));

    const authorName = userSession.role === 'bendahara' ? 'Tarina (Bendahara)' : userSession.nama || 'Siswa';

    const newTx: Transaction = {
      id: 'tx_' + Date.now().toString().slice(-4),
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      inputBy: authorName,
      timestamp: new Date(),
    };

    setTransactions((prev) => [newTx, ...prev]);

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
          inputBy: authorName,
          inputMethod: 'web',
          timestamp: serverTimestamp(),
        });
      });
    } catch (e) {
      console.warn('Committed to local state:', e);
    }
  };

  // REVERSAL / KOREKSI APPEND-ONLY
  const handleConfirmReversal = async (txId: string, reason: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (!target || target.isReversed) return;

    const reversalType = target.type === 'in' ? 'out' : 'in';
    const diff = reversalType === 'in' ? target.amount : -target.amount;

    const newTotal = classData.saldo + diff;
    const newCatTotal = (classData.alokasi[target.category] || 0) + diff;

    setClassData((prev) => ({
      ...prev,
      saldo: newTotal,
      alokasi: {
        ...prev.alokasi,
        [target.category]: newCatTotal,
      },
    }));

    const authorName = userSession.role === 'bendahara' ? 'Tarina (Bendahara)' : 'Bendahara';

    const corrTx: Transaction = {
      id: 'tx_corr_' + Date.now().toString().slice(-4),
      type: reversalType,
      amount: target.amount,
      category: target.category,
      description: `[KOREKSI #${txId}] ${reason}`,
      inputBy: authorName,
      isCorrection: true,
      correctedTxId: txId,
      timestamp: new Date(),
    };

    setTransactions((prev) => [
      corrTx,
      ...prev.map((t) => (t.id === txId ? { ...t, isReversed: true, reversalReason: reason } : t)),
    ]);
  };

  // TOGGLE STUDENT PAID
  const toggleStudentPaid = (nis: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.nis === nis) {
          const isNowPaid = !s.paid;
          if (isNowPaid) {
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

  // STAGE 1: ONBOARDING
  if (workflowStage === 'onboarding') {
    return (
      <OnboardingView
        onStartLogin={() => {
          setAuthInitialMode('login-siswa');
          setWorkflowStage('auth');
        }}
        onStartSignup={() => {
          setAuthInitialMode('signup');
          setWorkflowStage('auth');
        }}
        onContinueAsGuest={() => {
          setUserSession({
            isLoggedIn: false,
            role: 'siswa',
            nama: 'Ardellio Satria Anindito',
            nis: '23241001',
          });
          setWorkflowStage('app');
        }}
      />
    );
  }

  // STAGE 2: AUTHENTICATION
  if (workflowStage === 'auth') {
    return (
      <AuthView
        initialMode={authInitialMode}
        students={students}
        masterPin={classData.pinBendahara || '192837'}
        onBack={() => setWorkflowStage('onboarding')}
        onLoginSuccess={(session) => {
          setUserSession(session);
          setWorkflowStage('app');
        }}
        onRegisterStudent={(newStudent) => {
          setStudents((prev) => [...prev, newStudent]);
        }}
      />
    );
  }

  // STAGE 3: MAIN APPLICATION (NO SHOWCASE, FULL WORKING DASHBOARD)
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
      {/* REAL APP TOP HEADER (NO PHONE BEZELS / NO SHOWCASE VIEWS)       */}
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  XI-F2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">SMA Kartika XIX-1 Bandung</p>
            </div>
          </div>

          {/* Real Functional Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'dashboard' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <button
              onClick={() => setCurrentTab('transaksi')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'transaksi' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Buku Kas
            </button>

            <button
              onClick={() => setCurrentTab('tagihan')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'tagihan' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tagihan Siswa
            </button>

            <button
              onClick={() => setCurrentTab('laporan')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'laporan' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Laporan & Cetak
            </button>
          </nav>

          {/* User Session Pill & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center font-bold text-violet-950 text-[10px]">
                {userSession.role === 'bendahara' ? 'TR' : 'AS'}
              </div>
              <div className="text-left">
                <span className="font-bold text-slate-900 block leading-tight text-[11px]">
                  {userSession.nama || 'Ardellio Satria'}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium capitalize">
                  Role: <b>{userSession.role}</b>
                </span>
              </div>
              <button
                onClick={() => setWorkflowStage('onboarding')}
                title="Ganti Akun / Keluar"
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center ml-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-full text-xs font-bold bg-[#BBF7D0] text-emerald-950 hover:bg-emerald-300 transition-all border border-emerald-300 shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-800" />
              <span>Catat Kas</span>
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTENT ROUTER PER ACTIVE TAB                              */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            
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
                    Surplus Real-Time Firestore
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

            {/* Main Bento 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (3 Cols): Mascot & Whitelist Checker */}
              <div className="lg:col-span-3 space-y-6">
                
                <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-200 mb-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Asisten Finansial
                    </div>
                    <h2 className="text-2xl font-fredoka font-bold text-slate-900 leading-tight">
                      Kondisi Kas Kelas
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-2">
                      Maskot bereaksi otomatis mengikuti saldo, tingkat kelunasan, dan audit kas kelas.
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100">
                    <AnimatedMascot mood={activeMood} />
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setCurrentTab('tagihan')}
                      className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full p-2.5 px-4 text-xs font-bold text-slate-800 transition-all text-center block"
                    >
                      Buka Matriks Tagihan Siswa →
                    </button>
                  </div>
                </div>

                {/* Telegram Bot Card */}
                <div className="bg-[#0F172A] text-white p-5 rounded-3xl border border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <h4 className="font-fredoka font-bold text-sm">Bot Telegram Aktif</h4>
                      <p className="text-[11px] text-slate-400">@kacekasbot • Gateway Siap</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Setiap transaksi yang dicatat di web atau bot otomatis memicu solo direct notification ke HP siswa.
                  </p>
                </div>

              </div>

              {/* Center Column (5 Cols): Greeting & Navy Bento Pod */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-violet-200 flex items-center justify-center font-fredoka font-bold text-violet-950 text-base border border-violet-300">
                        {userSession.role === 'bendahara' ? 'TR' : 'AS'}
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-medium">Selamat datang,</span>
                        <h3 className="font-fredoka font-bold text-slate-900 text-base leading-tight">
                          {userSession.nama || 'Ardellio Satria Anindito'}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">11 September 2026</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 capitalize">
                        {userSession.role} XI-F2
                      </span>
                    </div>
                  </div>

                  <h1 className="text-xl font-fredoka font-bold text-slate-900 mt-5 leading-snug">
                    Bagaimana kondisi kas kelas hari ini?
                  </h1>

                  {/* Financial Mood Selector Bar */}
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

              {/* Right Column (4 Cols): Calendar & Recent Ledger */}
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
                </div>

                {/* Recent Feed */}
                <div className="bg-white p-5 rounded-4xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-fredoka font-bold text-sm text-slate-900">Mutasi Kas Terakhir</h3>
                    <button
                      onClick={() => setCurrentTab('transaksi')}
                      className="text-xs text-slate-500 hover:text-slate-900 font-bold"
                    >
                      Lihat Semua →
                    </button>
                  </div>
                  
                  <div className="space-y-2.5">
                    {transactions.slice(0, 4).map((tx) => {
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

          </div>
        )}

        {/* TAB 2: BUKU KAS / TRANSAKSI & KOREKSI REVERSAL */}
        {currentTab === 'transaksi' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-fredoka font-bold text-slate-900">Buku Kas Umum XI-F2</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Seluruh riwayat mutasi kas masuk dan keluar (Append-only audit trail)
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-[#BBF7D0] text-emerald-950 font-bold text-xs border border-emerald-300 shadow-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-emerald-800" />
                  <span>Catat Transaksi Baru</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    placeholder="Cari transaksi berdasarkan keterangan atau pencatat..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value as any)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="all">Semua Jenis</option>
                    <option value="in">Hanya Pemasukan (+)</option>
                    <option value="out">Hanya Pengeluaran (-)</option>
                  </select>

                  <select
                    value={txCategoryFilter}
                    onChange={(e) => setTxCategoryFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="all">Semua Pos</option>
                    <option value="operasional">Pos Operasional</option>
                    <option value="sosial">Pos Sosial</option>
                    <option value="event">Pos Acara</option>
                    <option value="cadangan">Pos Cadangan</option>
                  </select>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Jenis</th>
                      <th className="p-3.5">Pos Alokasi</th>
                      <th className="p-3.5">Keterangan</th>
                      <th className="p-3.5 text-right">Nominal</th>
                      <th className="p-3.5">Pencatat</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {transactions
                      .filter((tx) => {
                        const matchQ =
                          tx.description.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                          tx.inputBy.toLowerCase().includes(txSearchQuery.toLowerCase());
                        const matchType = txTypeFilter === 'all' || tx.type === txTypeFilter;
                        const matchCat = txCategoryFilter === 'all' || tx.category === txCategoryFilter;
                        return matchQ && matchType && matchCat;
                      })
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">#{tx.id}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                tx.type === 'in' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700 font-semibold uppercase text-[10px]">{tx.category}</td>
                          <td className="p-3.5 text-slate-900 font-bold">{tx.description}</td>
                          <td className={`p-3.5 text-right font-fredoka font-bold text-sm ${tx.type === 'in' ? 'text-emerald-700' : 'text-orange-700'}`}>
                            {tx.type === 'in' ? '+' : '-'}{formatRupiah(tx.amount)}
                          </td>
                          <td className="p-3.5 text-slate-600">{tx.inputBy}</td>
                          <td className="p-3.5 text-center">
                            {tx.isReversed ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 line-through">
                                Dikoreksi
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Sah
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {!tx.isReversed && !tx.isCorrection && (
                              <button
                                onClick={() => setReversalTargetTx(tx)}
                                title="Koreksi transaksi ini"
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Koreksi</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: TAGIHAN & IURAN SISWA */}
        {currentTab === 'tagihan' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-fredoka font-bold text-slate-900">
                    Status Kelunasan Iuran Kas Siswa
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Target: Rp 10.000 / siswa • Terkoneksi otomatis dengan absensi resmi XI-F2
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {paidCount} Siswa Lunas
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    {unpaidCount} Belum Bayar
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex justify-between text-xs font-bold text-emerald-950">
                  <span>Progres Kelunasan Minggu ke-1</span>
                  <span>{duesPercentage}% Tercapai</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${duesPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Search Filter */}
              <div className="pt-2">
                <input
                  type="text"
                  value={studentSearchFilter}
                  onChange={(e) => setStudentSearchFilter(e.target.value)}
                  placeholder="Cari siswa berdasarkan nama atau NIS..."
                  className="w-full sm:w-80 text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Student Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
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
                        className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all ${
                          student.paid
                            ? 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                            : 'text-rose-800 bg-rose-100 border border-rose-300'
                        }`}
                      >
                        {student.paid ? 'Lunas' : 'Bayar'}
                      </button>
                    </div>
                  ))}
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: LAPORAN & EKSPOR EXCEL/PDF */}
        {currentTab === 'laporan' && (
          <LaporanView
            classData={classData}
            transactions={transactions}
            students={students}
          />
        )}

      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
      />

      {/* Reversal Modal */}
      <ReversalModal
        isOpen={!!reversalTargetTx}
        transaction={reversalTargetTx}
        onClose={() => setReversalTargetTx(null)}
        onConfirmReversal={handleConfirmReversal}
      />

    </div>
  );
};

export default App;
