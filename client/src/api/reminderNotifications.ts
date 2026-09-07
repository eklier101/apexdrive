import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ServiceReminder } from '../types';

const CHANNEL_ID = 'apexdrive_reminders';
const NOTIFIED_KEY = 'vt_reminder_notified';

function notifiedMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveNotified(map: Record<string, string>) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

export async function ensureReminderNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== 'granted') return false;

    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Maintenance Reminders',
      description: 'Alerts when service is due or overdue',
      importance: 4,
      visibility: 1,
    });
    return true;
  } catch (err) {
    console.warn('Reminder notification setup failed:', err);
    return false;
  }
}

/** Notify once per status change for overdue / due_soon reminders. */
export async function syncReminderNotifications(
  reminders: ServiceReminder[],
  vehicleLabel?: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const ok = await ensureReminderNotificationPermission();
  if (!ok) return;

  const prev = notifiedMap();
  const next: Record<string, string> = { ...prev };
  const pending: { id: number; title: string; body: string }[] = [];

  for (const rem of reminders) {
    const status = (rem.status || '').toLowerCase();
    if (status !== 'overdue' && status !== 'due_soon') {
      delete next[rem.id];
      continue;
    }
    const stamp = `${status}:${rem.next_due_odometer || ''}:${rem.next_due_date || ''}`;
    if (prev[rem.id] === stamp) continue;

    const id = Math.abs(
      Array.from(rem.id).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)
    ) % 2147483647;

    const when =
      status === 'overdue' ? 'is overdue' : 'is due soon';
    pending.push({
      id: id || 1,
      title: status === 'overdue' ? 'Maintenance overdue' : 'Maintenance due soon',
      body: `${rem.title || rem.service_type} ${when}${vehicleLabel ? ` · ${vehicleLabel}` : ''}`,
    });
    next[rem.id] = stamp;
  }

  if (pending.length === 0) {
    saveNotified(next);
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: pending.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channelId: CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 1000) },
      })),
    });
    saveNotified(next);
  } catch (err) {
    console.warn('Failed to schedule reminder notifications:', err);
  }
}
