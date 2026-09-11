import React, { useState } from 'react';
import { ArrowLeft, UserCheck, Shield, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { WhitelistStudent, UserSession } from '../types';
import { AnimatedMascot } from './AnimatedMascot';

interface AuthViewProps {
  initialMode: 'login-siswa' | 'login-bendahara' | 'signup';
  students: WhitelistStudent[];
  masterPin: string;
  onBack: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onRegisterStudent: (newStudent: WhitelistStudent) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode,
  students,
  masterPin,
  onBack,
  onLoginSuccess,
  onRegisterStudent,
}) => {
  const [mode, setMode] = useState<'login-siswa' | 'login-bendahara' | 'signup'>(initialMode);
  
  // Login form state
  const [nisLogin, setNisLogin] = useState<string>('');
  const [pinLogin, setPinLogin] = useState<string>('');
  
  // Signup form state
  const [nisSignup, setNisSignup] = useState<string>('');
  const [namaSignup, setNamaSignup] = useState<string>('');
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSiswaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanNis = nisLogin.trim();
    const student = students.find((s) => s.nis === cleanNis);
    if (!student) {
      setErrorMsg(`NIS "${cleanNis}" tidak ditemukan dalam daftar absensi resmi kelas XI-F2.`);
      return;
    }

    onLoginSuccess({
      isLoggedIn: true,
      role: student.role === 'bendahara' ? 'bendahara' : 'siswa',
      nis: student.nis,
      nama: student.namaResmi,
    });
  };

  const handleBendaharaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (pinLogin.trim() !== masterPin.trim()) {
      setErrorMsg('PIN Otorisasi salah! Hubungi Wali Kelas atau Ketua Kelas.');
      return;
    }

    onLoginSuccess({
      isLoggedIn: true,
      role: 'bendahara',
      nama: 'Tarina (Bendahara Utama)',
      nis: '23241015',
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanNis = nisSignup.trim();
    const cleanNama = namaSignup.trim();

    if (!cleanNis || !cleanNama) {
      setErrorMsg('NIS dan Nama Lengkap wajib diisi!');
      return;
    }

    // Check if already in students
    const existing = students.find((s) => s.nis === cleanNis);
    if (existing) {
      setErrorMsg(`Siswa dengan NIS "${cleanNis}" (${existing.namaResmi}) sudah terdaftar.`);
      return;
    }

    const newStudent: WhitelistStudent = {
      nis: cleanNis,
      namaResmi: cleanNama,
      role: 'siswa',
      paid: false,
      statusKlaim: true,
    };

    onRegisterStudent(newStudent);
    setSuccessMsg(`Pendaftaran berhasil! Selamat datang di kas kelas XI-F2, ${cleanNama}.`);
    
    setTimeout(() => {
      onLoginSuccess({
        isLoggedIn: true,
        role: 'siswa',
        nis: newStudent.nis,
        nama: newStudent.namaResmi,
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6] flex flex-col justify-center items-center p-4 sm:p-8">
      
      {/* Container */}
      <div className="bg-white w-full max-w-lg rounded-4xl border border-slate-200/90 shadow-2xl p-6 sm:p-10 space-y-6 relative">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Awal</span>
        </button>

        {/* Header & Mascot */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-fredoka font-bold text-slate-900 leading-tight">
              {mode === 'login-siswa' && 'Login Siswa'}
              {mode === 'login-bendahara' && 'Otorisasi Bendahara'}
              {mode === 'signup' && 'Daftar Siswa Baru'}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Kelas XI-F2 SMA Kartika XIX-1 Bandung
            </p>
          </div>
          <AnimatedMascot mood={mode === 'login-bendahara' ? 'audit' : 'aman'} className="w-24 h-auto" />
        </div>

        {/* Tab Pills */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login-siswa'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              mode === 'login-siswa'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Siswa
          </button>

          <button
            type="button"
            onClick={() => { setMode('login-bendahara'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              mode === 'login-bendahara'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-700" />
            Bendahara
          </button>

          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              mode === 'signup'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
            Daftar
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="text-xs p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="text-xs p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: LOGIN SISWA */}
        {mode === 'login-siswa' && (
          <form onSubmit={handleSiswaLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Induk Siswa (NIS)</label>
              <input
                type="text"
                value={nisLogin}
                onChange={(e) => setNisLogin(e.target.value)}
                placeholder="contoh: 23241001"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
              />
              <div className="mt-2 text-[11px] text-slate-400 font-medium">
                Siswa terdaftar: <code>23241001</code> (Ardellio), <code>23241020</code> (Nabila), <code>23241025</code> (Cinta)
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md transition-all"
            >
              Masuk Sebagai Siswa
            </button>
          </form>
        )}

        {/* FORM 2: LOGIN BENDAHARA */}
        {mode === 'login-bendahara' && (
          <form onSubmit={handleBendaharaLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Master PIN Otorisasi Bendahara</label>
              <input
                type="password"
                value={pinLogin}
                onChange={(e) => setPinLogin(e.target.value)}
                placeholder="Masukkan 6-digit PIN..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 tracking-widest text-center text-base"
              />
              <p className="mt-2 text-[11px] text-slate-400 font-medium">
                PIN dipegang oleh Bendahara & Wali Kelas (Default: <code>192837</code>)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white shadow-md transition-all"
            >
              Aktivasi Akses Bendahara
            </button>
          </form>
        )}

        {/* FORM 3: SIGNUP SISWA BARU */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Induk Siswa (NIS)</label>
              <input
                type="text"
                value={nisSignup}
                onChange={(e) => setNisSignup(e.target.value)}
                placeholder="contoh: 23241040"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Siswa</label>
              <input
                type="text"
                value={namaSignup}
                onChange={(e) => setNamaSignup(e.target.value)}
                placeholder="contoh: Muhammad Rizky"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white shadow-md transition-all mt-2"
            >
              Daftarkan Diri ke Kelas XI-F2
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
