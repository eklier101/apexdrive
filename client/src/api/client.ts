import { Capacitor } from '@capacitor/core';
import {
  User,
  AuthResponse,
  Vehicle,
  Fillup,
  ServiceItem,
  ServiceReminder,
  InventoryItem,
  ServicePartDraft,
  Upgrade,
  OtherExpense,
  DashboardStats,
  Plan,
  PlanPart,
} from '../types';
import { asNumber } from '../utils/numbers';

function normalizeInventoryItem(item: InventoryItem): InventoryItem {
  return {
    ...item,
    unit_cost: asNumber(item.unit_cost),
    quantity_on_hand: asNumber(item.quantity_on_hand),
    low_stock_threshold:
      item.low_stock_threshold != null ? asNumber(item.low_stock_threshold) : null,
  };
}

function normalizeServiceItem(service: ServiceItem): ServiceItem {
  return {
    ...service,
    odometer: asNumber(service.odometer),
    parts_cost: asNumber(service.parts_cost),
    labor_cost: asNumber(service.labor_cost),
    total_cost: asNumber(service.total_cost),
    parts: service.parts?.map((p) => ({
      ...p,
      quantity: asNumber(p.quantity),
      unit_cost: asNumber(p.unit_cost),
      total_cost: asNumber(p.total_cost),
    })),
  };
}

const STORAGE_SERVER_KEY = 'vt_server_url';
const STORAGE_TOKEN_KEY = 'vt_auth_token';
/** No default on mobile — user sets server URL in Settings on first use */
export const DEFAULT_SERVER_URL = '';

export function getServerUrl(): string {
  const saved = localStorage.getItem(STORAGE_SERVER_KEY);
  if (saved) return saved.replace(/\/$/, '');

  if (Capacitor.isNativePlatform()) {
    return DEFAULT_SERVER_URL;
  }
  return window.location.origin;
}

export function setServerUrl(url: string): void {
  localStorage.setItem(STORAGE_SERVER_KEY, url.trim().replace(/\/$/, ''));
}

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }
}

