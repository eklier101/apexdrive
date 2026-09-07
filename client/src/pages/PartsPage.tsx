import React, { useCallback, useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { InventoryItem } from '../types';
import { api } from '../api/client';
import { InventoryPanel } from '../components/services/InventoryPanel';

export const PartsPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      setInventory(await api.getInventory());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-amber-400" />
          Parts Inventory
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Stock filters, oil bottles, and parts used when logging maintenance
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">Loading parts...</div>
      ) : (
        <InventoryPanel
          items={inventory}
          onRefresh={loadInventory}
          defaultExpanded
          collapsible={false}
        />
      )}
    </div>
  );
};
