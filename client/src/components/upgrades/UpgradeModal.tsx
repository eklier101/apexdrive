import React, { useState } from 'react';
import { X, Sparkles, Save, Camera, Check } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { Upgrade } from '../../types';
import { api } from '../../api/client';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeToEdit?: Upgrade | null;
  onSaved?: () => void;
}

const UPGRADE_CATEGORIES = [
  'Performance',
  'Suspension & Brakes',
  'Wheels & Tires',
  'Exhaust',
  'Lighting',
  'Exterior Styling',
  'Interior Styling',
  'Audio & Tech',
  'Armor & Off-road',
  'Tuning & Electronics',
  'Other',
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  upgradeToEdit,
  onSaved,
}) => {
  const { activeVehicle, refreshAll } = useVehicle();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [date, setDate] = useState<string>(
    upgradeToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [odometer, setOdometer] = useState<string>(
    upgradeToEdit?.odometer ? String(upgradeToEdit.odometer) : ''
  );
  const [title, setTitle] = useState<string>(upgradeToEdit?.title || '');
  const [category, setCategory] = useState<string>(
    upgradeToEdit?.category || 'Performance'
  );
  const [brandPartNumber, setBrandPartNumber] = useState<string>(
    upgradeToEdit?.brand_part_number || ''
  );
  const [vendor, setVendor] = useState<string>(upgradeToEdit?.vendor || '');
  const [partCost, setPartCost] = useState<string>(
    upgradeToEdit ? String(upgradeToEdit.part_cost) : ''
  );
  const [laborCost, setLaborCost] = useState<string>(
    upgradeToEdit ? String(upgradeToEdit.labor_cost) : ''
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(
    upgradeToEdit ? upgradeToEdit.is_installed === 1 : true
  );
  const [notes, setNotes] = useState<string>(upgradeToEdit?.notes || '');
  const [photoUrl, setPhotoUrl] = useState<string>(upgradeToEdit?.photo_url || '');

  if (!isOpen || !activeVehicle) return null;

  const totalCalculated =
    (parseFloat(partCost) || 0) + (parseFloat(laborCost) || 0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const res = await api.uploadImage(file);
      setPhotoUrl(res.url);
    } catch (err: any) {
      alert('Failed to upload mod photo: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category) {
      alert('Please fill in title and category.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Upgrade> = {
        vehicle_id: activeVehicle.id,
        date,
        odometer: odometer ? parseFloat(odometer) : null,
        title,
        category,
        brand_part_number: brandPartNumber.trim() || undefined,
        vendor: vendor.trim() || undefined,
        part_cost: parseFloat(partCost) || 0,
        labor_cost: parseFloat(laborCost) || 0,
        total_cost: totalCalculated,
        is_installed: isInstalled ? 1 : 0,
        notes: notes.trim() || undefined,
        photo_url: photoUrl || undefined,
      };

      if (upgradeToEdit) {
        await api.updateUpgrade(upgradeToEdit.id, payload);
      } else {
        await api.addUpgrade(payload);
      }

      await refreshAll();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving upgrade');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {upgradeToEdit ? 'Edit Upgrade / Mod' : 'Log Upgrade & Mod'}
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
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Part / Modification Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Borla Cat-Back Exhaust System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {UPGRADE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Install Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Brand / Part #
              </label>
              <input
                type="text"
                placeholder="e.g. Borla 140824"
                value={brandPartNumber}
                onChange={(e) => setBrandPartNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Vendor / Store
              </label>
              <input
                type="text"
                placeholder="e.g. Summit Racing, Amazon"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Part Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={partCost}
                onChange={(e) => setPartCost(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Labor / Install ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Total ($)
              </label>
              <div className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-purple-400">
                ${totalCalculated.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Odometer at Install
              </label>
              <input
                type="number"
                placeholder="Optional"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsInstalled(!isInstalled)}
              className={`p-3 rounded-2xl border text-left transition flex items-center justify-between mt-4 ${
                isInstalled
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">Installed</div>
                <div className="text-[10px] text-slate-400">On vehicle</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  isInstalled ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-600'
                }`}
              >
                {isInstalled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Notes & Impressions
            </label>
            <textarea
              rows={2}
              placeholder="Sound level, horsepower gains, fitment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Part / Install Photo
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Attach Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {photoUrl && (
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <Check className="w-4 h-4" />
                  <span>Photo Attached</span>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
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
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Upgrade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
