import React, { useState, useEffect, useRef } from 'react';
import { X, Wrench, Save, Camera, Check, Package, DollarSign } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { ServiceItem, InventoryItem, ServicePartDraft, Plan } from '../../types';
import { api } from '../../api/client';
import { SERVICE_TYPES } from '../../constants/serviceTypes';
import { asNumber, formatMoney } from '../../utils/numbers';
import { planPartsToDraft, planToServiceDefaults } from '../../utils/planApply';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit?: ServiceItem | null;
  /** Prefill values for a new log (e.g. Mark Performed from a reminder). */
  defaults?: Partial<ServiceItem> | null;
  /** Prefill inventory / planned line items (e.g. from a Plan). */
  draftParts?: ServicePartDraft[] | null;
  /** When set, mark this plan applied after a successful create. */
  appliedPlanId?: string | null;
  inventoryItems?: InventoryItem[];
  onSaved?: () => void;
}

type CostMode = 'simple' | 'inventory';

/** Plugs already deducted for this service are still "available" while editing */
function getAvailableQty(
  item: InventoryItem,
  serviceToEdit?: ServiceItem | null
): number {
  const onHand = asNumber(item.quantity_on_hand);
  if (!serviceToEdit?.parts?.length) return onHand;
  const onThisService = serviceToEdit.parts
    .filter((p) => p.inventory_item_id === item.id)
    .reduce((sum, p) => sum + asNumber(p.quantity), 0);
  return onHand + onThisService;
}

/** Guess cylinder count from engine string e.g. "3.5L V6" → 6 */
function suggestSparkPlugCount(engine?: string | null): number | null {
  if (!engine) return null;
  const vMatch = engine.match(/\bV(\d+)\b/i);
  if (vMatch) return parseInt(vMatch[1], 10);
  const iMatch = engine.match(/\bI(\d+)\b/i);
  if (iMatch) return parseInt(iMatch[1], 10);
  return null;
}

function isSparkPlugItem(item: InventoryItem): boolean {
  return item.category === 'Spark Plugs';
}

