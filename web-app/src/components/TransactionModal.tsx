import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import type { CategoryAllocations } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: 'in' | 'out';
    amount: number;
    category: keyof CategoryAllocations;
    description: string;
  }) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<keyof CategoryAllocations>('operasional');
  const [description, setDescription] = useState<string>('');

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount.replace(/\D/g, ''), 10);
    if (!num || num <= 0) {
      alert('Nominal harus lebih besar dari 0');
      return;
    }
    if (!description.trim()) {
      alert('Keterangan transaksi wajib diisi');
      return;
    }

    onSubmit({
      type,
      amount: num,
      category,
      description: description.trim(),
    });

    setAmount('');
    setDescription('');
    onClose();
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
            <div className="w-9 h-9 rounded-2xl bg-[#B8FFA9] border-2 border-black text-black flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="font-space font-black text-base text-black leading-tight">
                Catat Transaksi Kas
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Kelas XI-F2 • Real-time Firestore
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Type Toggle */}
          <div>
            <label className="font-black text-black block mb-1">Arah Arus Kas</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`py-2.5 rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all border-2 ${
                  type === 'in'
                    ? 'bg-[#B8FFA9] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Plus className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
                <span>Pemasukan (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('out')}
                className={`py-2.5 rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all border-2 ${
                  type === 'out'
                    ? 'bg-[#FFC6A8] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Minus className="w-4 h-4 text-rose-800 stroke-[2.5]" />
                <span>Pengeluaran (-)</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="font-black text-black block mb-1">Nominal (Rupiah)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="contoh: 10000"
              className="w-full bg-slate-50 border-2 border-black rounded-2xl p-3 font-num font-black text-black focus:outline-none focus:bg-white text-base shadow-xs"
            />
          </div>

          {/* Category */}
          <div>
            <label className="font-black text-black block mb-1">Pos Alokasi Anggaran</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as keyof CategoryAllocations)}
              className="w-full bg-slate-50 border-2 border-black rounded-2xl p-3 font-bold text-black focus:outline-none focus:bg-white shadow-xs"
            >
              <option value="operasional">Pos Operasional (KBM, Spidol, Alat Pel)</option>
              <option value="sosial">Pos Sosial (Santunan, Duka Cita, Sakit)</option>
              <option value="event">Pos Event (Bazar, Lomba, Acara Kelas)</option>
              <option value="cadangan">Pos Cadangan (Dana Darurat Kas)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-black text-black block mb-1">Keterangan Transaksi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="contoh: Pembelian spidol whiteboard & isi ulang..."
              className="w-full bg-slate-50 border-2 border-black rounded-2xl p-3 font-bold text-black focus:outline-none focus:bg-white shadow-xs"
            />
          </div>

          {/* Actions */}
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
              Simpan Transaksi
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
