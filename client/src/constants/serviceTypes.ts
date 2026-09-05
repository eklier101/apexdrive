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
