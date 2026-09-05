/** Shared maintenance service type labels (services + reminders). */
export const SERVICE_TYPES = [
  'Oil Change',
  'Brake Service',
  'Tire Rotation',
  'Tire Replacement',
  'Cabin Air Filter',
  'Engine Air Filter',
  'Spark Plugs',
  'Battery Replacement',
  'Transmission Fluid',
  'Coolant Flush',
  'Brake Fluid',
  'Alignment',
  'State Inspection',
  'Suspension Repair',
  'Exhaust Repair',
  'Diagnostic & Repair',
  'Other',
] as const;

export const REMINDER_PRESETS: Record<string, { title: string; miles: string; months: string }> = {
  'Oil Change': { title: 'Engine Oil & Filter Change', miles: '5000', months: '6' },
  'Spark Plugs': { title: 'Spark Plug Replacement', miles: '60000', months: '0' },
  'Engine Air Filter': { title: 'Engine Air Filter', miles: '15000', months: '12' },
  'Cabin Air Filter': { title: 'Cabin Air Filter', miles: '15000', months: '12' },
  'Tire Rotation': { title: 'Tire Rotation', miles: '7500', months: '6' },
  'Brake Service': { title: 'Brake Inspection / Service', miles: '20000', months: '24' },
  'Transmission Fluid': { title: 'Transmission Fluid Service', miles: '60000', months: '0' },
  'Coolant Flush': { title: 'Coolant Flush', miles: '50000', months: '60' },
  'Battery Replacement': { title: 'Battery Replacement', miles: '0', months: '48' },
  'State Inspection': { title: 'State Inspection', miles: '0', months: '12' },
};

function normalizeServiceKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[&/,._-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function canonicalServiceType(raw: string): string {
  const s = normalizeServiceKey(raw);
  if (s.includes('oil') && (s.includes('change') || s.includes('filter') || s === 'oil')) return 'oil_change';
  if (s.includes('spark') && s.includes('plug')) return 'spark_plugs';
  if (s.includes('cabin') && s.includes('filter')) return 'cabin_air_filter';
  if (s.includes('engine') && s.includes('air') && s.includes('filter')) return 'engine_air_filter';
  if (s.includes('air filter') && !s.includes('cabin')) return 'engine_air_filter';
  if (s.includes('tire') && s.includes('rotat')) return 'tire_rotation';
  if (s.includes('tire') && (s.includes('replace') || s.includes('new'))) return 'tire_replacement';
  if (s.includes('brake') && s.includes('fluid')) return 'brake_fluid';
  if (s.includes('brake')) return 'brake_service';
  if (s.includes('coolant') || s.includes('antifreeze')) return 'coolant';
  if (s.includes('transmission') || s.includes('trans fluid')) return 'transmission';
  if (s.includes('battery')) return 'battery';
  if (s.includes('align')) return 'alignment';
  if (s.includes('inspect')) return 'inspection';
  return s;
}

/** Mirror of server ServiceMatchesReminder for picking the last logged service. */
export function serviceMatchesReminderType(
  serviceType: string,
  title: string,
  reminderType: string
): boolean {
  const rem = normalizeServiceKey(reminderType);
  if (!rem) return false;
  const svcType = normalizeServiceKey(serviceType);
  const svcTitle = normalizeServiceKey(title);
  if (svcType === rem || svcTitle === rem) return true;
  if (svcType.includes(rem) || svcTitle.includes(rem)) return true;
  if (rem.includes(svcType) && svcType.length >= 4) return true;
  const remCanon = canonicalServiceType(rem);
  const svcCanon = canonicalServiceType(svcType);
  const titleCanon = canonicalServiceType(svcTitle);
  return Boolean(remCanon && (remCanon === svcCanon || remCanon === titleCanon));
}
