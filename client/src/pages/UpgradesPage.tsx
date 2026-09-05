import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Edit, CheckCircle2, Clock, Image as ImageIcon } from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { Upgrade } from '../types';
import { api } from '../api/client';
import { UpgradeModal } from '../components/upgrades/UpgradeModal';

export const UpgradesPage: React.FC = () => {
  const { activeVehicle } = useVehicle();
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUpgrade, setEditingUpgrade] = useState<Upgrade | null>(null);

  const loadUpgrades = async () => {
    if (!activeVehicle) return;
    setLoading(true);
    try {
      const data = await api.getUpgrades(activeVehicle.id);
      setUpgrades(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpgrades();
  }, [activeVehicle]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this upgrade record?')) return;
    try {
      await api.deleteUpgrade(id);
      loadUpgrades();
    } catch (err: any) {
      alert(err.message || 'Failed to delete upgrade');
    }
  };

  if (!activeVehicle) {
    return <div className="text-center py-12 text-slate-400">Please select a vehicle.</div>;
  }

  const odoUnit = activeVehicle.odometer_unit || 'mi';
  const totalModSpend = upgrades.reduce((sum, u) => sum + (u.total_cost || 0), 0);

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header, Total Invested, and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Modifications & Upgrades
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track aftermarket parts, custom builds, wheels, suspension, and tuning
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Mods</div>
            <div className="text-base font-mono font-bold text-purple-400">
              ${totalModSpend.toFixed(2)}
            </div>
          </div>

          <button
            onClick={() => {
              setEditingUpgrade(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mod</span>
          </button>
        </div>
      </div>

      {/* Upgrades List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
          Loading modifications...
        </div>
      ) : upgrades.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Upgrades Logged</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Log your aftermarket parts, wheel setups, exhausts, window tint, and electronics.
          </p>
          <button
            onClick={() => {
              setEditingUpgrade(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs"
          >
            Log First Modification
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upgrades.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-3xl p-5 transition shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Top Row: category badge, install status, actions */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold rounded-xl">
                    {item.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {item.is_installed ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Installed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        Planned / Ordered
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setEditingUpgrade(item);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title and details */}
                <h3 className="text-base font-bold text-white mt-1">{item.title}</h3>

                <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                  {item.brand_part_number && (
                    <div>
                      Part #: <span className="text-slate-300 font-mono">{item.brand_part_number}</span>
                    </div>
                  )}
                  {item.vendor && (
                    <div>
                      Vendor: <span className="text-slate-300">{item.vendor}</span>
                    </div>
                  )}
                  <div>
                    Date: <span className="text-slate-300">{item.date}</span>
                    {item.odometer && (
                      <span> • {item.odometer.toLocaleString()} {odoUnit}</span>
                    )}
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-300 italic mt-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Bottom Cost and Photo Link */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-base font-mono font-bold text-purple-400">
                    ${item.total_cost.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Part: ${item.part_cost.toFixed(0)} • Install: ${item.labor_cost.toFixed(0)}
                  </div>
                </div>

                {item.photo_url && (
                  <a
                    href={item.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:underline bg-purple-500/10 px-2.5 py-1 rounded-xl"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>View Photo</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <UpgradeModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingUpgrade(null);
          }}
          upgradeToEdit={editingUpgrade}
          onSaved={loadUpgrades}
        />
      )}
    </div>
  );
};
