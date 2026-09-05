import React, { useEffect, useMemo, useState } from 'react';
import { X, BellRing, Save, Lock } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { ServiceItem, ServiceReminder } from '../../types';
import { api } from '../../api/client';
import {
  REMINDER_PRESETS,
  SERVICE_TYPES,
  serviceMatchesReminderType,
} from '../../constants/serviceTypes';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderToEdit?: ServiceReminder | null;
  onSaved?: () => void;
}

type LastSourceMode = 'from_service' | 'manual';

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  reminderToEdit,
  onSaved,
}) => {
  const { activeVehicle, refreshAll } = useVehicle();
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [serviceType, setServiceType] = useState('Oil Change');
  const [title, setTitle] = useState('Engine Oil & Filter Change');
  const [intervalMiles, setIntervalMiles] = useState('5000');
  const [intervalMonths, setIntervalMonths] = useState('6');
  const [lastSource, setLastSource] = useState<LastSourceMode>('manual');
  const [lastOdometer, setLastOdometer] = useState('');
  const [lastDate, setLastDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen || !activeVehicle) return;
    setLoadingServices(true);
    api
      .getServices(activeVehicle.id)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [isOpen, activeVehicle?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (reminderToEdit) {
      setServiceType(reminderToEdit.service_type || 'Oil Change');
      setTitle(reminderToEdit.title || '');
      setIntervalMiles(
        reminderToEdit.interval_miles != null ? String(reminderToEdit.interval_miles) : '0'
      );
      setIntervalMonths(
        reminderToEdit.interval_months != null ? String(reminderToEdit.interval_months) : '0'
      );
      setLastSource('manual');
      setLastOdometer(
        reminderToEdit.last_serviced_odometer != null
          ? String(reminderToEdit.last_serviced_odometer)
          : ''
      );
      setLastDate(reminderToEdit.last_serviced_date || new Date().toISOString().split('T')[0]);
      setNotes(reminderToEdit.notes || '');
      return;
    }
    const preset = REMINDER_PRESETS['Oil Change'];
    setServiceType('Oil Change');
    setTitle(preset.title);
    setIntervalMiles(preset.miles);
    setIntervalMonths(preset.months);
    setLastSource('from_service');
    setLastOdometer('');
    setLastDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  }, [isOpen, reminderToEdit?.id]);

  const matchedLastService = useMemo(() => {
    if (!serviceType) return null;
    return (
      services.find((s) =>
        serviceMatchesReminderType(s.service_type || '', s.title || '', serviceType)
      ) || null
    );
  }, [services, serviceType]);

  useEffect(() => {
    if (!isOpen || reminderToEdit) return;
    if (lastSource !== 'from_service') return;
    if (!matchedLastService) {
      setLastOdometer('');
      setLastDate('');
      return;
    }
    setLastOdometer(String(matchedLastService.odometer ?? ''));
    setLastDate(matchedLastService.date || '');
  }, [isOpen, reminderToEdit, lastSource, matchedLastService]);

  if (!isOpen || !activeVehicle) return null;

  const odoUnit = activeVehicle.odometer_unit || 'mi';
  const milesNum = intervalMiles === '' ? NaN : parseFloat(intervalMiles);
  const monthsNum = intervalMonths === '' ? NaN : parseInt(intervalMonths, 10);
  const milesOn = Number.isFinite(milesNum) && milesNum > 0;
  const monthsOn = Number.isFinite(monthsNum) && monthsNum > 0;
  const lastLocked = !reminderToEdit && lastSource === 'from_service';

  const applyPreset = (type: string) => {
    setServiceType(type);
    const preset = REMINDER_PRESETS[type];
    if (preset && !reminderToEdit) {
      setTitle(preset.title);
      setIntervalMiles(preset.miles);
      setIntervalMonths(preset.months);
    } else if (!reminderToEdit) {
      setTitle(type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !title) {
      alert('Service type and title are required.');
      return;
    }
    if (!milesOn && !monthsOn) {
      alert('Set miles and/or months greater than zero. Use 0 to disable one interval.');
      return;
    }
    if (lastLocked && !matchedLastService) {
      alert('No matching service log found. Switch to Manual entry or log that service first.');
      return;
    }
    if (!lastOdometer || !lastDate) {
      alert('Last performed odometer and date are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<ServiceReminder> = {
        vehicle_id: activeVehicle.id,
        service_type: serviceType,
        title,
        interval_miles: milesOn ? milesNum : 0,
        interval_months: monthsOn ? monthsNum : 0,
        last_serviced_odometer: parseFloat(lastOdometer),
        last_serviced_date: lastDate,
        notes: notes.trim() || undefined,
      };

      if (reminderToEdit) {
        await api.updateReminder(reminderToEdit.id, payload);
      } else {
        await api.addReminder(payload);
      }

      await refreshAll();
      onSaved?.();
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Service Type *
            </label>
            <select
              required
              value={SERVICE_TYPES.includes(serviceType as any) ? serviceType : 'Other'}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'Other') {
                  setServiceType('Other');
                } else {
                  applyPreset(v);
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {(serviceType === 'Other' || !SERVICE_TYPES.includes(serviceType as any)) && (
              <input
                type="text"
                required
                placeholder="Custom type (must match when you log service)"
                value={serviceType === 'Other' ? '' : serviceType}
                onChange={(e) => setServiceType(e.target.value || 'Other')}
                className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            )}
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              When you log this same maintenance type, the reminder auto-resets to the next due.
            </p>
          </div>

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

          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-200">Interval (whichever comes first)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Set both miles and months to use the earlier due date. Set either one to{' '}
                <span className="font-mono text-slate-400">0</span> to ignore that axis.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Every ({odoUnit})
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="5000 (0 = off)"
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
                  min={0}
                  step={1}
                  placeholder="6 (0 = off)"
                  value={intervalMonths}
                  onChange={(e) => setIntervalMonths(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Active rule:{' '}
              <span className="text-slate-200 font-medium">
                {!milesOn && !monthsOn && 'set at least one interval'}
                {milesOn && !monthsOn && `every ${milesNum.toLocaleString()} ${odoUnit}`}
                {!milesOn && monthsOn && `every ${monthsNum} months`}
                {milesOn &&
                  monthsOn &&
                  `every ${milesNum.toLocaleString()} ${odoUnit} or ${monthsNum} months (earlier wins)`}
              </span>
            </div>
          </div>

          {!reminderToEdit && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-3">
              <div className="text-xs font-bold text-slate-200">Last performed</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLastSource('from_service')}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    lastSource === 'from_service'
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Use last recorded service
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Prefills from matching log (locked)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLastSource('manual')}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    lastSource === 'manual'
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Enter manually
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Type odometer and date yourself
                  </div>
                </button>
              </div>

              {lastSource === 'from_service' && (
                <div className="text-[11px] text-slate-400">
                  {loadingServices && 'Looking up service history…'}
                  {!loadingServices && matchedLastService && (
                    <span>
                      Using{' '}
                      <span className="text-slate-200 font-medium">
                        {matchedLastService.title || matchedLastService.service_type}
                      </span>{' '}
                      from {matchedLastService.date} at{' '}
                      {Number(matchedLastService.odometer).toLocaleString()} {odoUnit}.
                    </span>
                  )}
                  {!loadingServices && !matchedLastService && (
                    <span className="text-amber-400">
                      No matching service found for “{serviceType}”. Log one first or switch to
                      manual.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Last Performed Odometer
                {lastLocked && <Lock className="inline w-3 h-3 ml-1 text-slate-500" />}
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 25000"
                value={lastOdometer}
                onChange={(e) => setLastOdometer(e.target.value)}
                readOnly={lastLocked}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono ${
                  lastLocked
                    ? 'bg-slate-950 border-slate-800 text-slate-300 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 focus:border-brand-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Last Performed Date
                {lastLocked && <Lock className="inline w-3 h-3 ml-1 text-slate-500" />}
              </label>
              <input
                type="date"
                required
                value={lastDate}
                onChange={(e) => setLastDate(e.target.value)}
                readOnly={lastLocked}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  lastLocked
                    ? 'bg-slate-950 border-slate-800 text-slate-300 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 focus:border-brand-500'
                }`}
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || (lastLocked && !matchedLastService)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition active:scale-[0.98]"
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
