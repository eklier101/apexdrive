import React, { useState, useEffect } from 'react';
import { BellRing, Plus, Trash2, Edit, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { ServiceReminder } from '../types';
import { api } from '../api/client';
import { ReminderModal } from '../components/reminders/ReminderModal';
import { ServiceModal } from '../components/services/ServiceModal';

export const RemindersPage: React.FC = () => {
  const { activeVehicle, stats, refreshAll } = useVehicle();
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ServiceReminder | null>(null);
  const [showCompleteServiceModal, setShowCompleteServiceModal] = useState(false);
  const [completingReminder, setCompletingReminder] = useState<ServiceReminder | null>(null);

  const loadReminders = async () => {
    if (!activeVehicle) return;
    setLoading(true);
    try {
      const data = await api.getReminders(activeVehicle.id);
      setReminders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [activeVehicle]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      loadReminders();
    } catch (err: any) {
      alert(err.message || 'Failed to delete reminder');
    }
  };

  if (!activeVehicle) {
    return <div className="text-center py-12 text-slate-400">Please select a vehicle.</div>;
  }

  const odoUnit = activeVehicle.odometer_unit || 'mi';
  const currentOdo = stats?.metrics.currentOdometer || activeVehicle.purchase_odometer || 0;

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-blue-400" />
            Preventive Maintenance Reminders
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mileage & calendar intervals for oil changes, brakes, tire rotations, and filters
          </p>
        </div>
        <button
          onClick={() => {
            setEditingReminder(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Set Reminder</span>
        </button>
      </div>

      {/* Reminders Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
          Loading service intervals...
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <BellRing className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Reminders Configured</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Set maintenance reminder intervals (e.g., Oil Change every 5,000 miles or 6 months) to get proactive alerts.
          </p>
          <button
            onClick={() => {
              setEditingReminder(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"
          >
            Create First Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((rem) => {
            const statusStyles = {
              good: {
                badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                label: 'Good Condition',
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                cardBorder: 'border-slate-800',
              },
              due_soon: {
                badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                label: 'Due Soon',
                icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
                cardBorder: 'border-amber-500/40',
              },
              overdue: {
                badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                label: 'Service Overdue',
                icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
                cardBorder: 'border-rose-500/40',
              },
            };

            const style = statusStyles[rem.status];

            // Progress bar calculation based on interval and miles remaining
            let progressPct = 100;
            if (rem.interval_miles && typeof rem.miles_remaining === 'number') {
              const used = rem.interval_miles - rem.miles_remaining;
              progressPct = Math.min(100, Math.max(0, Math.round((used / rem.interval_miles) * 100)));
            }

            return (
              <div
                key={rem.id}
                className={`bg-slate-900/90 hover:bg-slate-900 border ${style.cardBorder} rounded-3xl p-5 transition shadow-sm flex flex-col justify-between`}
              >
                <div>
                  {/* Top Bar: Title, Service Type & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        {rem.service_type}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{rem.title}</h3>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${style.badge}`}
                    >
                      {style.icon}
                      <span>{style.label}</span>
                    </div>
                  </div>

                  {/* Countdown Status */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Next Due:</span>
                      <span className="font-mono font-bold text-white">
                        {rem.next_due_odometer
                          ? `${rem.next_due_odometer.toLocaleString()} ${odoUnit}`
                          : 'Mileage N/A'}
                        {rem.next_due_date ? ` (${rem.next_due_date})` : ''}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {rem.interval_miles && (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              rem.status === 'overdue'
                                ? 'bg-rose-500'
                                : rem.status === 'due_soon'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>
                            {typeof rem.miles_remaining === 'number'
                              ? rem.miles_remaining <= 0
                                ? `${Math.abs(rem.miles_remaining).toLocaleString()} ${odoUnit} overdue`
                                : `${rem.miles_remaining.toLocaleString()} ${odoUnit} remaining`
                              : ''}
                          </span>
                          <span>
                            {typeof rem.days_remaining === 'number'
                              ? rem.days_remaining <= 0
                                ? `${Math.abs(rem.days_remaining)} days overdue`
                                : `${rem.days_remaining} days remaining`
                              : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interval Summary */}
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {rem.interval_miles && rem.interval_months
                        ? `Every ${rem.interval_miles.toLocaleString()} ${odoUnit} or ${rem.interval_months} months (earlier)`
                        : rem.interval_miles
                        ? `Every ${rem.interval_miles.toLocaleString()} ${odoUnit}`
                        : rem.interval_months
                        ? `Every ${rem.interval_months} months`
                        : 'No interval set'}
                    </span>
                  </div>

                  {rem.notes && (
                    <div className="text-xs text-slate-300 italic mt-2">
                      Spec: {rem.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setCompletingReminder(rem);
                      setShowCompleteServiceModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/20 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Performed</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingReminder(rem);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ReminderModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingReminder(null);
          }}
          reminderToEdit={editingReminder}
          onSaved={loadReminders}
        />
      )}

      {showCompleteServiceModal && completingReminder && (
        <ServiceModal
          isOpen={showCompleteServiceModal}
          onClose={() => {
            setShowCompleteServiceModal(false);
            setCompletingReminder(null);
          }}
          defaults={{
            vehicle_id: activeVehicle.id,
            date: new Date().toISOString().split('T')[0],
            odometer: currentOdo,
            service_type: completingReminder.service_type,
            title: completingReminder.title,
            description: completingReminder.notes || undefined,
            parts_cost: 0,
            labor_cost: 0,
            total_cost: 0,
            is_diy: 1,
          }}
          onSaved={() => {
            loadReminders();
            refreshAll();
          }}
        />
      )}
    </div>
  );
};
