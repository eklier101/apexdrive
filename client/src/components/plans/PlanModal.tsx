import React, { useEffect, useState } from 'react';
import { X, ClipboardList, Save, Package, Plus, Trash2 } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { InventoryItem, Plan, PlanKind, PlanPart, PlanPartAcquisition } from '../../types';
import { api } from '../../api/client';
import { SERVICE_TYPES } from '../../constants/serviceTypes';
import { asNumber, formatMoney } from '../../utils/numbers';

const UPGRADE_CATEGORIES = [
  'Performance',
  'Suspension & Brakes',
  'Wheels & Tires',
  'Exhaust',
  'Lighting',
  'Exterior Styling',
  'Interior Styling',
  'Audio & Tech',
  'Armor & Off-road',
  'Tuning & Electronics',
  'Other',
];

type DraftPart = {
  key: string;
  inventory_item_id?: string | null;
  name: string;
  quantity: string;
  unit_cost: string;
  acquisition: PlanPartAcquisition;
};

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: Plan | null;
  inventoryItems?: InventoryItem[];
  defaultKind?: PlanKind;
  onSaved?: () => void;
}

function newKey() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyPart(acq: PlanPartAcquisition = 'need'): DraftPart {
  return {
    key: newKey(),
    name: '',
    quantity: '1',
    unit_cost: '',
    acquisition: acq,
    inventory_item_id: null,
  };
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
  inventoryItems = [],
  defaultKind = 'service',
  onSaved,
}) => {
  const { activeVehicle } = useVehicle();
  const isEditing = Boolean(planToEdit?.id);
  const [submitting, setSubmitting] = useState(false);
  const [kind, setKind] = useState<PlanKind>(planToEdit?.plan_kind || defaultKind);
  const [title, setTitle] = useState(planToEdit?.title || '');
  const [serviceType, setServiceType] = useState(planToEdit?.service_type || 'Oil Change');
  const [category, setCategory] = useState(planToEdit?.category || 'Performance');
  const [notes, setNotes] = useState(planToEdit?.notes || '');
  const [laborCost, setLaborCost] = useState(
    planToEdit?.labor_cost != null ? String(planToEdit.labor_cost) : ''
  );
  const [parts, setParts] = useState<DraftPart[]>([emptyPart()]);

  useEffect(() => {
    if (!isOpen) return;
    setKind(planToEdit?.plan_kind || defaultKind);
    setTitle(planToEdit?.title || '');
    setServiceType(planToEdit?.service_type || 'Oil Change');
    setCategory(planToEdit?.category || 'Performance');
    setNotes(planToEdit?.notes || '');
    setLaborCost(planToEdit?.labor_cost != null ? String(planToEdit.labor_cost) : '');
    if (planToEdit?.parts?.length) {
      setParts(
        planToEdit.parts.map((p) => ({
          key: newKey(),
          inventory_item_id: p.inventory_item_id,
          name: p.name,
          quantity: String(asNumber(p.quantity, 1)),
          unit_cost: String(asNumber(p.unit_cost)),
          acquisition: p.acquisition === 'owned' ? 'owned' : 'need',
        }))
      );
    } else {
      setParts([emptyPart()]);
    }
  }, [isOpen, planToEdit?.id, defaultKind]);

  if (!isOpen || !activeVehicle) return null;

  const inStock = inventoryItems.filter((i) => asNumber(i.quantity_on_hand) > 0);

  const partsTotal = parts.reduce((sum, p) => {
    if (!p.name.trim()) return sum;
    return sum + asNumber(p.unit_cost) * Math.max(asNumber(p.quantity, 1), 0);
  }, 0);
  const estimated = partsTotal + (parseFloat(laborCost) || 0);

  const updatePart = (key: string, patch: Partial<DraftPart>) => {
    setParts((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const addOwnedFromInventory = (item: InventoryItem) => {
    const label = item.package_size ? `${item.name} (${item.package_size})` : item.name;
    setParts((prev) => [
      ...prev.filter((p) => p.name.trim() || p.inventory_item_id),
      {
        key: newKey(),
        inventory_item_id: item.id,
        name: label,
        quantity: '1',
        unit_cost: String(asNumber(item.unit_cost)),
        acquisition: 'owned',
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Enter a plan title.');
      return;
    }
    setSubmitting(true);
    try {
      const payloadParts: Partial<PlanPart>[] = parts
        .filter((p) => p.name.trim())
        .map((p) => ({
          inventory_item_id: p.acquisition === 'owned' ? p.inventory_item_id || null : null,
          name: p.name.trim(),
          quantity: Math.max(asNumber(p.quantity, 1), 0.01),
          unit_cost: asNumber(p.unit_cost),
          acquisition: p.acquisition === 'owned' ? 'owned' : 'need',
        }));

      const payload = {
        vehicle_id: activeVehicle.id,
        plan_kind: kind,
        title: title.trim(),
        service_type: kind === 'service' ? serviceType : null,
        category: kind === 'upgrade' ? category : null,
        notes: notes.trim() || null,
        labor_cost: parseFloat(laborCost) || 0,
        status: planToEdit?.status || 'open',
        parts: payloadParts,
      };

      if (isEditing && planToEdit) {
        await api.updatePlan(planToEdit.id, payload);
      } else {
        await api.createPlan(payload);
      }
      onSaved?.();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Edit Plan' : 'New Plan'}
              </h2>
              <div className="text-xs text-slate-400">
                Estimate parts & labor before you log the work
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-2">
            {(['service', 'upgrade'] as PlanKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                  kind === k
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                {k === 'service' ? 'Service' : 'Mod'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Title *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              placeholder={kind === 'service' ? 'Oil change kit' : 'Cold air intake'}
            />
          </div>

          {kind === 'service' ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Service type
              </label>
              <select
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  if (!title || SERVICE_TYPES.includes(title as any)) setTitle(e.target.value);
                }}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              >
                {UPGRADE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Labor / shop estimate
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-slate-400">Parts</label>
              <button
                type="button"
                onClick={() => setParts((prev) => [...prev, emptyPart('need')])}
                className="text-xs font-semibold text-sky-400 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Need to buy
              </button>
            </div>

            {inStock.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Package className="w-3 h-3" /> From inventory (bought)
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {inStock.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addOwnedFromInventory(item)}
                      className="px-2 py-1 rounded-lg text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {parts.map((p) => (
                <div
                  key={p.key}
                  className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        p.acquisition === 'owned'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {p.acquisition === 'owned' ? 'Bought / stock' : 'Need to buy'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setParts((prev) => prev.filter((x) => x.key !== p.key))}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    value={p.name}
                    onChange={(e) => updatePart(p.key, { name: e.target.value })}
                    placeholder="Part name"
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.quantity}
                      onChange={(e) => updatePart(p.key, { quantity: e.target.value })}
                      className="px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.unit_cost}
                      onChange={(e) => updatePart(p.key, { unit_cost: e.target.value })}
                      className="px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
                      placeholder="Unit $"
                    />
                  </div>
                  {p.acquisition !== 'owned' && (
                    <button
                      type="button"
                      onClick={() =>
                        updatePart(p.key, { acquisition: 'owned', inventory_item_id: null })
                      }
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Mark as already bought (manual)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm resize-none"
              placeholder="Where to buy, links, install notes…"
            />
          </div>

          <div className="rounded-2xl bg-slate-800/70 border border-slate-700 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Estimated total</span>
            <span className="text-lg font-mono font-bold text-sky-300">
              ${formatMoney(estimated)}
            </span>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving…' : 'Save Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};
