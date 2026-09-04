import React, { useState, useEffect, useCallback } from 'react';

import { Wrench, Plus, Trash2, Edit, Receipt, UserCheck, Building, Package } from 'lucide-react';

import { useVehicle } from '../context/VehicleContext';

import { ServiceItem, InventoryItem } from '../types';

import { api } from '../api/client';
import { formatMoney } from '../utils/numbers';

import { ServiceModal } from '../components/services/ServiceModal';

import { InventoryPanel } from '../components/services/InventoryPanel';



export const ServicesPage: React.FC = () => {

  const { activeVehicle } = useVehicle();

  const [services, setServices] = useState<ServiceItem[]>([]);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editingService, setEditingService] = useState<ServiceItem | null>(null);



  const loadInventory = useCallback(async () => {

    try {

      const data = await api.getInventory();

      setInventory(data);

    } catch (err) {

      console.error(err);

    }

  }, []);



  const loadServices = useCallback(async () => {

    if (!activeVehicle) return;

    setLoading(true);

    try {

      const data = await api.getServices(activeVehicle.id);

      setServices(data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }, [activeVehicle]);



  const refreshAll = useCallback(async () => {

    await Promise.all([loadServices(), loadInventory()]);

  }, [loadServices, loadInventory]);



  useEffect(() => {

    loadServices();

    loadInventory();

  }, [loadServices, loadInventory]);



  const handleDelete = async (id: string) => {

    if (!confirm('Are you sure you want to delete this service record? Parts will be returned to inventory.')) return;

    try {

      await api.deleteService(id);

      refreshAll();

    } catch (err: any) {

      alert(err.message || 'Failed to delete service record');

    }

  };

  const openServiceModal = () => {
    setEditingService(null);
    loadInventory();
    setShowModal(true);
  };

  const openEditServiceModal = (item: ServiceItem) => {
    setEditingService(item);
    loadInventory();
    setShowModal(true);
  };



  if (!activeVehicle) {

    return <div className="text-center py-12 text-slate-400">Please select a vehicle.</div>;

  }



  const odoUnit = activeVehicle.odometer_unit || 'mi';



  return (

    <div className="space-y-6 pb-24 md:pb-12">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">

            <Wrench className="w-6 h-6 text-emerald-500" />

            Maintenance & Service Log

          </h1>

          <p className="text-xs text-slate-400 mt-0.5">

            Quick price entry or pull parts from your inventory

          </p>

        </div>

        <button

          onClick={openServiceModal}

          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition"

        >

          <Plus className="w-4 h-4" />

          <span>Add Service</span>

        </button>

      </div>



      <InventoryPanel items={inventory} onRefresh={loadInventory} />



      {loading ? (

        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">

          Loading maintenance history...

        </div>

      ) : services.length === 0 ? (

        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">

          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />

          <h3 className="text-base font-bold text-white mb-1">No Service Records Yet</h3>

          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">

            Log oil changes with parts from inventory, or enter a quick price for shop work.

          </p>

          <button

            onClick={openServiceModal}

            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs"

          >

            Log First Service

          </button>

        </div>

      ) : (

        <div className="space-y-3">

          {services.map((item) => (

            <div

              key={item.id}

              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-3xl p-5 transition shadow-sm"

            >

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                <div className="flex items-start gap-3.5">

                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">

                    <Wrench className="w-5 h-5" />

                  </div>

                  <div>

                    <div className="flex items-center gap-2 flex-wrap">

                      <span className="font-bold text-white text-base">{item.title}</span>

                      <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-semibold rounded-lg">

                        {item.service_type}

                      </span>

                      {item.is_diy ? (

                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-lg font-medium">

                          <UserCheck className="w-3 h-3" />

                          DIY

                        </span>

                      ) : (

                        item.service_provider && (

                          <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-lg">

                            <Building className="w-3 h-3 text-slate-500" />

                            {item.service_provider}

                          </span>

                        )

                      )}

                    </div>



                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">

                      <span>{item.date}</span>

                      <span>•</span>

                      <span className="font-mono text-slate-300">

                        {item.odometer.toLocaleString()} {odoUnit}

                      </span>

                    </div>

                  </div>

                </div>



                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">

                  <div className="text-left sm:text-right">

                    <div className="text-lg font-mono font-bold text-emerald-400">

                      ${formatMoney(item.total_cost)}

                    </div>

                    <div className="text-xs text-slate-400 font-mono">

                      Parts: ${formatMoney(item.parts_cost)} • Labor: ${formatMoney(item.labor_cost)}

                    </div>

                  </div>



                  <div className="flex items-center gap-1">

                    <button

                      onClick={() => openEditServiceModal(item)}

                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"

                      title="Edit Service"

                    >

                      <Edit className="w-4 h-4" />

                    </button>

                    <button

                      onClick={() => handleDelete(item.id)}

                      className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"

                      title="Delete Service"

                    >

                      <Trash2 className="w-4 h-4" />

                    </button>

                  </div>

                </div>

              </div>



              {item.parts && item.parts.length > 0 && (

                <div className="mt-3 pt-3 border-t border-slate-800/80">

                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-400 mb-2">

                    <Package className="w-3 h-3" />

                    Parts Used

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {item.parts.map((p) => (

                      <span

                        key={p.id}

                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-300"

                      >

                        <span className="text-white font-medium">{p.name}</span>

                        <span className="text-slate-500">×{p.quantity}</span>

                        <span className="text-emerald-400 font-mono">${formatMoney(p.total_cost)}</span>

                      </span>

                    ))}

                  </div>

                </div>

              )}



              {(item.description || item.receipt_image) && (

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">

                  {item.description ? (

                    <div className="text-slate-300">{item.description}</div>

                  ) : (

                    <div />

                  )}



                  {item.receipt_image && (

                    <a

                      href={item.receipt_image}

                      target="_blank"

                      rel="noopener noreferrer"

                      className="flex items-center gap-1 text-emerald-400 hover:underline ml-auto"

                    >

                      <Receipt className="w-3.5 h-3.5" />

                      <span>View Invoice</span>

                    </a>

                  )}

                </div>

              )}

            </div>

          ))}

        </div>

      )}



      {showModal && (

        <ServiceModal

          isOpen={showModal}

          onClose={() => {

            setShowModal(false);

            setEditingService(null);

          }}

          serviceToEdit={editingService}

          inventoryItems={inventory}

          onSaved={refreshAll}

        />

      )}

    </div>

  );

};


