import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Trash2, Edit, Gauge, DollarSign, MapPin, Receipt, Check } from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { Fillup } from '../types';
import { api } from '../api/client';
import { FillupModal } from '../components/fillups/FillupModal';

export const FillupsPage: React.FC = () => {
  const { activeVehicle } = useVehicle();
  const [fillups, setFillups] = useState<Fillup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFillup, setEditingFillup] = useState<Fillup | null>(null);

  const loadFillups = async () => {
    if (!activeVehicle) return;
    setLoading(true);
    try {
      const data = await api.getFillups(activeVehicle.id);
      setFillups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFillups();
  }, [activeVehicle]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fillup log?')) return;
    try {
      await api.deleteFillup(id);
      loadFillups();
    } catch (err: any) {
      alert(err.message || 'Failed to delete fillup');
    }
  };

  if (!activeVehicle) {
    return <div className="text-center py-12 text-slate-400">Please select a vehicle.</div>;
  }

  const odoUnit = activeVehicle.odometer_unit || 'mi';
  const fuelUnit = activeVehicle.fuel_unit || 'gal';

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Fuel className="w-6 h-6 text-brand-500" />
            Fuel & Fillup Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track gas prices, fuel economy, and mileage per tank
          </p>
        </div>
        <button
          onClick={() => {
            setEditingFillup(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fillup</span>
        </button>
      </div>

      {/* Fillup History Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
          Loading fuel records...
        </div>
      ) : fillups.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <Fuel className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Fuel Logs Yet</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Log your fillups to start automatically calculating your car's true MPG, cost per mile, and fuel spend trends.
          </p>
          <button
            onClick={() => {
              setEditingFillup(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs"
          >
            Log First Fillup
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {fillups.map((fillup) => (
            <div
              key={fillup.id}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-3xl p-5 transition shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Top Left: Date, Odometer & Station */}
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">
                        {fillup.odometer.toLocaleString()} {odoUnit}
                      </span>
                      {fillup.calculated_mpg ? (
                        <span className="px-2 py-0.5 bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-mono font-bold rounded-lg">
                          {fillup.calculated_mpg} MPG
                        </span>
                      ) : fillup.is_missed ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
                          Missed Gap
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg">
                          Initial Tank
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2">
                      <span>{fillup.date}</span>
                      {fillup.station && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {fillup.station}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-slate-300 font-medium">{fillup.fuel_grade}</span>
                    </div>
                  </div>
                </div>

                {/* Top Right: Cost & Volume */}
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-mono font-bold text-white">
                      ${fillup.total_cost.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {fillup.gallons.toFixed(3)} {fuelUnit} @ ${fillup.price_per_unit.toFixed(3)}/{fuelUnit}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingFillup(fillup);
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                      title="Edit Fillup"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fillup.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
                      title="Delete Fillup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Extra Details Row (Trip distance, cost per mile, notes) */}
              {(fillup.distance_traveled || fillup.notes || fillup.receipt_image) && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    {fillup.distance_traveled && (
                      <span>
                        Trip: <b className="text-slate-200">{fillup.distance_traveled} {odoUnit}</b>
                      </span>
                    )}
                    {fillup.calculated_cost_per_unit_distance && (
                      <span>
                        Cost: <b className="text-emerald-400 font-mono">${fillup.calculated_cost_per_unit_distance}/{odoUnit}</b>
                      </span>
                    )}
                    {fillup.notes && (
                      <span className="italic text-slate-300">"{fillup.notes}"</span>
                    )}
                  </div>

                  {fillup.receipt_image && (
                    <a
                      href={fillup.receipt_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-400 hover:underline"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FillupModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingFillup(null);
          }}
          fillupToEdit={editingFillup}
          onSaved={loadFillups}
        />
      )}
    </div>
  );
};
