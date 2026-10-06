import React, { useState, useEffect, useRef } from 'react';
import { doc, collection, onSnapshot, runTransaction, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import gsap from 'gsap';
import { db } from './lib/firebase';
import type { ClassMetadata, Transaction, WhitelistStudent, FinancialMood, UserSession, AppTab } from './types';
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
import { DesktopAppLayout } from './components/desktop/DesktopAppLayout';
import { DynamicIsland } from './components/common/DynamicIsland';
import { ExportCenterModal } from './components/export/ExportCenterModal';

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

  // AUTOMATIC VIEWPORT: RESPONDS SEAMLESSLY TO SCREEN SIZE
  const [isDesktopAuto, setIsDesktopAuto] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [forceMobilePreview, setForceMobilePreview] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopAuto(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktopView = isDesktopAuto && !forceMobilePreview;

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
  const [isExportCenterOpen, setIsExportCenterOpen] = useState<boolean>(false);

  // DYNAMIC ISLAND ALERT STATE (FOR GSAP MORPHING HUD)
  const [recentAlert, setRecentAlert] = useState<{
    type: 'in' | 'out' | 'info';
    message: string;
    amount?: number;
  } | null>(null);

  // PAGE CONTAINER REF FOR GSAP TRANSITIONS
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pageContainerRef.current) {
      gsap.fromTo(
        pageContainerRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [workflowStage]);

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

    setRecentAlert({
      type: data.type,
      message: data.type === 'in' ? 'Pemasukan Kas Berhasil Dicatat!' : 'Pengeluaran Kas Berhasil Dicatat!',
      amount: data.amount,
    });

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

    setRecentAlert({
      type: 'info',
      message: `Mutasi #${txId} Berhasil Dikoreksi!`,
    });
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

  // OPEN EXPORT & REPORTING HUB MODAL
  const handleExportExcel = () => {
    setIsExportCenterOpen(true);
  };

  // ==============================================================
  // STAGE 1: ONBOARDING SCREEN
  // ==============================================================
  if (workflowStage === 'onboarding') {
    return (
      <div ref={pageContainerRef}>
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
      </div>
    );
  }

  // ==============================================================
  // STAGE 2: AUTH SCREEN
  // ==============================================================
  if (workflowStage === 'auth') {
    return (
      <div ref={pageContainerRef}>
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
      </div>
    );
  }

  // ==============================================================
  // STAGE 3: APPLICATION ROOT VIEW (DESKTOP OR MOBILE-FIRST)
  // ==============================================================
  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.paid).length;
  const duesPercentage = ((paidCount / (totalStudents > 0 ? totalStudents : 1)) * 100).toFixed(1);

  // 3A. DESKTOP FULL-SCREEN BENTO DASHBOARD (AUTOMATIC ON PC >= 1024px)
  if (isDesktopView) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] font-space">
        <DesktopAppLayout
          classData={classData}
          transactions={transactions}
          students={students}
          userSession={userSession}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeMood={activeMood}
          duesPercentage={duesPercentage}
          onSelectMood={setActiveMood}
          onOpenCatatModal={() => setIsModalOpen(true)}
          onSelectReversalTx={(tx) => setReversalTargetTx(tx)}
          onToggleStudentPaid={toggleStudentPaid}
          onQuickTransaction={handleAddTransaction}
          onExportExcel={handleExportExcel}
          onSwitchAccount={() => setWorkflowStage('onboarding')}
          onSwitchToMobilePreview={() => setForceMobilePreview(true)}
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

        {/* Unified Export & Reporting Hub Modal */}
        <ExportCenterModal
          isOpen={isExportCenterOpen}
          onClose={() => setIsExportCenterOpen(false)}
          classData={classData}
          transactions={transactions}
          students={students}
          duesPercentage={duesPercentage}
        />
      </div>
    );
  }

  // 3B. NATIVE MOBILE-FIRST APPLICATION VIEW (AUTOMATIC ON MOBILE < 1024px)
  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col justify-center items-center font-space relative">
      
      {/* Return to Desktop Fullscreen button (if manually previewing on PC) */}
      {isDesktopAuto && forceMobilePreview && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setForceMobilePreview(false)}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-black border-2 border-black font-space font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 tactile-bounce"
          >
            <span>🖥️ Kembali ke Layar Penuh PC</span>
          </button>
        </div>
      )}

      {/* CLEAN MOBILE CONTAINER (NO FAKE WI-FI/BATTERY STATUS BAR) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F8FAFC] flex flex-col shadow-2xl relative md:my-6 md:rounded-[44px] md:border-3 md:border-black md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

        {/* INTERACTIVE GSAP DYNAMIC ISLAND HUD */}
        <DynamicIsland
          classData={classData}
          duesPercentage={duesPercentage}
          recentAlert={recentAlert}
          onClearAlert={() => setRecentAlert(null)}
          onOpenCatatModal={() => setIsModalOpen(true)}
        />

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

      {/* Unified Export & Reporting Hub Modal */}
      <ExportCenterModal
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        classData={classData}
        transactions={transactions}
        students={students}
        duesPercentage={duesPercentage}
      />

    </div>
  );
};

export default App;
