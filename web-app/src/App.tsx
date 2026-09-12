import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { doc, collection, onSnapshot, runTransaction, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from './lib/firebase';
import type { ClassMetadata, Transaction, WhitelistStudent, FinancialMood, UserSession, AppTab } from './types';
import { TransactionModal } from './components/TransactionModal';
import { ReversalModal } from './components/ReversalModal';
import { FirstPageOnboarding } from './components/FirstPageOnboarding';
import { AuthCard } from './components/landing/AuthCard';
import { MobileDashboard } from './components/mobile/MobileDashboard';
import { MobileCalendarScreen } from './components/mobile/MobileCalendarScreen';
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { MobileDrawerMenu } from './components/mobile/MobileDrawerMenu';

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

  // ACTIVE TAB (MOBILE BOTTOM NAV)
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');

  // DRAWER MENU STATE
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

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

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

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

    XLSX.writeFile(wb, `Laporan_Kas_XIF2_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ==============================================================
  // STAGE 1: ONBOARDING SCREEN
  // ==============================================================
  if (workflowStage === 'onboarding') {
    return (
      <FirstPageOnboarding
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
      />
    );
  }

  // ==============================================================
  // STAGE 2: AUTH SCREEN
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
  // STAGE 3: MOBILE-FIRST APPLICATION ROOT VIEW
  // ==============================================================
  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.paid).length;
  const unpaidCount = totalStudents - paidCount;
  const duesPercentage = ((paidCount / (totalStudents > 0 ? totalStudents : 1)) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col justify-center items-center font-space">
      
      {/* MOBILE-FIRST CONTAINER (390-430px optimal phone viewport) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F8FAFC] flex flex-col shadow-2xl relative md:my-6 md:rounded-[44px] md:border-3 md:border-black md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Dynamic Island / Top Phone Notch (on Desktop frame) */}
        <div className="hidden md:block w-28 h-6 bg-black rounded-b-2xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-50"></div>

        {/* ============================================================== */}
        {/* TAB ROUTER                                                     */}
        {/* ============================================================== */}

        {/* 1. HOME DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <MobileDashboard
            classData={classData}
            transactions={transactions}
            userSession={userSession}
            activeMood={activeMood}
            duesPercentage={duesPercentage}
            onSelectMood={setActiveMood}
            onOpenMenu={() => setIsDrawerOpen(true)}
            onOpenCatatModal={() => setIsModalOpen(true)}
          />
        )}

        {/* 2. CALENDAR TAB (MATCHING RIGHT SCREEN FROM REFERENCE) */}
        {currentTab === 'laporan' && (
          <MobileCalendarScreen
            duesPercentage={duesPercentage}
            onBackToHome={() => setCurrentTab('dashboard')}
          />
        )}

        {/* 3. DUES CHECKLIST TAB */}
        {currentTab === 'tagihan' && (
          <div className="flex-1 flex flex-col p-4 space-y-4 pb-24 font-space">
            
            {/* Header */}
            <div className="bg-white p-4 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-space font-extrabold text-sm text-black">Status Iuran Siswa</h3>
                  <span className="text-[10px] text-slate-500 font-bold">Target: Rp 10.000 / siswa</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B8FFA9] border border-black">
                    {paidCount} Lunas
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FECDD3] border border-black">
                    {unpaidCount} Nunggak
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-black/40">
                <div
                  className="bg-[#B8FFA9] h-2.5 rounded-full transition-all duration-500 border-r border-black"
                  style={{ width: `${duesPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={studentSearchFilter}
                onChange={(e) => setStudentSearchFilter(e.target.value)}
                placeholder="Cari siswa atau NIS..."
                className="w-full text-xs bg-white border-2 border-black rounded-2xl pl-10 pr-4 py-2.5 font-bold text-black focus:outline-none"
              />
            </div>

            {/* Checklist List */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {students
                .filter(
                  (s) =>
                    s.namaResmi.toLowerCase().includes(studentSearchFilter.toLowerCase()) ||
                    s.nis.includes(studentSearchFilter)
                )
                .map((student) => (
                  <div
                    key={student.nis}
                    className={`p-3 rounded-2xl border-2 border-black transition-all flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      student.paid ? 'bg-white' : 'bg-[#FFF1F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full border border-black flex items-center justify-center text-xs font-bold ${
                          student.paid ? 'bg-[#B8FFA9] text-black' : 'bg-[#FECDD3] text-black'
                        }`}
                      >
                        {student.paid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-black">{student.namaResmi}</div>
                        <div className="text-[9px] text-slate-500 font-bold">NIS: {student.nis}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStudentPaid(student.nis)}
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-xl transition-all border-2 border-black ${
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
        )}

        {/* 4. MUTASI / BUKU KAS TAB */}
        {currentTab === 'transaksi' && (
          <div className="flex-1 flex flex-col p-4 space-y-4 pb-24 font-space">
            
            {/* Header */}
            <div className="bg-white p-4 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div>
                <h3 className="font-space font-extrabold text-sm text-black">Buku Kas Umum</h3>
                <span className="text-[10px] text-slate-500 font-bold">{transactions.length} Mutasi Tercatat</span>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#B8FFA9] text-black font-extrabold text-xs border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 tactile-bounce"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tambah</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full text-xs bg-white border-2 border-black rounded-2xl pl-10 pr-4 py-2.5 font-bold text-black focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {transactions
                .filter((tx) =>
                  tx.description.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                  tx.inputBy.toLowerCase().includes(txSearchQuery.toLowerCase())
                )
                .map((tx) => {
                  const isIn = tx.type === 'in';
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl border border-black flex items-center justify-center font-bold text-xs ${
                            isIn ? 'bg-[#B8FFA9] text-black' : 'bg-[#FFC6A8] text-black'
                          }`}
                        >
                          {isIn ? '+' : '-'}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-black leading-tight">{tx.description}</div>
                          <div className="text-[9px] text-slate-500 font-bold">
                            {tx.inputBy} • Pos {tx.category}
                            {tx.isReversed && <span className="ml-1 text-rose-600 line-through">[Koreksi]</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className={`font-space font-extrabold text-xs ${isIn ? 'text-emerald-800' : 'text-orange-900'}`}>
                          {isIn ? '+' : '-'}{formatRupiah(tx.amount)}
                        </span>

                        {!tx.isReversed && !tx.isCorrection && (
                          <button
                            type="button"
                            onClick={() => setReversalTargetTx(tx)}
                            title="Koreksi Transaksi"
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-[#FEF08A] border border-black flex items-center justify-center text-black"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* FLOATING MOBILE BOTTOM NAVIGATION BAR                          */}
        {/* ============================================================== */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

      </div>

      {/* Slide-in Mobile Drawer Menu */}
      <MobileDrawerMenu
        isOpen={isDrawerOpen}
        userSession={userSession}
        onClose={() => setIsDrawerOpen(false)}
        onSwitchAccount={() => setWorkflowStage('onboarding')}
        onExportExcel={handleExportExcel}
      />

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
