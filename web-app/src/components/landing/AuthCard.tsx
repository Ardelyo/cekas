import React, { useState } from 'react';
import {
  ArrowLeft,
  UserCheck,
  Shield,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight
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
              {mode === 'login-bendahara' && 'Otorisasi Bendahara'}
              {mode === 'signup' && 'Daftar Siswa Baru'}
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              {mode === 'login-siswa' && 'Verifikasi kehadiran & pantau status kas mandiri'}
              {mode === 'login-bendahara' && 'Aktivasi hak akses pembukuan dengan Master PIN'}
              {mode === 'signup' && 'Pendaftaran akun baru ke daftar absensi resmi XI-F2'}
            </p>
          </div>

          {/* Mini Reaction Mascot Avatar */}
          <div
            className="w-16 h-16 rounded-2xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            style={{
              backgroundColor:
                mode === 'login-siswa' ? '#B8FFA9' : mode === 'login-bendahara' ? '#EACEFF' : '#FFC6A8',
            }}
          >
            {mode === 'login-siswa' && (
              <svg className="w-10 h-10 select-none" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="16" fill="#B8FFA9" stroke="#000" strokeWidth="2.5" />
                <path d="M14 18 C16 14 18 14 20 18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 18 C24 14 26 14 28 18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 24 C19 26 23 26 25 24" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            {mode === 'login-bendahara' && (
              <svg className="w-10 h-10 select-none" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="16" fill="#EACEFF" stroke="#000" strokeWidth="2.5" />
                <circle cx="16" cy="18" r="2" fill="#000" />
                <circle cx="24" cy="18" r="2.5" fill="#000" />
                <path d="M17 25 Q20 22 23 25" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            )}
            {mode === 'signup' && (
              <svg className="w-10 h-10 select-none" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="6" width="28" height="28" rx="8" fill="#FFC6A8" stroke="#000" strokeWidth="2.5" />
                <line x1="12" y1="17" x2="16" y2="18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <line x1="28" y1="17" x2="24" y2="18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <circle cx="20" cy="24" r="2.5" fill="#000" />
              </svg>
            )}
          </div>
        </div>

        {/* Tab Pills (Siswa, Bendahara, Daftar) */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl border-2 border-black text-xs font-extrabold">
          <button
            type="button"
            onClick={() => { setMode('login-siswa'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login-siswa'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
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
            <Shield className="w-3.5 h-3.5 text-[#EACEFF]" />
            <span>Bendahara</span>
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
                  {students.slice(0, 6).map((s) => (
                    <button
                      key={s.nis}
                      type="button"
                      onClick={() => setNisLogin(s.nis)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                        nisLogin === s.nis
                          ? 'bg-[#B8FFA9] border-black text-black font-extrabold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
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
              className="w-full py-3.5 rounded-2xl bg-black hover:bg-slate-800 text-xs font-extrabold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 tactile-bounce"
            >
              <span>Masuk Sebagai Siswa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================== */}
        {/* FORM 2: LOGIN BENDAHARA (VIA MASTER PIN)                   */}
        {/* ========================================================== */}
        {mode === 'login-bendahara' && (
          <form onSubmit={handleBendaharaLogin} className="space-y-4 text-xs font-space">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-extrabold text-black block">Master PIN Otorisasi Bendahara</label>
                <span className="text-[10px] font-bold text-purple-800 bg-[#EACEFF] px-2 py-0.5 rounded-full border border-black">
                  6-Digit PIN
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={pinLogin}
                  onChange={(e) => setPinLogin(e.target.value)}
                  placeholder="Ketik PIN bendahara..."
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl pl-10 pr-4 py-3.5 font-extrabold text-black focus:outline-none focus:bg-white tracking-widest text-center text-base"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 font-bold">
                Default Master PIN: <code>192837</code> (Diperoleh dari Wali Kelas / Ketua Kelas)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#EACEFF] hover:bg-[#d8b4fe] text-xs font-extrabold text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 tactile-bounce"
            >
              <Shield className="w-4 h-4" />
              <span>Aktivasi Hak Kelola Bendahara</span>
            </button>
          </form>
        )}

        {/* ========================================================== */}
        {/* FORM 3: SIGNUP SISWA BARU                                  */}
        {/* ========================================================== */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5 text-xs font-space">
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

      </div>

    </div>
  );
};
