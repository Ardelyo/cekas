import React, { useState } from 'react';
import { X, Plus, Minus, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-fredoka font-bold text-base text-slate-900">
              Catat Transaksi Kas Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Type Toggle */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`py-2.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'in'
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                Pemasukan (+)
              </button>
              <button
                type="button"
                onClick={() => setType('out')}
                className={`py-2.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'out'
                    ? 'bg-rose-100 text-rose-950 border border-rose-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <Minus className="w-3.5 h-3.5 text-rose-700" />
                Pengeluaran (-)
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nominal (Rupiah)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="contoh: 10000"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Category */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Pos Alokasi Anggaran</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as keyof CategoryAllocations)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="operasional">Operasional & KBM</option>
              <option value="sosial">Sosial & Peduli</option>
              <option value="event">Acara & Kegiatan</option>
              <option value="cadangan">Dana Cadangan</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Keterangan Transaksi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="contoh: Iuran kas mingguan Ardellio..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-xs transition-all"
            >
              Simpan Transaksi
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
