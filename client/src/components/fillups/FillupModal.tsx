import React, { useState, useEffect } from 'react';
import { X, Fuel, Save, Camera, Check, AlertCircle } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { Fillup } from '../../types';
import { api } from '../../api/client';

interface FillupModalProps {
  isOpen: boolean;
  onClose: () => void;
  fillupToEdit?: Fillup | null;
  onSaved?: () => void;
}

export const FillupModal: React.FC<FillupModalProps> = ({
  isOpen,
  onClose,
  fillupToEdit,
  onSaved,
}) => {
  const { activeVehicle, refreshAll } = useVehicle();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [previousFillup, setPreviousFillup] = useState<Fillup | null>(null);

  const [date, setDate] = useState<string>(
    fillupToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [odometer, setOdometer] = useState<string>(
    fillupToEdit ? String(fillupToEdit.odometer) : ''
  );
  const [gallons, setGallons] = useState<string>(
    fillupToEdit ? String(fillupToEdit.gallons) : ''
  );
  const [pricePerUnit, setPricePerUnit] = useState<string>(
    fillupToEdit ? String(fillupToEdit.price_per_unit) : ''
  );
  const [totalCost, setTotalCost] = useState<string>(
    fillupToEdit ? String(fillupToEdit.total_cost) : ''
  );
  const [isFullTank, setIsFullTank] = useState<boolean>(
    fillupToEdit ? fillupToEdit.is_full_tank === 1 : true
  );
  const [isMissed, setIsMissed] = useState<boolean>(
    fillupToEdit ? fillupToEdit.is_missed === 1 : false
  );
  const [fuelGrade, setFuelGrade] = useState<string>(
    fillupToEdit?.fuel_grade || 'Regular'
  );
  const [station, setStation] = useState<string>(fillupToEdit?.station || '');
  const [notes, setNotes] = useState<string>(fillupToEdit?.notes || '');
  const [receiptImage, setReceiptImage] = useState<string>(
    fillupToEdit?.receipt_image || ''
  );

  useEffect(() => {
    if (activeVehicle && !fillupToEdit) {
      api.getLatestFillup(activeVehicle.id).then((latest) => {
        setPreviousFillup(latest);
        if (latest && !odometer) {
          // Keep blank or pre-fill note with previous odometer
        }
      });
    }
  }, [activeVehicle, fillupToEdit]);

  if (!isOpen || !activeVehicle) return null;

  const odoUnit = activeVehicle.odometer_unit || 'mi';
  const fuelUnit = activeVehicle.fuel_unit || 'gal';

  // Live calculation helpers
  const handleGallonsChange = (val: string) => {
    setGallons(val);
    const g = parseFloat(val);
    const p = parseFloat(pricePerUnit);
    const t = parseFloat(totalCost);

    if (!isNaN(g) && g > 0) {
      if (!isNaN(p) && p > 0) {
        setTotalCost((g * p).toFixed(2));
      } else if (!isNaN(t) && t > 0) {
        setPricePerUnit((t / g).toFixed(3));
      }
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerUnit(val);
    const p = parseFloat(val);
    const g = parseFloat(gallons);
    if (!isNaN(p) && !isNaN(g) && g > 0) {
      setTotalCost((g * p).toFixed(2));
    }
  };

  const handleTotalChange = (val: string) => {
    setTotalCost(val);
    const t = parseFloat(val);
    const g = parseFloat(gallons);
    if (!isNaN(t) && !isNaN(g) && g > 0) {
      setPricePerUnit((t / g).toFixed(3));
    }
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
    if (!odometer || !gallons || (!totalCost && !pricePerUnit)) {
      alert('Please fill in odometer, gallons, and price/total.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Fillup> = {
        vehicle_id: activeVehicle.id,
        date,
        odometer: parseFloat(odometer),
        gallons: parseFloat(gallons),
        price_per_unit: parseFloat(pricePerUnit) || 0,
        total_cost: parseFloat(totalCost) || 0,
        is_full_tank: isFullTank ? 1 : 0,
        is_missed: isMissed ? 1 : 0,
        fuel_grade: fuelGrade,
        station: station.trim() || undefined,
        notes: notes.trim() || undefined,
        receipt_image: receiptImage || undefined,
      };

      if (fillupToEdit) {
        await api.updateFillup(fillupToEdit.id, payload);
      } else {
        await api.addFillup(payload);
      }

      await refreshAll();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving fillup');
    } finally {
      setSubmitting(false);
    }
  };

  // Distance estimation live preview
  const enteredOdo = parseFloat(odometer);
  const prevOdo = previousFillup?.odometer || activeVehicle.purchase_odometer || 0;
  const estimatedDistance = !isNaN(enteredOdo) && enteredOdo > prevOdo ? enteredOdo - prevOdo : null;
  const estimatedMpg =
    estimatedDistance && parseFloat(gallons) > 0 && isFullTank
      ? (estimatedDistance / parseFloat(gallons)).toFixed(1)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {fillupToEdit ? 'Edit Fillup' : 'Fast Fillup Log'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Estimated MPG / Trip Banner */}
          {estimatedMpg && (
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-between text-xs text-brand-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>
                  Trip Distance: <b className="text-white">{estimatedDistance} {odoUnit}</b>
                </span>
              </div>
              <div>
                Estimated MPG: <b className="text-white text-sm font-mono">{estimatedMpg}</b>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Odometer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Odometer ({odoUnit}) *
                </label>
                {previousFillup && (
                  <span className="text-[10px] text-slate-400">
                    Prev: {previousFillup.odometer}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                required
                placeholder={previousFillup ? `> ${previousFillup.odometer}` : '0'}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Gallons, Price per Unit, Total Cost Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Amount ({fuelUnit}) *
              </label>
              <input
                type="number"
                step="0.001"
                required
                placeholder="12.450"
                value={gallons}
                onChange={(e) => handleGallonsChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Price / {fuelUnit} ($)
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="3.499"
                value={pricePerUnit}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Total Cost ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="43.56"
                value={totalCost}
                onChange={(e) => handleTotalChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono font-bold text-brand-400"
              />
            </div>
          </div>

          {/* Fuel Grade Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Fuel Grade
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['Regular', 'Midgrade', 'Premium', 'Diesel', 'E85'].map((grade) => (
                <button
                  type="button"
                  key={grade}
                  onClick={() => setFuelGrade(grade)}
                  className={`py-2 text-xs font-medium rounded-xl border transition ${
                    fuelGrade === grade
                      ? 'bg-brand-500/20 border-brand-500 text-brand-400 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Full Tank & Missed Fillup Flags */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsFullTank(!isFullTank)}
              className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                isFullTank
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">Full Tank</div>
                <div className="text-[10px] text-slate-400">Accurate MPG calc</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  isFullTank
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-slate-600'
                }`}
              >
                {isFullTank && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMissed(!isMissed)}
              className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                isMissed
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">Missed Fillup</div>
                <div className="text-[10px] text-slate-400">Skips gap in MPG</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  isMissed
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'border-slate-600'
                }`}
              >
                {isMissed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* Gas Station & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Gas Station Name
              </label>
              <input
                type="text"
                placeholder="e.g. Costco, Chevron, Shell"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Highway drive, tire pressure check, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Receipt Photo Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Receipt Photo
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition">
                <Camera className="w-4 h-4 text-brand-400" />
                <span>{uploadingReceipt ? 'Uploading...' : 'Attach Receipt'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {receiptImage && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Receipt Attached</span>
                  <button
                    type="button"
                    onClick={() => setReceiptImage('')}
                    className="text-slate-400 hover:text-red-400 ml-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Fillup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
