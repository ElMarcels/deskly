"use client";

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export function ensurePermission(): Promise<NotificationPermission> | null {
  if (!notificationsSupported()) return null;
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
}

export function notify(title: string, body: string): void {
  if (!notificationsSupported()) return;
  if (Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/icons/icon-192.png" }); } catch {}
  }
}

export function scheduleLocalNotification(key: string, title: string, body: string, fireAt: Date): void {
  if (timers.has(key)) return;
  const delay = fireAt.getTime() - Date.now();
  if (delay < 0 || delay > 24 * 60 * 60 * 1000) return;
  const t = setTimeout(() => {
    notify(title, body);
    timers.delete(key);
  }, delay);
  timers.set(key, t);
}

export function cancelLocalNotification(key: string): void {
  const t = timers.get(key);
  if (t) {
    clearTimeout(t);
    timers.delete(key);
  }
}

export function cancelAllLocalNotifications(): void {
  timers.forEach(t => clearTimeout(t));
  timers.clear();
}
