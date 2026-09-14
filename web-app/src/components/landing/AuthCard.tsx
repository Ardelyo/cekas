import React, { useState } from 'react';
import {
  ArrowLeft,
  UserCheck,
  Shield,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  Crown,
  ShieldAlert
} from 'lucide-react';
import type { WhitelistStudent, UserSession } from '../../types';

interface AuthCardProps {
  initialMode: 'login-siswa' | 'login-bendahara' | 'signup';
  students: WhitelistStudent[];
  masterPin: string;
  onBack: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onRegisterStudent: (newStudent: WhitelistStudent) => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialMode,
  students,
  masterPin,
  onBack,
  onLoginSuccess,
  onRegisterStudent,
}) => {
  const [mode, setMode] = useState<'login-siswa' | 'login-bendahara' | 'signup'>(initialMode);
  const [pengurusRole, setPengurusRole] = useState<'bendahara' | 'ketuakelas' | 'walikelas'>('bendahara');
  
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
      role: student.role || 'siswa',
      nis: student.nis,
      nama: student.namaResmi,
    });
  };

  const handlePengurusLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (pinLogin.trim() !== masterPin.trim()) {
      setErrorMsg('PIN Otorisasi salah! Hubungi Pengurus Kelas.');
      return;
    }

    let roleName = 'Tarina (Bendahara Utama)';
    if (pengurusRole === 'ketuakelas') roleName = 'Ketua Kelas XI-F2';
    if (pengurusRole === 'walikelas') roleName = 'Wali Kelas XI-F2';

    onLoginSuccess({
      isLoggedIn: true,
      role: pengurusRole,
      nama: roleName,
      nis: pengurusRole === 'bendahara' ? '23241015' : undefined,
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
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-space">
      
      {/* Container Card with 3px border and tactile offset shadow */}
      <div className="bg-white w-full max-w-xl rounded-[36px] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-10 space-y-6 relative overflow-hidden">
        
        {/* Top Header: Back Button & Mode Indicator */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Kembali ke Halaman Awal</span>
          </button>

          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#EACEFF] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Kelas XI-F2
          </span>
        </div>

        {/* Title & Mascot Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-space font-extrabold text-black leading-tight">
              {mode === 'login-siswa' && 'Masuk Sebagai Siswa'}
              {mode === 'login-bendahara' && 'Otorisasi Pengurus Kelas'}
              {mode === 'signup' && 'Daftar Siswa Baru'}
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              {mode === 'login-siswa' && 'Verifikasi kehadiran & pantau status kas mandiri'}
              {mode === 'login-bendahara' && 'Masuk sebagai Bendahara, Ketua Kelas, atau Wali Kelas'}
              {mode === 'signup' && 'Tambahkan nama & NIS Anda ke whitelist absensi kas'}
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#B8FFA9] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            {mode === 'login-siswa' && <UserCheck className="w-7 h-7 text-black stroke-[2.2]" />}
            {mode === 'login-bendahara' && <Shield className="w-7 h-7 text-black stroke-[2.2]" />}
            {mode === 'signup' && <UserPlus className="w-7 h-7 text-black stroke-[2.2]" />}
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-[#F1F5F9] p-1.5 rounded-2xl border-2 border-black text-xs font-extrabold">
          <button
            type="button"
            onClick={() => { setMode('login-siswa'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login-siswa'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#B8FFA9]" />
            <span>Siswa (NIS)</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('login-bendahara'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login-bendahara'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#FFC6A8]" />
            <span>Pengurus</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#B8FFA9]" />
            <span>Daftar Baru</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="text-xs p-3.5 rounded-2xl bg-[#FECDD3]/50 border-2 border-black text-rose-950 flex items-center gap-2.5 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="text-xs p-3.5 rounded-2xl bg-[#B8FFA9]/40 border-2 border-black text-emerald-950 flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 stroke-[2.5]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================== */}
        {/* FORM 1: LOGIN SISWA (VIA NIS + QUICK SELECTOR)             */}
        {/* ========================================================== */}
        {mode === 'login-siswa' && (
          <form onSubmit={handleSiswaLogin} className="space-y-4 text-xs font-space">
            <div>
              <label className="font-extrabold text-black block mb-1">
                Pilih atau Ketik Nomor Induk Siswa (NIS)
              </label>
              <input
                type="text"
                value={nisLogin}
                onChange={(e) => setNisLogin(e.target.value)}
                placeholder="contoh: 23241001"
                className="w-full bg-slate-50 border-2 border-black rounded-2xl p-3.5 font-extrabold text-black focus:outline-none focus:bg-white text-sm"
              />

              {/* Quick Pick Chips for Fast Selection */}
              <div className="mt-3">
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Klik cepat nama siswa untuk mengisi NIS:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {students.slice(0, 8).map((s) => (
                    <button
                      key={s.nis}
                      type="button"
                      onClick={() => setNisLogin(s.nis)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                        nisLogin === s.nis
                          ? 'bg-[#B8FFA9] border-black text-black font-extrabold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      {s.namaResmi.split(' ')[0]} ({s.nis})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 tactile-bounce"
            >
              <span>Masuk Sebagai Siswa XI-F2</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        )}

        {/* ========================================================== */}
        {/* FORM 2: LOGIN PENGURUS (BENDAHARA, KETUA KELAS, WALI KELAS) */}
        {/* ========================================================== */}
        {mode === 'login-bendahara' && (
          <form onSubmit={handlePengurusLogin} className="space-y-4 text-xs font-space">
            
            {/* Level Administrasi Selector */}
            <div>
              <label className="font-extrabold text-black block mb-1.5">
                Pilih Tingkat Jabatan / Level Administrasi:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPengurusRole('bendahara')}
                  className={`p-2 rounded-xl border-2 font-black text-[11px] flex items-center justify-center gap-1 transition-all ${
                    pengurusRole === 'bendahara'
                      ? 'bg-[#B8FFA9] border-black text-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Bendahara</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPengurusRole('ketuakelas')}
                  className={`p-2 rounded-xl border-2 font-black text-[11px] flex items-center justify-center gap-1 transition-all ${
                    pengurusRole === 'ketuakelas'
                      ? 'bg-[#EACEFF] border-black text-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Ketua Kelas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPengurusRole('walikelas')}
                  className={`p-2 rounded-xl border-2 font-black text-[11px] flex items-center justify-center gap-1 transition-all ${
                    pengurusRole === 'walikelas'
                      ? 'bg-[#FEF08A] border-black text-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Wali Kelas</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-extrabold text-black block mb-1">Master PIN Keamanan</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={pinLogin}
                  onChange={(e) => setPinLogin(e.target.value)}
                  placeholder="Masukkan 6-digit Master PIN (192837)..."
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl pl-10 pr-3.5 py-3 font-mono font-extrabold text-black focus:outline-none focus:bg-white text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-bold block mt-1">
                *Demo PIN: <code className="bg-slate-100 px-1 py-0.5 rounded border border-black/20 font-black">192837</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 tactile-bounce"
            >
              <Shield className="w-4 h-4 text-[#FFC6A8]" />
              <span>Buka Hak Akses {pengurusRole.toUpperCase()}</span>
            </button>
          </form>
        )}

        {/* ========================================================== */}
        {/* FORM 3: PENDAFTARAN SISWA BARU                             */}
        {/* ========================================================== */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4 text-xs font-space">
            <div>
              <label className="font-extrabold text-black block mb-1">Nomor Induk Siswa (NIS)</label>
              <input
                type="text"
                value={nisSignup}
                onChange={(e) => setNisSignup(e.target.value)}
                placeholder="contoh: 23241040"
                className="w-full bg-slate-50 border-2 border-black rounded-2xl p-3 font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="font-extrabold text-black block mb-1">Nama Lengkap Siswa</label>
              <input
                type="text"
                value={namaSignup}
                onChange={(e) => setNamaSignup(e.target.value)}
                placeholder="contoh: Muhammad Faris"
                className="w-full bg-slate-50 border-2 border-black rounded-2xl p-3 font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#B8FFA9] hover:bg-[#a3f792] text-xs font-extrabold text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all mt-2 flex items-center justify-center gap-2 tactile-bounce"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftarkan ke Whitelist XI-F2</span>
            </button>
          </form>
        )}

        {/* ========================================================== */}
        {/* PUBLIC TRANSPARENCY QUICK LINK (ZERO LOGIN ACCESS)         */}
        {/* ========================================================== */}
        <div className="pt-2 text-center border-t-2 border-slate-100">
          <button
            type="button"
            onClick={() => {
              onLoginSuccess({
                isLoggedIn: false,
                role: 'tamu',
                nama: 'Pengunjung Publik',
              });
            }}
            className="text-xs font-black text-slate-600 hover:text-black underline flex items-center justify-center gap-1.5 mx-auto py-1"
          >
            <Eye className="w-3.5 h-3.5 text-black" />
            <span>Hanya ingin memantau kas? Masuk ke Dashboard Publik (Tanpa Login) →</span>
          </button>
        </div>

      </div>

    </div>
  );
};