async function fetchWithBase(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getServerUrl();
  if (!baseUrl) {
    throw new Error('Server URL is not set. Enter your ApexDrive host on the sign-in screen.');
  }
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    return res;
  } catch (error) {
    console.error(`Network error calling ${url}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  async register(data: { username: string; password: string; email?: string }): Promise<AuthResponse> {
    const res = await fetchWithBase('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async login(data: { username: string; password: string }): Promise<AuthResponse> {
    const res = await fetchWithBase('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid credentials' }));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetchWithBase('/api/auth/me');
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  async updateProfile(data: { email?: string }): Promise<{ user: User }> {
    const res = await fetchWithBase('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update profile' }));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    const res = await fetchWithBase('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to change password' }));
      throw new Error(err.error || 'Failed to change password');
    }
  },

  async deleteAccount(data: { password: string; confirm: string }): Promise<void> {
    const res = await fetchWithBase('/api/auth/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete account' }));
      throw new Error(err.error || 'Failed to delete account');
    }
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    const res = await fetchWithBase('/api/vehicles');
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    const data = await res.json();
    localStorage.setItem('cached_vehicles', JSON.stringify(data));
    return data;
  },

  async getVehicle(id: string): Promise<Vehicle> {
    const res = await fetchWithBase(`/api/vehicles/${id}`);
    if (!res.ok) throw new Error('Failed to fetch vehicle');
    return res.json();
  },

  async createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
    const res = await fetchWithBase('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create vehicle' }));
      throw new Error(err.error || 'Failed to create vehicle');
    }
    return res.json();
  },

  async updateVehicle(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    const res = await fetchWithBase(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update vehicle' }));
      throw new Error(err.error || 'Failed to update vehicle');
    }
    return res.json();
  },

  async deleteVehicle(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/vehicles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete vehicle');
  },

  // Fillups
  async getFillups(vehicleId: string): Promise<Fillup[]> {
    const res = await fetchWithBase(`/api/fillups?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch fillups');
    const data = await res.json();
    localStorage.setItem(`cached_fillups_${vehicleId}`, JSON.stringify(data));
    return data;
  },

  async getLatestFillup(vehicleId: string): Promise<Fillup | null> {
    const res = await fetchWithBase(`/api/fillups/latest?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch latest fillup');
    return res.json();
  },

  async addFillup(payload: Partial<Fillup>): Promise<Fillup> {
    const res = await fetchWithBase('/api/fillups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add fillup');
    return res.json();
  },

  async updateFillup(id: string, payload: Partial<Fillup>): Promise<Fillup> {
    const res = await fetchWithBase(`/api/fillups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update fillup');
    return res.json();
  },

  async deleteFillup(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/fillups/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete fillup');
  },

  // Services
  async getServices(vehicleId: string): Promise<ServiceItem[]> {
    const res = await fetchWithBase(`/api/services?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch services');
    const data: ServiceItem[] = await res.json();
    return data.map(normalizeServiceItem);
  },

  async addService(payload: Partial<ServiceItem> & { parts?: ServicePartDraft[]; use_inventory_parts?: boolean }): Promise<ServiceItem> {
    const res = await fetchWithBase('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add service' }));
      throw new Error(err.error || 'Failed to add service');
    }
    return normalizeServiceItem(await res.json());
  },

  async updateService(id: string, payload: Partial<ServiceItem> & { parts?: ServicePartDraft[]; use_inventory_parts?: boolean }): Promise<ServiceItem> {
    const res = await fetchWithBase(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update service' }));
      throw new Error(err.error || 'Failed to update service');
    }
    return normalizeServiceItem(await res.json());
  },

  async deleteService(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/services/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete service');
  },

  // Parts Inventory
  async getInventory(): Promise<InventoryItem[]> {
    const res = await fetchWithBase('/api/inventory');
    if (!res.ok) throw new Error('Failed to fetch inventory');
    const data: InventoryItem[] = await res.json();
    return data.map(normalizeInventoryItem);
  },

  async createInventoryItem(payload: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetchWithBase('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add inventory item' }));
      throw new Error(err.error || 'Failed to add inventory item');
    }
    return normalizeInventoryItem(await res.json());
  },

  async updateInventoryItem(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetchWithBase(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update inventory item' }));
      throw new Error(err.error || 'Failed to update inventory item');
    }
    return normalizeInventoryItem(await res.json());
  },

  async deleteInventoryItem(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/inventory/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete inventory item');
  },

  // Upgrades
  async getUpgrades(vehicleId: string): Promise<Upgrade[]> {
    const res = await fetchWithBase(`/api/upgrades?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch upgrades');
    return res.json();
  },

  async addUpgrade(payload: Partial<Upgrade>): Promise<Upgrade> {
    const res = await fetchWithBase('/api/upgrades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add upgrade');
    return res.json();
  },

  async updateUpgrade(id: string, payload: Partial<Upgrade>): Promise<Upgrade> {
    const res = await fetchWithBase(`/api/upgrades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update upgrade');
    return res.json();
  },

  async deleteUpgrade(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/upgrades/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete upgrade');
  },

  // Other Expenses
  async getExpenses(vehicleId: string): Promise<OtherExpense[]> {
    const res = await fetchWithBase(`/api/expenses?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async addExpense(payload: Partial<OtherExpense>): Promise<OtherExpense> {
    const res = await fetchWithBase('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add expense');
    return res.json();
  },

  async updateExpense(id: string, payload: Partial<OtherExpense>): Promise<OtherExpense> {
    const res = await fetchWithBase(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
  },

  // Reminders
  async getReminders(vehicleId: string): Promise<ServiceReminder[]> {
    const res = await fetchWithBase(`/api/reminders?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch reminders');
    return res.json();
  },

  async addReminder(payload: Partial<ServiceReminder>): Promise<ServiceReminder> {
    const res = await fetchWithBase('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add reminder');
    return res.json();
  },

  async updateReminder(id: string, payload: Partial<ServiceReminder>): Promise<ServiceReminder> {
    const res = await fetchWithBase(`/api/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update reminder');
    return res.json();
  },

  async deleteReminder(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/reminders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete reminder');
  },

  // Plans (service / mod cost planning)
  async getPlans(vehicleId: string, status?: string): Promise<Plan[]> {
    const q = new URLSearchParams({ vehicle_id: vehicleId });
    if (status) q.set('status', status);
    const res = await fetchWithBase(`/api/plans?${q}`);
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  },

  async getPlan(id: string): Promise<Plan> {
    const res = await fetchWithBase(`/api/plans/${id}`);
    if (!res.ok) throw new Error('Failed to fetch plan');
    return res.json();
  },

  async createPlan(
    payload: Omit<Partial<Plan>, 'parts'> & { parts?: Partial<PlanPart>[] }
  ): Promise<Plan> {
    const res = await fetchWithBase('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create plan' }));
      throw new Error(err.error || 'Failed to create plan');
    }
    return res.json();
  },

  async updatePlan(
    id: string,
    payload: Omit<Partial<Plan>, 'parts'> & { parts?: Partial<PlanPart>[] }
  ): Promise<Plan> {
    const res = await fetchWithBase(`/api/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update plan' }));
      throw new Error(err.error || 'Failed to update plan');
    }
    return res.json();
  },

  async deletePlan(id: string): Promise<void> {
    const res = await fetchWithBase(`/api/plans/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete plan');
  },

  async applyPlan(id: string): Promise<Plan> {
    const res = await fetchWithBase(`/api/plans/${id}/apply`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to mark plan applied' }));
      throw new Error(err.error || 'Failed to mark plan applied');
    }
    return res.json();
  },

  // Stats & Analytics
  async getDashboardStats(vehicleId: string): Promise<DashboardStats> {
    const res = await fetchWithBase(`/api/stats/dashboard?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getTrends(vehicleId: string): Promise<{ monthlyTrends: any[]; fillupTimeline: any[] }> {
    const res = await fetchWithBase(`/api/stats/trends?vehicle_id=${vehicleId}`);
    if (!res.ok) throw new Error('Failed to fetch trend data');
    return res.json();
  },

  // Upload image
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchWithBase('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload image');
    return res.json();
  },

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetchWithBase('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  },
};
