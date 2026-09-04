import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Edit } from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { OtherExpense } from '../types';
import { api } from '../api/client';
import { ExpenseModal } from '../components/expenses/ExpenseModal';

export const ExpensesPage: React.FC = () => {
  const { activeVehicle } = useVehicle();
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OtherExpense | null>(null);

  const loadExpenses = async () => {
    if (!activeVehicle) return;
    setLoading(true);
    try {
      const data = await api.getExpenses(activeVehicle.id);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeVehicle]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  if (!activeVehicle) {
    return <div className="text-center py-12 text-slate-400">Please select a vehicle.</div>;
  }

  const totalExpenseSum = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-500" />
            General Expenses
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log insurance, registration, parking, tolls, taxes, and car washes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Spent</div>
            <div className="text-base font-mono font-bold text-amber-400">
              ${totalExpenseSum.toFixed(2)}
            </div>
          </div>

          <button
            onClick={() => {
              setEditingExpense(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
          Loading expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No General Expenses Logged</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Log your auto insurance premiums, DMV registration, EZPass tolls, and parking fees for accurate Total Cost of Ownership.
          </p>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs"
          >
            Log First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-3xl p-5 transition shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{item.category}</span>
                    <span className="text-xs text-slate-400">• {item.date}</span>
                  </div>
                  {item.notes && (
                    <div className="text-xs text-slate-300 mt-1">{item.notes}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <div className="text-lg font-mono font-bold text-amber-400">
                  ${item.amount.toFixed(2)}
                </div>

                <div className="flex items-center gap-1">
                  {item.receipt_image && (
                    <a
                      href={item.receipt_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 transition text-xs flex items-center gap-1"
                      title="View Receipt"
                    >
                      <Receipt className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setEditingExpense(item);
                      setShowModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ExpenseModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingExpense(null);
          }}
          expenseToEdit={editingExpense}
          onSaved={loadExpenses}
        />
      )}
    </div>
  );
};
