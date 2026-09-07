import React, { useState, useMemo } from 'react';
import { Package, Plus, Trash2, Edit, AlertTriangle, X, Save } from 'lucide-react';
import { InventoryItem } from '../../types';
import { api } from '../../api/client';
import { asNumber, formatMoney } from '../../utils/numbers';

const CATEGORIES = [
  'Oil',
  'Oil Filter',
  'Air Filter',
  'Cabin Filter',
  'Fluids',
  'Brake',
  'Spark Plugs',
  'Battery',
  'Tires',
  'Other',
];

const OIL_BOTTLE_SIZES = ['1 qt', '5 qt', '1 gal'];
const FLUID_UNITS = ['qt', 'gal', 'L'];
const GENERIC_UNITS = ['each', 'qt', 'gal', 'L', 'set', 'pair'];

const FILTER_CATEGORIES = ['Oil Filter', 'Air Filter', 'Cabin Filter', 'Spark Plugs', 'Battery'];

function isFilterCategory(category: string) {
  return FILTER_CATEGORIES.includes(category);
}

function isOilCategory(category: string) {
  return category === 'Oil';
}

function formatStockLabel(item: InventoryItem): string {
  if (isOilCategory(item.category) && item.package_size) {
    const n = item.quantity_on_hand;
    return `${n} bottle${n !== 1 ? 's' : ''} (${item.package_size} each)`;
  }
  if (isFilterCategory(item.category) || item.unit === 'each') {
    const n = item.quantity_on_hand;
    return `${n} in stock`;
  }
  return `${item.quantity_on_hand} ${item.unit} in stock`;
}

function formatCostLabel(item: InventoryItem): string {
  const cost = formatMoney(item.unit_cost);
  if (isOilCategory(item.category) && item.package_size) {
    return `${item.category} • $${cost} per ${item.package_size} bottle`;
  }
  if (isFilterCategory(item.category)) {
    return `${item.category} • $${cost} each`;
  }
  return `${item.category} • $${cost}/${item.unit}`;
}

