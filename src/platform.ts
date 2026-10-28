import { Capacitor } from '@capacitor/core';
import { deviceSchedule, type ReminderPrefs } from './core/extras';

export const isNative = () => Capacitor.isNativePlatform();

/** Reconocimiento de voz nativo de Android (el WebView no suele exponer SpeechRecognition). */
export async function nativeRecognize(lang: string): Promise<string | null> {
  const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
  const { available } = await SpeechRecognition.available();
  if (!available) return null;
  const p = await SpeechRecognition.requestPermissions();
  if (p.speechRecognition !== 'granted') throw new Error('denied');
  const r = await SpeechRecognition.start({ language: lang, maxResults: 1, partialResults: false, popup: false });
  return r.matches?.[0] ?? null;
}

/** Programa/cancela recordatorios locales nativos (sobreviven con la app cerrada; Android puede retrasarlos por ahorro de batería). */
export async function syncNativeReminders(p: ReminderPrefs & { deviceTz: string }): Promise<'ok' | 'denied' | 'cancelled'> {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications });
  if (!p.daily) return 'cancelled';
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return 'denied';
  const slots = deviceSchedule(p.time, p.days, p.timezone, p.deviceTz);
  await LocalNotifications.schedule({
    notifications: slots.map((s) => ({
      id: 100 + s.dow, title: 'Lingua Songs AI', body: 'Es hora de tu práctica de francés de Canadá.',
      schedule: { on: { weekday: s.dow + 1, hour: s.hour, minute: s.minute }, allowWhileIdle: true },
    })),
  });
  return 'ok';
}
