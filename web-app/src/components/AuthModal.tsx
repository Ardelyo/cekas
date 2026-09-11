import React, { useState } from 'react';
import { X, KeyRound, UserCheck, Shield, AlertCircle } from 'lucide-react';
import type { WhitelistStudent, UserSession } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: WhitelistStudent[];
  masterPin: string;
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  students,
  masterPin,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'bendahara'>('siswa');
  const [nisInput, setNisInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSiswaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const student = students.find((s) => s.nis === nisInput.trim());
    if (!student) {
      setErrorMsg(`NIS "${nisInput}" tidak ditemukan dalam daftar absensi resmi kelas XI-F2.`);
      return;
    }

    onLoginSuccess({
      isLoggedIn: true,
      role: student.role === 'bendahara' ? 'bendahara' : 'siswa',
      nis: student.nis,
      nama: student.namaResmi,
    });
    onClose();
  };

  const handleBendaharaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (pinInput.trim() !== masterPin.trim()) {
      setErrorMsg('PIN Otorisasi salah! Hubungi Wali Kelas atau Ketua Kelas.');
      return;
    }

    onLoginSuccess({
      isLoggedIn: true,
      role: 'bendahara',
      nama: 'Tarina (Bendahara Utama)',
      nis: '23241015',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-fredoka font-bold text-base text-slate-900 leading-tight">
                Masuk ke Sistem CEKAS
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Akses Finansial Kelas XI-F2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Siswa vs Bendahara */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('siswa'); setErrorMsg(''); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'siswa'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Siswa (NIS)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('bendahara'); setErrorMsg(''); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'bendahara'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-700" />
            Bendahara (PIN)
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Siswa */}
        {activeTab === 'siswa' ? (
          <form onSubmit={handleSiswaLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilih atau Masukkan NIS Siswa</label>
              <input
                type="text"
                value={nisInput}
                onChange={(e) => setNisInput(e.target.value)}
                placeholder="contoh: 23241001"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Contoh: <code>23241001</code> (Ardellio), <code>23241015</code> (Tarina), <code>23241020</code> (Nabila)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-xs transition-all"
            >
              Masuk Sebagai Siswa
            </button>
          </form>
        ) : (
          /* Form Bendahara */
          <form onSubmit={handleBendaharaLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Master PIN Bendahara Kelas</label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan 6-digit PIN..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 tracking-widest text-center text-sm"
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                PIN diberikan oleh Wali Kelas / Ketua Kelas (Default: <code>192837</code>)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white shadow-xs transition-all"
            >
              Aktivasi Akses Bendahara
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
