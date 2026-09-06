import { Plan, ServiceItem, ServicePartDraft, Upgrade } from '../types';
import { asNumber } from './numbers';

export function planPartsToDraft(plan: Plan): ServicePartDraft[] {
  return (plan.parts || []).map((p) => ({
    inventory_item_id: p.acquisition === 'owned' ? p.inventory_item_id || null : null,
    name: p.name,
    quantity: asNumber(p.quantity, 1),
    unit_cost: asNumber(p.unit_cost),
  }));
}

export function planToServiceDefaults(plan: Plan, vehicleId: string): Partial<ServiceItem> {
  const draft = planPartsToDraft(plan);
  const partsCost = draft.reduce((s, p) => s + asNumber(p.unit_cost) * asNumber(p.quantity, 1), 0);
  const labor = asNumber(plan.labor_cost);
  return {
    vehicle_id: vehicleId,
    date: new Date().toISOString().split('T')[0],
    service_type: plan.service_type || 'Other',
    title: plan.title,
    description: plan.notes || undefined,
    parts_cost: partsCost,
    labor_cost: labor,
    total_cost: partsCost + labor,
    is_diy: 1,
  };
}

export function planToUpgradeDefaults(plan: Plan, vehicleId: string): Partial<Upgrade> {
  const partCost = (plan.parts || []).reduce(
    (s, p) => s + asNumber(p.unit_cost) * asNumber(p.quantity, 1),
    0
  );
  const labor = asNumber(plan.labor_cost);
  return {
    vehicle_id: vehicleId,
    date: new Date().toISOString().split('T')[0],
    title: plan.title,
    category: plan.category || 'Other',
    part_cost: partCost,
    labor_cost: labor,
    total_cost: partCost + labor,
    is_installed: 1,
    notes: plan.notes || undefined,
  };
}
