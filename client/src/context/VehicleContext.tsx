import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Vehicle, DashboardStats } from '../types';
import { api } from '../api/client';

interface VehicleContextType {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  stats: DashboardStats | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOnline: boolean;
  setActiveVehicleId: (id: string) => void;
  refreshAll: () => Promise<void>;
  createVehicle: (payload: Partial<Vehicle>) => Promise<Vehicle>;
  updateVehicle: (id: string, payload: Partial<Vehicle>) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const cached = localStorage.getItem('cached_vehicles');
    return cached ? JSON.parse(cached) : [];
  });
  const [activeVehicleId, setActiveVehicleIdState] = useState<string>(() => {
    return localStorage.getItem('active_vehicle_id') || '';
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;

  const setActiveVehicleId = (id: string) => {
    setActiveVehicleIdState(id);
    localStorage.setItem('active_vehicle_id', id);
  };

  const loadStatsForVehicle = useCallback(async (vehId: string) => {
    try {
      const data = await api.getDashboardStats(vehId);
      setStats(data);
    } catch (err: any) {
      console.warn('Failed to load vehicle stats:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const isHealthy = await api.checkHealth();
      setIsOnline(isHealthy);

      const list = await api.getVehicles();
      setVehicles(list);

      let targetId = activeVehicleId;
      if (!targetId || !list.some((v) => v.id === targetId)) {
        targetId = list[0]?.id || '';
        if (targetId) {
          setActiveVehicleIdState(targetId);
          localStorage.setItem('active_vehicle_id', targetId);
        }
      }

      if (targetId) {
        await loadStatsForVehicle(targetId);
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setIsOnline(false);
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeVehicleId, loadStatsForVehicle]);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (activeVehicle?.id) {
      loadStatsForVehicle(activeVehicle.id);
    }
  }, [activeVehicle?.id, loadStatsForVehicle]);

  const createVehicle = async (payload: Partial<Vehicle>): Promise<Vehicle> => {
    const created = await api.createVehicle(payload);
    await refreshAll();
    setActiveVehicleId(created.id);
    return created;
  };

  const updateVehicle = async (id: string, payload: Partial<Vehicle>): Promise<Vehicle> => {
    const updated = await api.updateVehicle(id, payload);
    await refreshAll();
    return updated;
  };

  const deleteVehicle = async (id: string): Promise<void> => {
    await api.deleteVehicle(id);
    await refreshAll();
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        stats,
        loading,
        refreshing,
        error,
        isOnline,
        setActiveVehicleId,
        refreshAll,
        createVehicle,
        updateVehicle,
        deleteVehicle,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};
