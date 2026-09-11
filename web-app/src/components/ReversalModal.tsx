import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-fredoka font-bold text-base text-slate-900 leading-tight">
                Koreksi Transaksi (Append-Only)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Audit Trail Transparan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Transaksi asal <b>tidak akan dihapus</b>. Sistem akan menerbitkan transaksi pembalik (*contra-entry*) secara atomik untuk memulihkan saldo kas.
          </span>
        </div>

        {/* Selected Transaction Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">ID Transaksi:</span>
            <span className="font-mono font-bold text-slate-800">#{transaction.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Nominal:</span>
            <span className="font-bold text-slate-900">
              {transaction.type === 'in' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Keterangan:</span>
            <span className="font-medium text-slate-800">{transaction.description}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Alasan Koreksi Transaksi</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="contoh: Salah ketik nominal, seharusnya Rp 10.000..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

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
              className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-xs transition-all"
            >
              Terbitkan Koreksi
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
