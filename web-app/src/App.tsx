import React, { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, runTransaction, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from './lib/firebase';
import type { ClassMetadata, Transaction, WhitelistStudent, FinancialMood, UserSession, AppTab, ViewportMode } from './types';
import { TransactionModal } from './components/TransactionModal';
import { ReversalModal } from './components/ReversalModal';
import { FirstPageOnboarding } from './components/FirstPageOnboarding';
import { AuthCard } from './components/landing/AuthCard';
import { MobileDashboard } from './components/mobile/MobileDashboard';
import { MobileCalendarScreen } from './components/mobile/MobileCalendarScreen';
import { MobileTagihanView } from './components/mobile/MobileTagihanView';
import { MobileMutasiView } from './components/mobile/MobileMutasiView';
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { MobileDrawerMenu } from './components/mobile/MobileDrawerMenu';
import { DesktopDashboardView } from './components/desktop/DesktopDashboardView';

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

  // VIEWPORT MODE: MOBILE PHONE vs PC DESKTOP
  const [viewportMode, setViewportMode] = useState<ViewportMode>('mobile');

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
            role: 'tamu',
            nama: 'Pengunjung Publik',
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
  // STAGE 3: APPLICATION ROOT VIEW (DESKTOP OR MOBILE-FIRST)
  // ==============================================================
  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.paid).length;
  const duesPercentage = ((paidCount / (totalStudents > 0 ? totalStudents : 1)) * 100).toFixed(1);

  // 3A. DESKTOP FULL-SCREEN BENTO DASHBOARD
  if (viewportMode === 'desktop') {
    return (
      <div className="min-h-screen bg-[#F5F3FF] font-space">
        <DesktopDashboardView
          classData={classData}
          transactions={transactions}
          students={students}
          userSession={userSession}
          activeMood={activeMood}
          duesPercentage={duesPercentage}
          onSelectMood={setActiveMood}
          onOpenCatatModal={() => setIsModalOpen(true)}
          onSelectReversalTx={(tx) => setReversalTargetTx(tx)}
          onToggleStudentPaid={toggleStudentPaid}
          onQuickTransaction={handleAddTransaction}
          onExportExcel={handleExportExcel}
          onSwitchAccount={() => setWorkflowStage('onboarding')}
          onToggleViewport={() => setViewportMode('mobile')}
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
  }

  // 3B. MOBILE-FIRST VIEWPORT WITH FLOATING DESKTOP SWITCHER
  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col justify-center items-center font-space relative">
      
      {/* Floating Desktop Switcher for Large Screens */}
      <div className="hidden md:flex fixed top-4 right-4 z-50">
        <button
          onClick={() => setViewportMode('desktop')}
          className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-black border-2 border-black font-space font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 tactile-bounce"
        >
          <span>🖥️</span>
          <span>Beralih ke Mode Layar Penuh PC</span>
        </button>
      </div>

      {/* MOBILE-FIRST CONTAINER (390-430px optimal phone viewport) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F8FAFC] flex flex-col shadow-2xl relative md:my-6 md:rounded-[44px] md:border-3 md:border-black md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Mobile OS Top Status Bar (9:41, Dynamic Island, Cellular, WiFi, Battery) */}
        <div className="w-full bg-white px-6 pt-3.5 pb-2 flex items-center justify-between text-xs font-black select-none border-b border-slate-100 z-30">
          <span className="font-space font-extrabold text-[13px] text-black tracking-tight">9:41</span>
          
          {/* Dynamic Island Pill */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2.5 gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {/* Right Status Icons */}
          <div className="flex items-center gap-1.5 text-black">
            {/* Cellular */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <rect x="2" y="16" width="3" height="6" rx="1" />
              <rect x="7" y="12" width="3" height="10" rx="1" />
              <rect x="12" y="8" width="3" height="14" rx="1" />
              <rect x="17" y="4" width="3" height="18" rx="1" />
            </svg>
            {/* WiFi */}
            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeLinecap="round" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeLinecap="round" />
              <circle cx="12" cy="20" r="1.5" fill="currentColor" />
            </svg>
            {/* Battery */}
            <div className="w-5 h-2.5 rounded-md border border-black p-0.5 flex items-center">
              <div className="w-3 h-1.5 bg-black rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB ROUTER                                                     */}
        {/* ============================================================== */}

        {/* 1. HOME DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <MobileDashboard
            classData={classData}
            transactions={transactions}
            students={students}
            userSession={userSession}
            activeMood={activeMood}
            duesPercentage={duesPercentage}
            onSelectMood={setActiveMood}
            onOpenMenu={() => setIsDrawerOpen(true)}
            onOpenCatatModal={() => setIsModalOpen(true)}
            onQuickTransaction={handleAddTransaction}
            onExportExcel={handleExportExcel}
          />
        )}

        {/* 2. CALENDAR TAB (MATCHING RIGHT SCREEN FROM REFERENCE) */}
        {currentTab === 'laporan' && (
          <MobileCalendarScreen
            duesPercentage={duesPercentage}
            onBackToHome={() => setCurrentTab('dashboard')}
          />
        )}

        {/* 3. DUES CHECKLIST TAB (REDESIGNED FOR MOBILITY & READABILITY) */}
        {currentTab === 'tagihan' && (
          <MobileTagihanView
            students={students}
            duesPercentage={duesPercentage}
            onToggleStudentPaid={toggleStudentPaid}
            onOpenCatatModal={() => setIsModalOpen(true)}
          />
        )}

        {/* 4. MUTASI / BUKU KAS TAB (REDESIGNED FOR MOBILITY & READABILITY) */}
        {currentTab === 'transaksi' && (
          <MobileMutasiView
            transactions={transactions}
            totalSaldo={classData.saldo}
            onOpenCatatModal={() => setIsModalOpen(true)}
            onSelectReversalTx={(tx) => setReversalTargetTx(tx)}
          />
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