function defaultQtyForItem(
  item: InventoryItem,
  available: number,
  serviceType: string,
  engine?: string | null
): number {
  if (isSparkPlugItem(item) && serviceType === 'Spark Plugs') {
    const cylinders = suggestSparkPlugCount(engine) ?? 6;
    return Math.min(available, Math.max(1, cylinders));
  }
  return 1;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  serviceToEdit,
  defaults,
  draftParts,
  appliedPlanId,
  inventoryItems = [],
  onSaved,
}) => {
  const { activeVehicle, refreshAll } = useVehicle();
  const isEditing = Boolean(serviceToEdit?.id);
  const seed = isEditing ? serviceToEdit : defaults;
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [date, setDate] = useState<string>(
    seed?.date || new Date().toISOString().split('T')[0]
  );
  const [odometer, setOdometer] = useState<string>(
    seed?.odometer != null ? String(seed.odometer) : ''
  );
  const [serviceType, setServiceType] = useState<string>(
    seed?.service_type || 'Oil Change'
  );
  const [title, setTitle] = useState<string>(
    seed?.title || 'Oil & Filter Change'
  );
  const [description, setDescription] = useState<string>(
    seed?.description || ''
  );
  const [partsCost, setPartsCost] = useState<string>(
    seed?.parts_cost != null ? String(seed.parts_cost) : ''
  );
  const [laborCost, setLaborCost] = useState<string>(
    seed?.labor_cost != null ? String(seed.labor_cost) : ''
  );
  const [isDiy, setIsDiy] = useState<boolean>(
    seed ? seed.is_diy === 1 : false
  );
  const [serviceProvider, setServiceProvider] = useState<string>(
    seed?.service_provider || ''
  );
  const [receiptImage, setReceiptImage] = useState<string>(
    seed?.receipt_image || ''
  );

  const [costMode, setCostMode] = useState<CostMode>(
    serviceToEdit?.parts && serviceToEdit.parts.length > 0 ? 'inventory' : 'simple'
  );
  const [selectedParts, setSelectedParts] = useState<ServicePartDraft[]>([]);
  const modalSessionRef = useRef<string | null>(null);
  const costModeTouchedRef = useRef(false);
  const [openPlans, setOpenPlans] = useState<Plan[]>([]);
  const [localAppliedPlanId, setLocalAppliedPlanId] = useState<string | null>(
    appliedPlanId || null
  );

  const stockCount = (items: InventoryItem[]) =>
    items.filter((i) => asNumber(i.quantity_on_hand) > 0).length;

  useEffect(() => {
    if (!isOpen || isEditing || !activeVehicle) {
      setOpenPlans([]);
      return;
    }
    void api
      .getPlans(activeVehicle.id, 'open')
      .then((rows) => setOpenPlans(rows.filter((p) => p.plan_kind === 'service')))
      .catch(() => setOpenPlans([]));
  }, [isOpen, isEditing, activeVehicle?.id]);

  useEffect(() => {
    if (!isOpen) {
      modalSessionRef.current = null;
      costModeTouchedRef.current = false;
      setLocalAppliedPlanId(null);
      return;
    }
    setLocalAppliedPlanId(appliedPlanId || null);

    const sessionKey =
      serviceToEdit?.id ||
      appliedPlanId ||
      (defaults ? `defaults:${defaults.service_type}:${defaults.title}` : 'new');
    if (modalSessionRef.current === sessionKey) return;
    modalSessionRef.current = sessionKey;
    costModeTouchedRef.current = false;

    if (isEditing && serviceToEdit) {
      setDate(serviceToEdit.date);
      setOdometer(String(serviceToEdit.odometer));
      setServiceType(serviceToEdit.service_type);
      setTitle(serviceToEdit.title);
      setDescription(serviceToEdit.description || '');
      setPartsCost(String(serviceToEdit.parts_cost));
      setLaborCost(String(serviceToEdit.labor_cost));
      setIsDiy(serviceToEdit.is_diy === 1);
      setServiceProvider(serviceToEdit.service_provider || '');
      setReceiptImage(serviceToEdit.receipt_image || '');
      if (serviceToEdit.parts && serviceToEdit.parts.length > 0) {
        setCostMode('inventory');
        setSelectedParts(
          serviceToEdit.parts.map((p) => ({
            inventory_item_id: p.inventory_item_id,
            name: p.name,
            quantity: asNumber(p.quantity, 1),
            unit_cost: asNumber(p.unit_cost),
          }))
        );
      } else {
        setCostMode('simple');
        setSelectedParts([]);
      }
    } else {
      setDate(defaults?.date || new Date().toISOString().split('T')[0]);
      setOdometer(defaults?.odometer != null ? String(defaults.odometer) : '');
      setServiceType(defaults?.service_type || 'Oil Change');
      setTitle(defaults?.title || 'Oil & Filter Change');
      setDescription(defaults?.description || '');
      setPartsCost(defaults?.parts_cost != null ? String(defaults.parts_cost) : '');
      setLaborCost(defaults?.labor_cost != null ? String(defaults.labor_cost) : '');
      setIsDiy(defaults?.is_diy === 1);
      setServiceProvider(defaults?.service_provider || '');
      setReceiptImage(defaults?.receipt_image || '');
      if (draftParts && draftParts.length > 0) {
        costModeTouchedRef.current = true;
        setCostMode('inventory');
        setSelectedParts(
          draftParts.map((p) => ({
            inventory_item_id: p.inventory_item_id,
            name: p.name,
            quantity: asNumber(p.quantity, 1),
            unit_cost: asNumber(p.unit_cost),
          }))
        );
      } else {
        setCostMode(stockCount(inventoryItems) > 0 ? 'inventory' : 'simple');
        setSelectedParts([]);
      }
    }
  }, [
    isOpen,
    serviceToEdit?.id,
    defaults?.service_type,
    defaults?.title,
    defaults?.odometer,
    appliedPlanId,
    draftParts,
  ]);

  // If inventory loads after the modal opens, default new services to inventory mode once.
  useEffect(() => {
    if (!isOpen || isEditing || costModeTouchedRef.current) return;
    if (stockCount(inventoryItems) > 0) {
      setCostMode('inventory');
    }
  }, [isOpen, isEditing, inventoryItems]);

  const handleCostModeChange = (mode: CostMode) => {
    costModeTouchedRef.current = true;
    setCostMode(mode);
  };

  const fillFromPlan = (planId: string) => {
    if (!planId || !activeVehicle) {
      setLocalAppliedPlanId(null);
      return;
    }
    const plan = openPlans.find((p) => p.id === planId);
    if (!plan) return;
    const d = planToServiceDefaults(plan, activeVehicle.id);
    const parts = planPartsToDraft(plan);
    setDate(d.date || new Date().toISOString().split('T')[0]);
    setServiceType(d.service_type || 'Oil Change');
    setTitle(d.title || plan.title);
    setDescription(d.description || '');
    setPartsCost(d.parts_cost != null ? String(d.parts_cost) : '');
    setLaborCost(d.labor_cost != null ? String(d.labor_cost) : '');
    setIsDiy(true);
    costModeTouchedRef.current = true;
    if (parts.length > 0) {
      setCostMode('inventory');
      setSelectedParts(parts);
    } else {
      setCostMode('simple');
      setSelectedParts([]);
    }
    setLocalAppliedPlanId(plan.id);
  };

  if (!isOpen || !activeVehicle) return null;

  const odoUnit = activeVehicle.odometer_unit || 'mi';

  const handleTypeChange = (type: string) => {
    setServiceType(type);
    if (!isEditing && (!title || SERVICE_TYPES.includes(title as any))) {
      setTitle(type);
    }
  };

  const inventoryPartsTotal = selectedParts.reduce(
    (sum, p) => sum + asNumber(p.unit_cost) * asNumber(p.quantity, 1),
    0
  );

  const effectivePartsCost =
    costMode === 'inventory' ? inventoryPartsTotal : parseFloat(partsCost) || 0;

  const totalCalculated = effectivePartsCost + (parseFloat(laborCost) || 0);

  const formatPartLabel = (item: InventoryItem) => {
    const size = item.package_size ? ` (${item.package_size})` : '';
    return `${item.name}${size}`;
  };

  const togglePartFromInventory = (item: InventoryItem) => {
    const existingIdx = selectedParts.findIndex((p) => p.inventory_item_id === item.id);
    if (existingIdx >= 0) {
      setSelectedParts(selectedParts.filter((_, i) => i !== existingIdx));
      return;
    }
    setSelectedParts([
      ...selectedParts,
      {
        inventory_item_id: item.id,
        name: formatPartLabel(item),
        quantity: defaultQtyForItem(
          item,
          getAvailableQty(item, serviceToEdit),
          serviceType,
          activeVehicle?.engine
        ),
        unit_cost: asNumber(item.unit_cost),
      },
    ]);
  };

  const updatePartQty = (index: number, qty: number, maxQty?: number) => {
    const capped = maxQty != null ? Math.min(Math.max(qty, 0), maxQty) : Math.max(qty, 0);
    if (capped <= 0) {
      setSelectedParts(selectedParts.filter((_, i) => i !== index));
      return;
    }
    setSelectedParts(
      selectedParts.map((p, i) => (i === index ? { ...p, quantity: capped } : p))
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const res = await api.uploadImage(file);
      setReceiptImage(res.url);
    } catch (err: any) {
      alert('Failed to upload receipt image: ' + err.message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odometer || !serviceType || !title) {
      alert('Please fill in odometer, service type, and title.');
      return;
    }

    if (costMode === 'inventory' && selectedParts.length === 0) {
      alert('Add at least one part from inventory, or switch to Quick Price entry.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        vehicle_id: activeVehicle.id,
        date,
        odometer: parseFloat(odometer),
        service_type: serviceType,
        title,
        description: description.trim() || undefined,
        parts_cost: effectivePartsCost,
        labor_cost: parseFloat(laborCost) || 0,
        total_cost: totalCalculated,
        is_diy: isDiy ? 1 : 0,
        service_provider: isDiy ? 'Self (DIY)' : serviceProvider.trim() || undefined,
        receipt_image: receiptImage || undefined,
        use_inventory_parts: costMode === 'inventory',
        parts:
          costMode === 'inventory'
            ? selectedParts.map((p) => ({
                inventory_item_id: p.inventory_item_id,
                name: p.name,
                quantity: p.quantity,
                unit_cost: p.unit_cost,
              }))
            : [],
      };

      if (isEditing && serviceToEdit?.id) {
        await api.updateService(serviceToEdit.id, payload);
      } else {
        await api.addService(payload);
        if (localAppliedPlanId) {
          try {
            await api.applyPlan(localAppliedPlanId);
          } catch (planErr) {
            console.warn('Service saved but plan could not be marked applied', planErr);
          }
        }
      }

      await refreshAll();
      if (onSaved) await onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving service record');
    } finally {
      setSubmitting(false);
    }
  };

  const inStockItems = inventoryItems.filter(
    (i) => getAvailableQty(i, serviceToEdit) > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Edit Service Record' : 'Log Maintenance & Service'}
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
          {!isEditing && openPlans.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Fill from plan
              </label>
              <select
                value={localAppliedPlanId || ''}
                onChange={(e) => fillFromPlan(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="">None — enter manually</option>
                {openPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.estimated_total != null ? ` ($${asNumber(p.estimated_total).toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Odometer ({odoUnit}) *
              </label>
              <input
                type="number"
                required
                placeholder="0"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Type *</label>
            <select
              value={serviceType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Synthetic 0W-20 & Filter Replacement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Cost entry mode toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Parts & Cost Entry</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCostModeChange('simple')}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
                  costMode === 'simple'
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Quick Price</div>
                  <div className="text-[10px] opacity-70">Enter parts $ total</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleCostModeChange('inventory')}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
                  costMode === 'inventory'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">From Inventory</div>
                  <div className="text-[10px] opacity-70">Pick multiple parts</div>
                </div>
              </button>
            </div>
          </div>

          {costMode === 'simple' ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Parts Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Labor ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isDiy}
                  value={isDiy ? '0' : laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Total ($)</label>
                <div className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-emerald-400">
                  ${totalCalculated.toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <p className="text-xs text-slate-400">
                Select all parts used for this service — oil, filter, fluids, etc. Each adds to the parts total.
              </p>

              {inventoryItems.length === 0 ? (
                <p className="text-xs text-amber-400/80">
                  No inventory yet — add parts under the Parts tab, then come back here.
                </p>
              ) : inStockItems.length === 0 ? (
                <p className="text-xs text-amber-400/80">
                  All inventory items are out of stock. Restock or use Quick Price entry.
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {inStockItems.map((item) => {
                    const stockOnShelf = asNumber(item.quantity_on_hand);
                    const available = getAvailableQty(item, serviceToEdit);
                    const unitCost = asNumber(item.unit_cost);
                    const selectedIdx = selectedParts.findIndex(
                      (p) => p.inventory_item_id === item.id
                    );
                    const isSelected = selectedIdx >= 0;
                    const selectedPart = isSelected ? selectedParts[selectedIdx] : null;
                    const qty = selectedPart ? asNumber(selectedPart.quantity, 1) : 0;
                    const lineTotal = qty * unitCost;

                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => togglePartFromInventory(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            togglePartFromInventory(item);
                          }
                        }}
                        className={`rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-slate-900/50 border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-3 p-3">
                          <div
                            className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {formatPartLabel(item)}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {item.category} • ${formatMoney(unitCost)} •{' '}
                              {available} available
                              {serviceToEdit && available > stockOnShelf && (
                                <span className="text-slate-500">
                                  {' '}
                                  ({stockOnShelf} on shelf +{' '}
                                  {available - stockOnShelf} on this service)
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-sm font-mono text-emerald-400 flex-shrink-0">
                              ${formatMoney(lineTotal)}
                            </span>
                          )}
                        </div>

                        {isSelected && selectedPart && (
                          <div
                            className="flex items-center justify-between gap-2 px-3 pb-3 pl-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[11px] text-slate-400 uppercase font-semibold">
                              Qty used
                              {isSparkPlugItem(item) &&
                                serviceType === 'Spark Plugs' &&
                                suggestSparkPlugCount(activeVehicle?.engine) && (
                                  <span className="normal-case text-slate-500 font-normal ml-1">
                                    (engine: {suggestSparkPlugCount(activeVehicle?.engine)})
                                  </span>
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                              {isSparkPlugItem(item) && serviceType === 'Spark Plugs' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePartQty(
                                      selectedIdx,
                                      suggestSparkPlugCount(activeVehicle?.engine) ?? 6,
                                      available
                                    )
                                  }
                                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30"
                                >
                                  Set {Math.min(
                                    available,
                                    suggestSparkPlugCount(activeVehicle?.engine) ?? 6
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  updatePartQty(selectedIdx, qty - 1, available)
                                }
                                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-bold hover:bg-slate-700"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={available}
                                step="1"
                                value={qty}
                                onChange={(e) =>
                                  updatePartQty(
                                    selectedIdx,
                                    parseInt(e.target.value, 10) || 1,
                                    available
                                  )
                                }
                                className="w-14 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white font-mono text-center"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updatePartQty(selectedIdx, qty + 1, available)
                                }
                                disabled={qty >= available}
                                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedParts.length > 0 && (
                <div className="bg-slate-900/60 rounded-xl px-3 py-2 text-xs text-slate-300">
                  <span className="font-semibold text-amber-300">
                    {selectedParts.length} part{selectedParts.length !== 1 ? 's' : ''} selected
                  </span>
                  <span className="text-slate-500 mx-2">•</span>
                  {selectedParts.map((p, i) => (
                    <span key={`${p.inventory_item_id}-${i}`}>
                      {i > 0 && ', '}
                      {p.name} ×{p.quantity}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/50">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Parts Total</label>
                  <div className="font-mono font-bold text-emerald-400">${inventoryPartsTotal.toFixed(2)}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Labor ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isDiy}
                    value={isDiy ? '0' : laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white font-mono disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-emerald-400">
                Total: ${totalCalculated.toFixed(2)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsDiy(!isDiy);
                if (!isDiy) setLaborCost('0');
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                isDiy
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">Do-It-Yourself (DIY)</div>
                <div className="text-[10px] text-slate-400">Self installed ($0 labor)</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  isDiy ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                }`}
              >
                {isDiy && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>

            {!isDiy && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Shop / Provider</label>
                <input
                  type="text"
                  placeholder="e.g. Dealer, Firestone"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional notes about this service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Receipt / Invoice</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{uploadingReceipt ? 'Uploading...' : 'Attach Invoice'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {receiptImage && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Attached</span>
                  <button type="button" onClick={() => setReceiptImage('')} className="text-slate-400 hover:text-red-400">Remove</button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Service Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
