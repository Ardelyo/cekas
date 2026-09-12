import React, { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
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
import { TransactionModal } from './components/TransactionModal';
import { ReversalModal } from './components/ReversalModal';
import { OnboardingHero } from './components/landing/OnboardingHero';
import { AuthCard } from './components/landing/AuthCard';
import { DashboardView } from './components/dashboard/DashboardView';
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
  // WORKFLOW STAGE: 'onboarding' (FIRST PAGE) -> 'auth' (LOGIN/SIGNUP) -> 'app' (MAIN DASHBOARD)
  const [workflowStage, setWorkflowStage] = useState<'onboarding' | 'auth' | 'app'>('onboarding');
  const [authInitialMode, setAuthInitialMode] = useState<'login-siswa' | 'login-bendahara' | 'signup'>('login-siswa');

  // USER SESSION
  const [userSession, setUserSession] = useState<UserSession>({
    isLoggedIn: false,
    role: 'siswa',
    nis: '23241001',
    nama: 'Ardellio Satria Anindito',
  });

  // ACTIVE TAB IN MAIN APP
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

  // WIDGET INTERACTION STATE
  const [activeMood, setActiveMood] = useState<FinancialMood>('aman');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reversalTargetTx, setReversalTargetTx] = useState<Transaction | null>(null);

  // FILTERS
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [studentSearchFilter, setStudentSearchFilter] = useState<string>('');

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

  // REVERSAL KOREKSI APPEND-ONLY
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

  // TOGGLE STUDENT PAID (1-CLICK DUES)
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

  // ==============================================================
  // WORKFLOW STAGE 1: THE VERY FIRST PAGE (ONBOARDING)
  // ==============================================================
  if (workflowStage === 'onboarding') {
    return (
      <OnboardingHero
        students={students}
        onOpenLogin={() => {
          setAuthInitialMode('login-siswa');
          setWorkflowStage('auth');
        }}
        onOpenSignup={() => {
          setAuthInitialMode('signup');
          setWorkflowStage('auth');
        }}
        onEnterDashboard={() => {
          setUserSession({
            isLoggedIn: false,
            role: 'siswa',
            nama: 'Ardellio Satria Anindito',
            nis: '23241001',
          });
          setWorkflowStage('app');
        }}
        onDirectLoginStudent={(student) => {
          setUserSession({
            isLoggedIn: true,
            role: student.role === 'bendahara' ? 'bendahara' : 'siswa',
            nama: student.namaResmi,
            nis: student.nis,
          });
          setWorkflowStage('app');
        }}
      />
    );
  }

  // ==============================================================
  // WORKFLOW STAGE 2: AUTHENTICATION (LOGIN SISWA / BENDAHARA / SIGNUP)
  // ==============================================================
  if (workflowStage === 'auth') {
    return (
      <AuthCard
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

  // ==============================================================
  // WORKFLOW STAGE 3: REAL MAIN PRODUCTION APPLICATION
  // ==============================================================
  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.paid).length;
  const unpaidCount = totalStudents - paidCount;
  const duesPercentage = ((paidCount / (totalStudents > 0 ? totalStudents : 1)) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#F5F3FF] text-slate-900 antialiased flex flex-col font-space">
      
      {/* ============================================================== */}
      {/* REAL PRODUCTION APP TOP BAR (CONSISTENT SPACE GROTESK DESIGN)   */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-black px-4 py-3 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8FFA9] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-space font-extrabold text-xl text-black tracking-tight">CEKAS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EACEFF] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  XI-F2
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">SMA Kartika XIX-1 Bandung</p>
            </div>
          </div>

          {/* Real Functional Navigation Tabs */}
          <nav className="flex items-center bg-[#F1F5F9] p-1 rounded-full border-2 border-black text-xs font-bold text-slate-700">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-black text-white shadow-xs'
                  : 'hover:text-black'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('transaksi')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'transaksi'
                  ? 'bg-black text-white shadow-xs'
                  : 'hover:text-black'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Buku Kas</span>
            </button>

            <button
              onClick={() => setCurrentTab('tagihan')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'tagihan'
                  ? 'bg-black text-white shadow-xs'
                  : 'hover:text-black'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Iuran Siswa</span>
            </button>

            <button
              onClick={() => setCurrentTab('laporan')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentTab === 'laporan'
                  ? 'bg-black text-white shadow-xs'
                  : 'hover:text-black'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Laporan & Cetak</span>
            </button>
          </nav>

          {/* User Session Pill & Quick Catat */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#FAF5FF] border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-6 h-6 rounded-full bg-[#EACEFF] border border-black flex items-center justify-center font-extrabold text-black text-[10px]">
                {userSession.role === 'bendahara' ? 'TR' : 'AS'}
              </div>
              <div className="text-left">
                <span className="font-extrabold text-black block leading-tight text-[11px]">
                  {userSession.nama || 'Ardellio Satria'}
                </span>
                <span className="text-[10px] text-slate-500 block font-bold capitalize">
                  {userSession.role === 'bendahara' ? 'Bendahara (Admin)' : 'Siswa XI-F2'}
                </span>
              </div>
              <button
                onClick={() => setWorkflowStage('onboarding')}
                title="Keluar / Ganti Akun"
                className="w-6 h-6 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-100 flex items-center justify-center ml-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-extrabold bg-[#B8FFA9] hover:bg-[#a3f792] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 tactile-bounce"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Catat Kas</span>
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTENT ROUTER                                             */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {currentTab === 'dashboard' && (
          <DashboardView
            classData={classData}
            transactions={transactions}
            students={students}
            userSession={userSession}
            activeMood={activeMood}
            onSelectMood={setActiveMood}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* TAB 2: BUKU KAS UMUM & KOREKSI REVERSAL */}
        {currentTab === 'transaksi' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-4xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-space font-extrabold text-black">Buku Kas Umum XI-F2</h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Seluruh riwayat transaksi masuk dan keluar (Append-only audit trail)
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-[#B8FFA9] text-black font-extrabold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 tactile-bounce"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
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
                    className="w-full text-xs bg-slate-50 border-2 border-black rounded-2xl pl-10 pr-4 py-2.5 font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value as any)}
                    className="text-xs bg-slate-50 border-2 border-black rounded-2xl px-3 py-2.5 font-bold text-black focus:outline-none"
                  >
                    <option value="all">Semua Jenis</option>
                    <option value="in">Hanya Pemasukan (+)</option>
                    <option value="out">Hanya Pengeluaran (-)</option>
                  </select>

                  <select
                    value={txCategoryFilter}
                    onChange={(e) => setTxCategoryFilter(e.target.value)}
                    className="text-xs bg-slate-50 border-2 border-black rounded-2xl px-3 py-2.5 font-bold text-black focus:outline-none"
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
              <div className="border-2 border-black rounded-3xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F1F5F9] font-extrabold text-black border-b-2 border-black">
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
                  <tbody className="divide-y border-slate-200 font-medium">
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
                          <td className="p-3.5 font-mono text-[11px] text-slate-500 font-bold">#{tx.id}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-black ${
                                tx.type === 'in' ? 'bg-[#B8FFA9] text-black' : 'bg-[#FECDD3] text-black'
                              }`}
                            >
                              {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                            </span>
                          </td>
                          <td className="p-3.5 text-black font-extrabold uppercase text-[10px]">{tx.category}</td>
                          <td className="p-3.5 text-black font-bold">{tx.description}</td>
                          <td className={`p-3.5 text-right font-space font-extrabold text-sm ${tx.type === 'in' ? 'text-emerald-800' : 'text-orange-800'}`}>
                            {tx.type === 'in' ? '+' : '-'}{formatRupiah(tx.amount)}
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">{tx.inputBy}</td>
                          <td className="p-3.5 text-center">
                            {tx.isReversed ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A] text-black border border-black line-through">
                                Dikoreksi
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Sah
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {!tx.isReversed && !tx.isCorrection && (
                              <button
                                onClick={() => setReversalTargetTx(tx)}
                                title="Koreksi transaksi ini"
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#FEF08A] text-black font-bold text-[11px] border border-black transition-colors inline-flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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
            <div className="bg-white p-6 rounded-4xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-space font-extrabold text-black">
                    Status Kelunasan Iuran Kas Siswa
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Target: Rp 10.000 / siswa • Terkoneksi otomatis dengan absensi resmi XI-F2
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#B8FFA9] text-black border border-black">
                    {paidCount} Siswa Lunas
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FECDD3] text-black border border-black">
                    {unpaidCount} Belum Bayar
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="p-4 rounded-3xl bg-[#F0FDF4] border-2 border-black space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between text-xs font-extrabold text-black">
                  <span>Progres Kelunasan Minggu ke-1</span>
                  <span>{duesPercentage}% Tercapai</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-black">
                  <div
                    className="bg-[#B8FFA9] h-3 rounded-full transition-all duration-500 border-r border-black"
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
                  className="w-full sm:w-80 text-xs bg-slate-50 border-2 border-black rounded-2xl px-4 py-2.5 font-bold text-black focus:outline-none focus:bg-white"
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
                      className={`p-3.5 rounded-2xl border-2 border-black transition-all flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        student.paid ? 'bg-white' : 'bg-[#FFF1F2]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full border border-black flex items-center justify-center text-xs font-bold ${
                            student.paid ? 'bg-[#B8FFA9] text-black' : 'bg-[#FECDD3] text-black'
                          }`}
                        >
                          {student.paid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-black">{student.namaResmi}</div>
                          <div className="text-[10px] text-slate-500 font-bold">NIS: {student.nis}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStudentPaid(student.nis)}
                        className={`text-[11px] font-extrabold px-3 py-1 rounded-xl transition-all border-2 border-black ${
                          student.paid
                            ? 'text-black bg-[#B8FFA9] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                            : 'text-black bg-[#FECDD3] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
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
