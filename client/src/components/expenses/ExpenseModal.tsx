import React, { useState } from 'react';
import { X, Receipt, Save, Camera, Check } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { OtherExpense } from '../../types';
import { api } from '../../api/client';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: OtherExpense | null;
  onSaved?: () => void;
}

const EXPENSE_CATEGORIES = [
  'Insurance',
  'Registration & Tabs',
  'Tolls & Passes',
  'Parking',
  'Car Wash & Detailing',
  'Property Tax',
  'Financing / Lease',
  'Roadside Assistance (AAA)',
  'Driver License / Fees',
  'Other',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  onSaved,
}) => {
  const { activeVehicle, refreshAll } = useVehicle();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [date, setDate] = useState<string>(
    expenseToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<string>(
    expenseToEdit?.category || 'Insurance'
  );
  const [amount, setAmount] = useState<string>(
    expenseToEdit ? String(expenseToEdit.amount) : ''
  );
  const [notes, setNotes] = useState<string>(expenseToEdit?.notes || '');
  const [receiptImage, setReceiptImage] = useState<string>(
    expenseToEdit?.receipt_image || ''
  );

  if (!isOpen || !activeVehicle) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const res = await api.uploadImage(file);
      setReceiptImage(res.url);
    } catch (err: any) {
      alert('Failed to upload receipt: ' + err.message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) {
      alert('Please fill in amount and category.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<OtherExpense> = {
        vehicle_id: activeVehicle.id,
        date,
        category,
        amount: parseFloat(amount) || 0,
        notes: notes.trim() || undefined,
        receipt_image: receiptImage || undefined,
      };

      if (expenseToEdit) {
        await api.updateExpense(expenseToEdit.id, payload);
      } else {
        await api.addExpense(payload);
      }

      await refreshAll();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {expenseToEdit ? 'Edit Expense' : 'Log Vehicle Expense'}
              </h2>
              <div className="text-xs text-slate-400">
                {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono font-bold text-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Notes & Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 6-Month Progressive Auto Policy, Annual State Registration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Receipt Photo Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Receipt / Statement
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{uploadingReceipt ? 'Uploading...' : 'Attach Receipt'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {receiptImage && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <Check className="w-4 h-4" />
                  <span>Receipt Attached</span>
                  <button
                    type="button"
                    onClick={() => setReceiptImage('')}
                    className="text-slate-400 hover:text-red-400 ml-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
