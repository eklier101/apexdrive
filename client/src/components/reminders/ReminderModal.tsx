import React, { useState } from 'react';
import { X, BellRing, Save } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { ServiceReminder } from '../../types';
import { api } from '../../api/client';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderToEdit?: ServiceReminder | null;
  onSaved?: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  reminderToEdit,
  onSaved,
}) => {
  const { activeVehicle, refreshAll } = useVehicle();
  const [submitting, setSubmitting] = useState(false);

  const [serviceType, setServiceType] = useState<string>(
    reminderToEdit?.service_type || 'Oil Change'
  );
  const [title, setTitle] = useState<string>(
    reminderToEdit?.title || 'Engine Oil & Filter Change'
  );
  const [intervalMiles, setIntervalMiles] = useState<string>(
    reminderToEdit?.interval_miles ? String(reminderToEdit.interval_miles) : '5000'
  );
  const [intervalMonths, setIntervalMonths] = useState<string>(
    reminderToEdit?.interval_months ? String(reminderToEdit.interval_months) : '6'
  );
  const [lastOdometer, setLastOdometer] = useState<string>(
    reminderToEdit?.last_serviced_odometer !== undefined && reminderToEdit?.last_serviced_odometer !== null
      ? String(reminderToEdit.last_serviced_odometer)
      : ''
  );
  const [lastDate, setLastDate] = useState<string>(
    reminderToEdit?.last_serviced_date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(reminderToEdit?.notes || '');

  if (!isOpen || !activeVehicle) return null;

  const odoUnit = activeVehicle.odometer_unit || 'mi';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !title) {
      alert('Service type and title are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<ServiceReminder> = {
        vehicle_id: activeVehicle.id,
        service_type: serviceType,
        title,
        interval_miles: intervalMiles ? parseFloat(intervalMiles) : null,
        interval_months: intervalMonths ? parseInt(intervalMonths, 10) : null,
        last_serviced_odometer: lastOdometer ? parseFloat(lastOdometer) : null,
        last_serviced_date: lastDate || null,
        notes: notes.trim() || undefined,
      };

      if (reminderToEdit) {
        await api.updateReminder(reminderToEdit.id, payload);
      } else {
        await api.addReminder(payload);
      }

      await refreshAll();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving reminder');
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
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {reminderToEdit ? 'Edit Maintenance Reminder' : 'Set Service Reminder'}
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
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Reminder Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Engine Oil & Filter Change"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Service Type
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Oil Change, Tire Rotation, Brake Inspection"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Every ({odoUnit})
              </label>
              <input
                type="number"
                placeholder="5000"
                value={intervalMiles}
                onChange={(e) => setIntervalMiles(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Every (Months)
              </label>
              <input
                type="number"
                placeholder="6"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Last Performed Odometer
              </label>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={lastOdometer}
                onChange={(e) => setLastOdometer(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Last Performed Date
              </label>
              <input
                type="date"
                value={lastDate}
                onChange={(e) => setLastDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Notes & Spec
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 0W-16 Synthetic, 4.8 Quarts capacity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
