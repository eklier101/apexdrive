import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit,
  Wrench,
  Sparkles,
  Play,
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { InventoryItem, Plan, PlanKind } from '../types';
import { api } from '../api/client';
import { formatMoney } from '../utils/numbers';
import { PlanModal } from '../components/plans/PlanModal';
import { ServiceModal } from '../components/services/ServiceModal';
import { UpgradeModal } from '../components/upgrades/UpgradeModal';
import { planToServiceDefaults, planToUpgradeDefaults, planPartsToDraft } from '../utils/planApply';

export const PlansPage: React.FC = () => {
  const { activeVehicle, refreshAll } = useVehicle();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [defaultKind, setDefaultKind] = useState<PlanKind>('service');
  const [applyServicePlan, setApplyServicePlan] = useState<Plan | null>(null);
  const [applyUpgradePlan, setApplyUpgradePlan] = useState<Plan | null>(null);

  const load = useCallback(async () => {
    if (!activeVehicle) return;
    setLoading(true);
    try {
      const [p, inv] = await Promise.all([
        api.getPlans(activeVehicle.id),
        api.getInventory(),
      ]);
      setPlans(p);
      setInventory(inv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeVehicle]);

  useEffect(() => {
    load();
  }, [load]);

  if (!activeVehicle) {
    return <div className="text-center py-12 text-slate-400">Please select a vehicle.</div>;
  }

  const openPlans = plans.filter((p) => p.status === 'open');
  const donePlans = plans.filter((p) => p.status !== 'open');
  const openTotal = openPlans.reduce((s, p) => s + (p.estimated_total || 0), 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await api.deletePlan(id);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const usePlan = (plan: Plan) => {
    if (plan.plan_kind === 'upgrade') {
      setApplyUpgradePlan(plan);
    } else {
      setApplyServicePlan(plan);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-sky-400" />
            Plans
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Plan services or mods, estimate cost, then autofill when you log them
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Open plans</div>
            <div className="text-base font-mono font-bold text-sky-400">
              ${formatMoney(openTotal)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingPlan(null);
              setDefaultKind('service');
              setShowPlanModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">Loading plans…</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No plans yet</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Sketch out a service or mod with parts you still need to buy and parts already in inventory.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingPlan(null);
              setShowPlanModal(true);
            }}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs"
          >
            Create first plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {openPlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Open</h2>
              {openPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={() => {
                    setEditingPlan(plan);
                    setShowPlanModal(true);
                  }}
                  onDelete={() => handleDelete(plan.id)}
                  onUse={() => usePlan(plan)}
                />
              ))}
            </section>
          )}
          {donePlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Applied</h2>
              {donePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={() => {
                    setEditingPlan(plan);
                    setShowPlanModal(true);
                  }}
                  onDelete={() => handleDelete(plan.id)}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {showPlanModal && (
        <PlanModal
          isOpen={showPlanModal}
          onClose={() => {
            setShowPlanModal(false);
            setEditingPlan(null);
          }}
          planToEdit={editingPlan}
          inventoryItems={inventory}
          defaultKind={defaultKind}
          onSaved={load}
        />
      )}

      {applyServicePlan && (
        <ServiceModal
          isOpen
          onClose={() => setApplyServicePlan(null)}
          inventoryItems={inventory}
          defaults={planToServiceDefaults(applyServicePlan, activeVehicle.id)}
          draftParts={planPartsToDraft(applyServicePlan)}
          appliedPlanId={applyServicePlan.id}
          onSaved={async () => {
            await load();
            await refreshAll();
          }}
        />
      )}

      {applyUpgradePlan && (
        <UpgradeModal
          isOpen
          onClose={() => setApplyUpgradePlan(null)}
          defaults={planToUpgradeDefaults(applyUpgradePlan, activeVehicle.id)}
          appliedPlanId={applyUpgradePlan.id}
          onSaved={async () => {
            await load();
            await refreshAll();
          }}
        />
      )}
    </div>
  );
};

const PlanCard: React.FC<{
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
  onUse?: () => void;
}> = ({ plan, onEdit, onDelete, onUse }) => {
  const isMod = plan.plan_kind === 'upgrade';
  const needCount = (plan.parts || []).filter((p) => p.acquisition !== 'owned').length;
  const ownedCount = (plan.parts || []).filter((p) => p.acquisition === 'owned').length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`p-3 rounded-2xl ${
              isMod ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {isMod ? <Sparkles className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-base">{plan.title}</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg">
                {isMod ? plan.category || 'Mod' : plan.service_type || 'Service'}
              </span>
              {plan.status !== 'open' && (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-500 text-[10px] font-bold uppercase rounded-lg">
                  {plan.status}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>${formatMoney(plan.estimated_total || 0)} est.</span>
              {ownedCount > 0 && <span>{ownedCount} from stock</span>}
              {needCount > 0 && <span>{needCount} to buy</span>}
            </div>
            {plan.notes && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{plan.notes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onUse && (
            <button
              type="button"
              onClick={onUse}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-600/30"
            >
              <Play className="w-3.5 h-3.5" />
              Use plan
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