interface InventoryPanelProps {
  items: InventoryItem[];
  onRefresh: () => void;
  compact?: boolean;
  /** Start expanded (Parts tab). */
  defaultExpanded?: boolean;
  /** When false, hide the collapsible chrome and always show content. */
  collapsible?: boolean;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  items,
  onRefresh,
  compact = false,
  defaultExpanded,
  collapsible = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? !compact);
  const [showUsed, setShowUsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'Oil Filter',
    unit: 'each',
    package_size: '',
    unit_cost: '',
    quantity_on_hand: '1',
    low_stock_threshold: '',
    part_number: '',
    notes: '',
  });

  const showUnitField = useMemo(() => {
    return !isOilCategory(form.category) && !isFilterCategory(form.category);
  }, [form.category]);

  const showBottleSize = isOilCategory(form.category);

  const qtyLabel = useMemo(() => {
    if (isOilCategory(form.category)) return '# of Bottles';
    if (isFilterCategory(form.category)) return '# in Stock';
    return 'Qty On Hand';
  }, [form.category]);

  const resetForm = () => {
    setForm({
      name: '',
      category: 'Oil Filter',
      unit: 'each',
      package_size: '',
      unit_cost: '',
      quantity_on_hand: '1',
      low_stock_threshold: '',
      part_number: '',
      notes: '',
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleCategoryChange = (category: string) => {
    setForm((prev) => {
      const next = { ...prev, category };
      if (isOilCategory(category)) {
        next.unit = 'bottle';
        next.package_size = prev.package_size || '5 qt';
      } else if (isFilterCategory(category)) {
        next.unit = 'each';
        next.package_size = '';
      } else if (category === 'Fluids') {
        next.unit = prev.unit === 'bottle' ? 'qt' : prev.unit;
        next.package_size = '';
      } else {
        next.package_size = '';
      }
      return next;
    });
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      package_size: item.package_size || '',
      unit_cost: String(item.unit_cost),
      quantity_on_hand: String(item.quantity_on_hand),
      low_stock_threshold: item.low_stock_threshold != null ? String(item.low_stock_threshold) : '',
      part_number: item.part_number || '',
      notes: item.notes || '',
    });
    setShowForm(true);
    setExpanded(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (isOilCategory(form.category) && !form.package_size) {
      alert('Please select a bottle size for oil.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        unit: isOilCategory(form.category)
          ? 'bottle'
          : isFilterCategory(form.category)
          ? 'each'
          : form.unit,
        package_size: isOilCategory(form.category) ? form.package_size : null,
        unit_cost: parseFloat(form.unit_cost) || 0,
        quantity_on_hand: parseFloat(form.quantity_on_hand) || 0,
        low_stock_threshold: form.low_stock_threshold ? parseFloat(form.low_stock_threshold) : null,
        part_number: form.part_number.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await api.updateInventoryItem(editing.id, payload);
      } else {
        await api.createInventoryItem(payload);
      }
      resetForm();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this part from inventory?')) return;
    try {
      await api.deleteInventoryItem(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const stockedItems = items.filter((i) => asNumber(i.quantity_on_hand) > 0);
  const depletedItems = items.filter((i) => asNumber(i.quantity_on_hand) <= 0);

  const lowStock = stockedItems.filter(
    (i) =>
      i.low_stock_threshold != null &&
      asNumber(i.quantity_on_hand) <= asNumber(i.low_stock_threshold)
  );

  const showBody = !collapsible || expanded;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-white text-sm">Parts Inventory</div>
              <div className="text-xs text-slate-400">
                {stockedItems.length} in stock
                {depletedItems.length > 0 && (
                  <span className="text-slate-500 ml-1">• {depletedItems.length} used up</span>
                )}
                {lowStock.length > 0 && (
                  <span className="text-amber-400 ml-1">• {lowStock.length} low stock</span>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500">{expanded ? 'Hide' : 'Show'}</span>
        </button>
      ) : null}

      {showBody && (
        <div className={`px-5 pb-5 space-y-4 ${collapsible ? 'border-t border-slate-800/80 pt-4' : 'pt-5'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400 max-w-md">
              Track filters by count, and oil as separate bottles (e.g. one 5 qt bottle and one 1 qt bottle as two items).
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {depletedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowUsed((v) => !v)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/80 transition"
                >
                  {showUsed ? 'Hide used' : `Show used (${depletedItems.length})`}
                </button>
              )}
              {!showForm && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Part
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-400">
                  {editing ? 'Edit Part' : 'New Inventory Part'}
                </span>
                <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Name *</label>
                  <input
                    required
                    placeholder={
                      isOilCategory(form.category)
                        ? 'e.g. Mobil 1 0W-20'
                        : 'e.g. Motorcraft FL500S'
                    }
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {showBottleSize && (
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                      Bottle Size *
                    </label>
                    <select
                      required
                      value={form.package_size}
                      onChange={(e) => setForm({ ...form, package_size: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select size...</option>
                      {OIL_BOTTLE_SIZES.map((s) => (
                        <option key={s} value={s}>{s} bottle</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Add 5 qt and 1 qt as separate inventory items
                    </p>
                  </div>
                )}

                {showUnitField && (
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Unit</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      {(form.category === 'Fluids' ? FLUID_UNITS : GENERIC_UNITS).map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    {isOilCategory(form.category) ? 'Cost per Bottle ($)' : 'Unit Cost ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">{qtyLabel}</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="1"
                    value={form.quantity_on_hand}
                    onChange={(e) => setForm({ ...form, quantity_on_hand: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Part #</label>
                  <input
                    placeholder="Optional SKU"
                    value={form.part_number}
                    onChange={(e) => setForm({ ...form, part_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Optional"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Saving...' : editing ? 'Update Part' : 'Add to Inventory'}
              </button>
            </form>
          )}

          {stockedItems.length === 0 && depletedItems.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No parts in inventory yet. Add oil bottles and filters you keep on hand.
            </div>
          ) : stockedItems.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              All parts are used up. Restock items below or add new parts.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stockedItems.map((item) => {
                const isLow =
                  item.low_stock_threshold != null &&
                  asNumber(item.quantity_on_hand) <= asNumber(item.low_stock_threshold);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 p-3 rounded-2xl border ${
                      isLow ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800/40 border-slate-700/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">
                          {item.name}
                          {item.package_size ? ` (${item.package_size})` : ''}
                        </span>
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{formatCostLabel(item)}</div>
                      <div className="text-xs font-mono text-emerald-400 mt-1">{formatStockLabel(item)}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showUsed && depletedItems.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">
                Used up — restock to add back
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {depletedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-2xl border bg-slate-800/20 border-slate-700/40 opacity-70"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-400 truncate">
                        {item.name}
                        {item.package_size ? ` (${item.package_size})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{formatCostLabel(item)}</div>
                      <div className="text-xs font-mono text-slate-500 mt-1">0 in stock</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
                        title="Restock"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Label for inventory item in service part picker */
export function formatInventoryOptionLabel(item: InventoryItem): string {
  const stock =
    isOilCategory(item.category) && item.package_size
      ? `${item.quantity_on_hand}× ${item.package_size}`
      : `${item.quantity_on_hand} in stock`;
  const cost = `$${formatMoney(item.unit_cost)}`;
  const suffix = item.package_size ? ` (${item.package_size} bottle)` : '';
  return `${item.name}${suffix} — ${stock} @ ${cost}`;
}
