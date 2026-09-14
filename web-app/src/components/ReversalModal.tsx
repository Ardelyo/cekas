import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import gsap from 'gsap';
import type { Transaction } from '../types';

interface ReversalModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirmReversal: (txId: string, reason: string) => void;
}

export const ReversalModal: React.FC<ReversalModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onConfirmReversal,
}) => {
  const [reason, setReason] = useState<string>('');
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power2.out' }
        );
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { y: 40, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
        );
      }
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Alasan koreksi wajib diisi!');
      return;
    }
    onConfirmReversal(transaction.id, reason.trim());
    setReason('');
    onClose();
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 font-space"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-md rounded-t-[36px] sm:rounded-[36px] p-6 border-t-3 sm:border-3 border-black shadow-[0_-8px_24px_rgba(0,0,0,0.15)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto block sm:hidden mb-1"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FEF08A] border-2 border-black text-black flex items-center justify-center shadow-xs">
              <RotateCcw className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="font-space font-black text-base text-black leading-tight">
                Koreksi Mutasi Kas
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Append-Only Reversal Ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-black/30 flex items-center justify-center text-slate-700 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 rounded-2xl bg-[#FFFBEB] border-2 border-black text-black text-xs flex items-start gap-2.5 font-bold leading-relaxed shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Transaksi asal <u>tidak akan dihapus</u>. Sistem akan menerbitkan entri pembalik (*contra-entry*) secara atomik untuk memulihkan saldo kas.
          </span>
        </div>

        {/* Selected Transaction Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-black text-xs space-y-1 font-space">
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">ID Transaksi:</span>
            <span className="font-mono font-black text-black">#{transaction.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">Nominal:</span>
            <span className="font-num font-black text-black">
              {transaction.type === 'in' ? '+' : '-'}{formatRupiah(transaction.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">Keterangan:</span>
            <span className="font-extrabold text-black truncate max-w-[200px]">{transaction.description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">Pos Anggaran:</span>
            <span className="font-black uppercase text-[10px] text-slate-700">Pos {transaction.category}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-black text-black block mb-1">
              Alasan Koreksi / Pembatalan <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="contoh: Salah ketik nominal kas..."
              className="w-full bg-slate-50 border-2 border-black rounded-2xl p-3 font-bold text-black focus:outline-none focus:bg-white shadow-xs"
              autoFocus
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 border-2 border-black/30 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-black hover:bg-slate-800 text-xs font-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all tactile-bounce"
            >
              Konfirmasi Koreksi
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
