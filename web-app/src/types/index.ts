export interface CategoryAllocations {
  operasional: number;
  sosial: number;
  event: number;
  cadangan: number;
}

export interface ClassMetadata {
  id: string;
  nama: string;
  tahun_ajaran: string;
  saldo: number;
  alokasi: CategoryAllocations;
  pinBendahara?: string;
  updatedAt?: any;
}

export interface Transaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  category: 'operasional' | 'sosial' | 'event' | 'cadangan';
  description: string;
  inputBy: string;
  telegramId?: number | null;
  inputMethod?: string;
  isReversed?: boolean;
  isCorrection?: boolean;
  correctedTxId?: string;
  timestamp: any;
}

export interface WhitelistStudent {
  nis: string;
  namaResmi: string;
  role: 'siswa' | 'bendahara' | 'walikelas';
  paid?: boolean;
  statusKlaim?: boolean;
  claimedByTelegramId?: number | null;
}

export type FinancialMood = 'aman' | 'tagihan' | 'surplus' | 'audit';
