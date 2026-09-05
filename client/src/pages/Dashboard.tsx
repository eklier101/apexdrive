import React, { useState } from 'react';
import {
  Fuel,
  Wrench,
  Sparkles,
  Receipt,
  TrendingUp,
  Gauge,
  AlertTriangle,
  Clock,
  Plus,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { FillupModal } from '../components/fillups/FillupModal';
import { ServiceModal } from '../components/services/ServiceModal';
import { UpgradeModal } from '../components/upgrades/UpgradeModal';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { VehicleModal } from '../components/vehicles/VehicleModal';

export const Dashboard: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { activeVehicle, stats, loading, refreshing } = useVehicle();

  const [showFillupModal, setShowFillupModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading vehicle dashboard...</p>
        </div>
      </div>
    );
  }

  if (!activeVehicle || !stats) {
    return (
      <div className="text-center py-16 px-4">
        <div className="p-8 bg-slate-900/90 rounded-3xl max-w-md mx-auto border border-slate-800 shadow-2xl">
          <div className="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gauge className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Vehicles Found</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Add your car, truck, or motorcycle to begin tracking gas fill-ups, MPG, maintenance, and expenses.
          </p>
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Vehicle</span>
          </button>
        </div>

        {showAddVehicleModal && (
          <VehicleModal isOpen={showAddVehicleModal} onClose={() => setShowAddVehicleModal(false)} />
        )}
      </div>
    );
  }

  const { metrics, reminders, timeline } = stats;
  const odoUnit = activeVehicle.odometer_unit || 'mi';
  const fuelUnit = activeVehicle.fuel_unit || 'gal';

  const urgentReminders = reminders.filter(
    (r) => r.is_dismissed === 0 && (r.status === 'due_soon' || r.status === 'overdue')
  );

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Vehicle Hero Summary Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              {activeVehicle.fuel_type} • {activeVehicle.trim || 'Standard'}{activeVehicle.engine ? ` • ${activeVehicle.engine}` : ''}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {activeVehicle.license_plate && `Plate: ${activeVehicle.license_plate} • `}
              {activeVehicle.vin && `VIN: ${activeVehicle.vin}`}
            </p>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-2xl p-3.5">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-brand-400" />
                Current Odometer
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {metrics.currentOdometer.toLocaleString()}{' '}
                <span className="text-xs text-slate-400 font-normal">{odoUnit}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-2xl p-3.5">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                Average Fuel Econ
              </div>
              <div className="text-xl font-mono font-bold text-brand-400 mt-1">
                {metrics.fuel.avgMpg > 0 ? metrics.fuel.avgMpg : '--'}{' '}
                <span className="text-xs text-slate-400 font-normal">MPG</span>
              </div>
            </div>

            <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Fuel Cost / {odoUnit}
              </div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                {metrics.fuel.costPerMile > 0 ? `$${metrics.fuel.costPerMile}` : '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Service Reminder Alerts */}
      {urgentReminders.length > 0 && (
        <div className="space-y-2">
          {urgentReminders.map((rem) => (
            <div
              key={rem.id}
              onClick={() => onNavigate('reminders')}
              className={`cursor-pointer p-4 rounded-2xl border flex items-center justify-between transition active:scale-[0.99] ${
                rem.status === 'overdue'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    rem.status === 'overdue' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    {rem.status === 'overdue' ? 'Service Overdue: ' : 'Service Due Soon: '}
                    {rem.title}
                  </div>
                  <div className="text-xs text-slate-300">
                    {typeof rem.miles_remaining === 'number' && (
                      <span>
                        {rem.miles_remaining <= 0
                          ? `${Math.abs(rem.miles_remaining)} ${odoUnit} overdue`
                          : `in ${rem.miles_remaining} ${odoUnit}`}
                      </span>
                    )}
                    {typeof rem.days_remaining === 'number' && (
                      <span>
                        {typeof rem.miles_remaining === 'number' ? ' • ' : ''}
                        {rem.days_remaining <= 0
                          ? `${Math.abs(rem.days_remaining)} days overdue`
                          : `in ${rem.days_remaining} days`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20">
                View
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setShowFillupModal(true)}
          className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 rounded-2xl flex flex-col items-center text-center transition group active:scale-95"
        >
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl mb-2 group-hover:scale-110 transition">
            <Fuel className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white">Add Fuel</span>
          <span className="text-[11px] text-slate-400">Log Gas & MPG</span>
        </button>

        <button
          onClick={() => setShowServiceModal(true)}
          className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 rounded-2xl flex flex-col items-center text-center transition group active:scale-95"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-2 group-hover:scale-110 transition">
            <Wrench className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white">Add Service</span>
          <span className="text-[11px] text-slate-400">Maintenance & DIY</span>
        </button>

        <button
          onClick={() => setShowUpgradeModal(true)}
          className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 rounded-2xl flex flex-col items-center text-center transition group active:scale-95"
        >
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl mb-2 group-hover:scale-110 transition">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white">Add Mod</span>
          <span className="text-[11px] text-slate-400">Upgrades & Parts</span>
        </button>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 rounded-2xl flex flex-col items-center text-center transition group active:scale-95"
        >
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl mb-2 group-hover:scale-110 transition">
            <Receipt className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white">Add Expense</span>
          <span className="text-[11px] text-slate-400">Insurance & Tolls</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fuel Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Fuel className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-sm">Fuel Summary</span>
            </div>
            <button
              onClick={() => onNavigate('fillups')}
              className="text-xs text-brand-400 hover:underline"
            >
              Details
            </button>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${metrics.fuel.totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex justify-between">
            <span>{metrics.fuel.totalGallons.toFixed(1)} {fuelUnit} total</span>
            <span>{metrics.fuel.fillupCount} fillups</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Best / Worst:</span>
            <span className="text-slate-200 font-mono">
              {metrics.fuel.bestMpg} / {metrics.fuel.worstMpg} MPG
            </span>
          </div>
        </div>

        {/* Maintenance & Services */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-sm">Maintenance</span>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Details
            </button>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ${metrics.service.totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex justify-between">
            <span>Parts: ${metrics.service.partsCost.toFixed(0)}</span>
            <span>Labor: ${metrics.service.laborCost.toFixed(0)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">DIY Ratio:</span>
            <span className="text-slate-200">
              {metrics.service.diyCount} of {metrics.service.serviceCount} DIY
            </span>
          </div>
        </div>

        {/* Upgrades & Modifications */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-sm">Modifications</span>
            </div>
            <button
              onClick={() => onNavigate('upgrades')}
              className="text-xs text-purple-400 hover:underline"
            >
              Details
            </button>
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            ${metrics.upgrades.totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex justify-between">
            <span>{metrics.upgrades.upgradeCount} parts installed</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Added Value:</span>
            <span className="text-slate-200 font-mono">Custom Build</span>
          </div>
        </div>

        {/* Total Cost of Ownership */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-sm">Total Spend (TCO)</span>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-amber-400 hover:underline"
            >
              Analytics
            </button>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            ${metrics.tco.totalSpentExcludingPurchase.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex justify-between">
            <span>Total Cost / {odoUnit}:</span>
            <span className="text-slate-200 font-mono">${metrics.tco.overallCostPerMile}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Incl. Purchase:</span>
            <span className="text-slate-200 font-mono">${metrics.tco.totalTCO.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Recent Vehicle Activity</h2>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No activity logged yet. Tap any action button above to log fuel or service.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {timeline.map((item) => {
              const iconMap = {
                fillup: <Fuel className="w-4 h-4 text-blue-400" />,
                service: <Wrench className="w-4 h-4 text-emerald-400" />,
                upgrade: <Sparkles className="w-4 h-4 text-purple-400" />,
                expense: <Receipt className="w-4 h-4 text-amber-400" />,
              };

              const bgMap = {
                fillup: 'bg-blue-500/10',
                service: 'bg-emerald-500/10',
                upgrade: 'bg-purple-500/10',
                expense: 'bg-amber-500/10',
              };

              return (
                <div key={`${item.type}-${item.id}`} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${bgMap[item.type]}`}>
                      {iconMap[item.type]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="text-xs text-slate-400">
                        {item.date}
                        {item.odometer ? ` • ${item.odometer.toLocaleString()} ${odoUnit}` : ''}
                        {item.extra ? ` • ${item.extra}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-white">
                      ${item.cost.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modals */}
      {showFillupModal && (
        <FillupModal isOpen={showFillupModal} onClose={() => setShowFillupModal(false)} />
      )}
      {showServiceModal && (
        <ServiceModal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} />
      )}
      {showUpgradeModal && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      )}
      {showExpenseModal && (
        <ExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} />
      )}
    </div>
  );
};
