import React, { useState, useEffect, useMemo } from 'react';
import { X, Car, Save, Sparkles, Fuel, Zap, Gauge } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { Vehicle } from '../../types';
import {
  ALL_BRANDS,
  YEARS_LIST,
  getModelsForMake,
  getModelDetails,
} from '../../data/vehicleDatabase';
import {
  SearchableCombobox,
  ComboboxOption,
} from '../common/SearchableCombobox';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleToEdit?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  vehicleToEdit,
}) => {
  const { createVehicle, updateVehicle } = useVehicle();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: vehicleToEdit?.name || '',
    make: vehicleToEdit?.make || '',
    model: vehicleToEdit?.model || '',
    year: vehicleToEdit?.year || new Date().getFullYear(),
    trim: vehicleToEdit?.trim || '',
    engine: vehicleToEdit?.engine || '',
    vin: vehicleToEdit?.vin || '',
    license_plate: vehicleToEdit?.license_plate || '',
    fuel_type: vehicleToEdit?.fuel_type || 'Gasoline',
    tank_capacity: vehicleToEdit?.tank_capacity || '',
    odometer_unit: vehicleToEdit?.odometer_unit || 'mi',
    fuel_unit: vehicleToEdit?.fuel_unit || 'gal',
    currency: vehicleToEdit?.currency || 'USD',
    purchase_date: vehicleToEdit?.purchase_date || '',
    purchase_price: vehicleToEdit?.purchase_price || '',
    purchase_odometer: vehicleToEdit?.purchase_odometer || '',
    notes: vehicleToEdit?.notes || '',
  });

  // Track if user manually modified nickname
  const [hasCustomName, setHasCustomName] = useState(Boolean(vehicleToEdit?.name));

  // Sync state when editing a different vehicle
  useEffect(() => {
    if (vehicleToEdit) {
      setFormData({
        name: vehicleToEdit.name || '',
        make: vehicleToEdit.make || '',
        model: vehicleToEdit.model || '',
        year: vehicleToEdit.year || new Date().getFullYear(),
        trim: vehicleToEdit.trim || '',
        engine: vehicleToEdit.engine || '',
        vin: vehicleToEdit.vin || '',
        license_plate: vehicleToEdit.license_plate || '',
        fuel_type: vehicleToEdit.fuel_type || 'Gasoline',
        tank_capacity: vehicleToEdit.tank_capacity || '',
        odometer_unit: vehicleToEdit.odometer_unit || 'mi',
        fuel_unit: vehicleToEdit.fuel_unit || 'gal',
        currency: vehicleToEdit.currency || 'USD',
        purchase_date: vehicleToEdit.purchase_date || '',
        purchase_price: vehicleToEdit.purchase_price || '',
        purchase_odometer: vehicleToEdit.purchase_odometer || '',
        notes: vehicleToEdit.notes || '',
      });
      setHasCustomName(true);
    } else {
      setFormData({
        name: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        trim: '',
        engine: '',
        vin: '',
        license_plate: '',
        fuel_type: 'Gasoline',
        tank_capacity: '',
        odometer_unit: 'mi',
        fuel_unit: 'gal',
        currency: 'USD',
        purchase_date: '',
        purchase_price: '',
        purchase_odometer: '',
        notes: '',
      });
      setHasCustomName(false);
    }
  }, [vehicleToEdit, isOpen]);

  // Available brands options for Make
  const makeOptions = useMemo<ComboboxOption[]>(() => {
    return ALL_BRANDS.map((b) => ({
      value: b,
      label: b,
    }));
  }, []);

  // Available models based on selected Make and selected Year (blocking out models unavailable that year)
  const availableModels = useMemo(() => {
    if (!formData.make) return [];
    return getModelsForMake(formData.make, formData.year);
  }, [formData.make, formData.year]);

  const modelOptions = useMemo<ComboboxOption[]>(() => {
    return availableModels.map((m) => ({
      value: m.name,
      label: m.name,
      badge: m.endYear === 9999 ? `${m.startYear}+` : `${m.startYear}-${m.endYear}`,
    }));
  }, [availableModels]);

  // Model details for Trim and Engine lists
  const currentModelDetails = useMemo(() => {
    if (!formData.make || !formData.model) return null;
    return getModelDetails(formData.make, formData.model);
  }, [formData.make, formData.model]);

  // Trim options
  const trimOptions = useMemo<ComboboxOption[]>(() => {
    if (!currentModelDetails?.trims) return [];
    return currentModelDetails.trims.map((t) => ({
      value: t,
      label: t,
    }));
  }, [currentModelDetails]);

  // Engine options
  const engineOptions = useMemo<ComboboxOption[]>(() => {
    if (!currentModelDetails?.engines) return [];
    return currentModelDetails.engines.map((e) => ({
      value: e.name,
      label: e.name,
      badge: e.fuelType,
      sublabel: e.tankCapacity ? `~${e.tankCapacity} gal tank` : undefined,
    }));
  }, [currentModelDetails]);

  // Handle Make change
  const handleMakeChange = (newMake: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        make: newMake,
        model: '',
        trim: '',
        engine: '',
      };
      if (!hasCustomName) {
        updated.name = `${prev.year} ${newMake}`.trim();
      }
      return updated;
    });
  };

  // Handle Year change
  const handleYearChange = (newYear: number) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        year: newYear,
      };

      // Check if current model is still valid for this year
      if (prev.make && prev.model) {
        const modelsForNewYear = getModelsForMake(prev.make, newYear);
        const isValidModel = modelsForNewYear.some(
          (m) => m.name.toLowerCase() === prev.model.toLowerCase()
        );
        if (!isValidModel && modelsForNewYear.length > 0) {
          // Keep the model if it's custom, but if it came from presets, let it be or retain
        }
      }

      if (!hasCustomName && prev.make) {
        const parts = [newYear, prev.make, prev.model, prev.trim].filter(Boolean);
        updated.name = parts.join(' ');
      }
      return updated;
    });
  };

  // Handle Model change
  const handleModelChange = (newModel: string) => {
    const details = getModelDetails(formData.make, newModel);

    setFormData((prev) => {
      const updated = {
        ...prev,
        model: newModel,
        trim: '',
        engine: '',
      };

      // Set default tank capacity if model provides one
      if (details?.defaultTankCapacity && !prev.tank_capacity) {
        updated.tank_capacity = details.defaultTankCapacity as any;
      }

      if (!hasCustomName) {
        const parts = [prev.year, prev.make, newModel].filter(Boolean);
        updated.name = parts.join(' ');
      }
      return updated;
    });
  };

  // Handle Trim change
  const handleTrimChange = (newTrim: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        trim: newTrim,
      };
      if (!hasCustomName) {
        const parts = [prev.year, prev.make, prev.model, newTrim].filter(Boolean);
        updated.name = parts.join(' ');
      }
      return updated;
    });
  };

  // Handle Engine change
  const handleEngineChange = (newEngine: string) => {
    const engineMatch = currentModelDetails?.engines.find(
      (e) => e.name.toLowerCase() === newEngine.toLowerCase()
    );

    setFormData((prev) => {
      const updated = {
        ...prev,
        engine: newEngine,
      };

      if (engineMatch) {
        updated.fuel_type = engineMatch.fuelType;
        if (engineMatch.tankCapacity) {
          updated.tank_capacity = engineMatch.tankCapacity as any;
        }
      }

      return updated;
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (vehicleToEdit) {
        await updateVehicle(vehicleToEdit.id, formData as any);
      } else {
        await createVehicle(formData as any);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {vehicleToEdit ? 'Edit Vehicle Specs' : 'Add New Vehicle'}
              </h2>
              <p className="text-xs text-slate-400">
                {vehicleToEdit
                  ? 'Update vehicle details, engine and specifications'
                  : 'Select Make, Model, Trim & Engine with auto-presets'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section: Vehicle Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800/80">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Vehicle Identification & Catalog Presets
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Year Dropdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Year <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.year}
                    onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer"
                  >
                    {YEARS_LIST.map((y) => (
                      <option key={y} value={y} className="bg-slate-900 text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Make Searchable Combobox */}
              <div className="sm:col-span-2">
                <SearchableCombobox
                  label="Make / Brand"
                  required
                  value={formData.make}
                  onChange={handleMakeChange}
                  options={makeOptions}
                  placeholder="e.g. Toyota, Ford, BMW..."
                  helperText={
                    !formData.make ? 'Type or pick from 50+ manufacturers' : undefined
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Model Searchable Combobox */}
              <div>
                <SearchableCombobox
                  label="Model"
                  required
                  value={formData.model}
                  onChange={handleModelChange}
                  options={modelOptions}
                  disabled={!formData.make}
                  placeholder={
                    !formData.make
                      ? 'Select Make first'
                      : `e.g. ${availableModels[0]?.name || 'Model'}`
                  }
                  helperText={
                    formData.make && availableModels.length > 0
                      ? `${availableModels.length} models available for ${formData.year}`
                      : formData.make
                      ? `Type custom model name for ${formData.make}`
                      : undefined
                  }
                />
              </div>

              {/* Trim / Submodel Searchable Combobox */}
              <div>
                <SearchableCombobox
                  label="Trim / Package"
                  value={formData.trim || ''}
                  onChange={handleTrimChange}
                  options={trimOptions}
                  placeholder={
                    trimOptions.length > 0
                      ? `e.g. ${trimOptions[0]?.label || 'SE / GT'}`
                      : 'e.g. Premium / Base / Sport'
                  }
                  helperText={
                    trimOptions.length > 0
                      ? `${trimOptions.length} factory trim presets available`
                      : 'Type or choose trim'
                  }
                />
              </div>
            </div>

            {/* Engine Type Searchable Combobox */}
            <div>
              <SearchableCombobox
                label="Engine / Powertrain"
                value={formData.engine || ''}
                onChange={handleEngineChange}
                options={engineOptions}
                placeholder={
                  engineOptions.length > 0
                    ? `e.g. ${engineOptions[0]?.label}`
                    : 'e.g. 2.0L Turbo I4 / Dual Motor EV'
                }
                helperText={
                  engineOptions.length > 0
                    ? 'Selecting an engine auto-configures fuel type and capacity'
                    : 'Factory engine or custom powertrain spec'
                }
              />
            </div>

            {/* Nickname / Display Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>
                  Nickname / Display Name <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Shown in headers & dashboard
                </span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2024 Toyota Camry XSE"
                value={formData.name}
                onChange={(e) => {
                  setHasCustomName(true);
                  setFormData({ ...formData, name: e.target.value });
                }}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Section: Fuel & Specifications */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800/80">
              <Fuel className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Fuel & Capacity Specifications
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Fuel / Power Type
                </label>
                <select
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Gasoline">Gasoline (Regular / Premium)</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid (HEV / PHEV)</option>
                  <option value="Electric">Electric (BEV)</option>
                  <option value="E85">E85 / Flex Fuel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Tank / Battery Capacity ({formData.fuel_unit === 'gal' ? 'Gallons' : 'Liters'} / kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 15.8"
                  value={formData.tank_capacity}
                  onChange={(e) => setFormData({ ...formData, tank_capacity: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Odometer Unit
                </label>
                <select
                  value={formData.odometer_unit}
                  onChange={(e) => setFormData({ ...formData, odometer_unit: e.target.value as any })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="mi">Miles (mi)</option>
                  <option value="km">Kilometers (km)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Fuel Volume Unit
                </label>
                <select
                  value={formData.fuel_unit}
                  onChange={(e) => setFormData({ ...formData, fuel_unit: e.target.value as any })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="gal">Gallons (gal)</option>
                  <option value="L">Liters (L)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Registration & Purchase Info */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800/80">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Registration & Purchase Info
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  License Plate
                </label>
                <input
                  type="text"
                  placeholder="ABC-1234"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 uppercase tracking-wider font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  VIN (Vehicle Identification Number)
                </label>
                <input
                  type="text"
                  placeholder="17-character VIN"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Purchase Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Purchase / Starting Odometer
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.purchase_odometer}
                  onChange={(e) => setFormData({ ...formData, purchase_odometer: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Notes & Additional Details
              </label>
              <textarea
                rows={2}
                placeholder="Transmission type, custom modifications, color, tire specs..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-brand-600 via-emerald-600 to-brand-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-950/50 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Vehicle...' : vehicleToEdit ? 'Update Vehicle Specs' : 'Save & Track Vehicle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
