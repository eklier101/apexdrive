export interface User {
  id: string;
  username: string;
  email?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Vehicle {
  id: string;
  user_id?: string | null;
  name: string;
  make: string;
  model: string;
  year: number;
  trim?: string | null;
  engine?: string | null;
  vin?: string | null;
  license_plate?: string | null;
  fuel_type: string;
  tank_capacity?: number | null;
  odometer_unit: 'mi' | 'km';
  fuel_unit: 'gal' | 'L';
  currency: string;
  purchase_date?: string | null;
  purchase_price?: number | null;
  purchase_odometer?: number | null;
  is_active: number;
  photo_url?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Fillup {
  id: string;
  vehicle_id: string;
  date: string;
  odometer: number;
  gallons: number;
  price_per_unit: number;
  total_cost: number;
  is_full_tank: number;
  is_missed: number;
  fuel_grade: string;
  station?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  receipt_image?: string | null;
  calculated_mpg?: number | null;
  calculated_cost_per_unit_distance?: number | null;
  distance_traveled?: number | null;
}

export interface ServiceItem {
  id: string;
  vehicle_id: string;
  date: string;
  odometer: number;
  service_type: string;
  title: string;
  description?: string | null;
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  is_diy: number;
  service_provider?: string | null;
  receipt_image?: string | null;
  parts?: ServicePart[];
}

export interface ServicePart {
  id: string;
  service_id: string;
  inventory_item_id?: string | null;
  name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface InventoryItem {
  id: string;
  user_id?: string | null;
  name: string;
  category: string;
  unit: string;
  package_size?: string | null;
  unit_cost: number;
  quantity_on_hand: number;
  low_stock_threshold?: number | null;
  part_number?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePartDraft {
  inventory_item_id?: string | null;
  name: string;
  quantity: number;
  unit_cost: number;
}

export interface ServiceReminder {
  id: string;
  vehicle_id: string;
  service_type: string;
  title: string;
  interval_miles?: number | null;
  interval_months?: number | null;
  last_serviced_odometer?: number | null;
  last_serviced_date?: string | null;
  next_due_odometer?: number | null;
  next_due_date?: string | null;
  is_dismissed: number;
  notes?: string | null;
  status: 'good' | 'due_soon' | 'overdue';
  miles_remaining?: number | null;
  days_remaining?: number | null;
}

export interface Upgrade {
  id: string;
  vehicle_id: string;
  date: string;
  odometer?: number | null;
  title: string;
  category: string;
  brand_part_number?: string | null;
  vendor?: string | null;
  part_cost: number;
  labor_cost: number;
  total_cost: number;
  is_installed: number;
  notes?: string | null;
  photo_url?: string | null;
}

export type PlanKind = 'service' | 'upgrade';
export type PlanStatus = 'open' | 'applied' | 'cancelled';
export type PlanPartAcquisition = 'need' | 'owned';

export interface PlanPart {
  id?: string;
  plan_id?: string;
  inventory_item_id?: string | null;
  name: string;
  quantity: number;
  unit_cost: number;
  acquisition: PlanPartAcquisition;
  notes?: string | null;
}

export interface Plan {
  id: string;
  vehicle_id: string;
  user_id?: string | null;
  plan_kind: PlanKind;
  title: string;
  service_type?: string | null;
  category?: string | null;
  notes?: string | null;
  labor_cost: number;
  status: PlanStatus;
  parts?: PlanPart[];
  parts_cost?: number;
  estimated_total?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OtherExpense {
  id: string;
  vehicle_id: string;
  date: string;
  category: string;
  amount: number;
  notes?: string | null;
  receipt_image?: string | null;
}

export interface DashboardStats {
  vehicle: Vehicle;
  metrics: {
    currentOdometer: number;
    totalMilesDriven: number;
    fuel: {
      totalCost: number;
      totalGallons: number;
      avgPricePerUnit: number;
      costPerMile: number;
      avgMpg: number;
      bestMpg: number;
      worstMpg: number;
      lastMpg: number;
      fillupCount: number;
    };
    service: {
      totalCost: number;
      partsCost: number;
      laborCost: number;
      serviceCount: number;
      diyCount: number;
    };
    upgrades: {
      totalCost: number;
      upgradeCount: number;
    };
    expenses: {
      totalCost: number;
      expenseCount: number;
    };
    tco: {
      purchasePrice: number;
      totalSpentExcludingPurchase: number;
      totalTCO: number;
      overallCostPerMile: number;
    };
  };
  reminders: ServiceReminder[];
  spendBreakdown: Array<{ name: string; value: number; color: string }>;
  timeline: Array<{
    type: 'fillup' | 'service' | 'upgrade' | 'expense';
    id: string;
    date: string;
    odometer: number | null;
    title: string;
    cost: number;
    extra?: string;
  }>;
}

export interface AppVersionInfo {
  available: boolean;
  id?: string;
  version: string;
  version_code: number;
  release_notes?: string;
  apk_size?: number;
  release_date?: string;
  download_url?: string;
  message?: string;
}
