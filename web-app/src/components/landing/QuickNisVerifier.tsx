import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import type { WhitelistStudent } from '../../types';

interface QuickNisVerifierProps {
  students: WhitelistStudent[];
  onDirectLogin: (student: WhitelistStudent) => void;
}

export const QuickNisVerifier: React.FC<QuickNisVerifierProps> = ({ students, onDirectLogin }) => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<{ found: boolean; student?: WhitelistStudent } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const clean = query.trim();
    const student = students.find((s) => s.nis === clean);
    setResult({ found: !!student, student });
  };

  return (
    <div className="w-full bg-white p-5 rounded-3xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3 font-space">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-black flex items-center gap-2">
          <Search className="w-4 h-4" />
          Verifikasi Cepat NIS Siswa
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EACEFF] text-black border border-black">
          Whitelist XI-F2
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik NIS (contoh: 23241001)..."
            className="w-full text-xs bg-slate-50 border-2 border-black rounded-2xl px-3.5 py-2.5 font-bold text-black focus:outline-none focus:bg-white"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-2xl bg-[#B8FFA9] hover:bg-[#a3f792] text-black font-extrabold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all tactile-bounce"
        >
          Cek
        </button>
      </form>

      {/* Dynamic Feedback Display */}
      {result && (
        <div className="pt-1">
          {result.found && result.student ? (
            <div className="p-3.5 rounded-2xl bg-[#B8FFA9]/30 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                <div>
                  <div className="font-extrabold text-xs text-black">{result.student.namaResmi}</div>
                  <span className="text-[10px] text-slate-600 font-bold">
                    NIS: {result.student.nis} • Status: {result.student.paid ? 'Lunas M1' : 'Belum Bayar'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDirectLogin(result.student!)}
                className="px-3 py-1.5 rounded-xl bg-black text-white text-[11px] font-extrabold flex items-center gap-1 hover:bg-slate-800 transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#FECDD3]/50 border-2 border-black text-xs font-bold text-rose-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>NIS "{query}" tidak terdaftar di daftar absensi resmi kelas XI-F2.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
