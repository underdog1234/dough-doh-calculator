// Thin wrapper around the browser Notification API. Routed through the
// service worker's registration when one is available, since mobile Chrome
// in particular is unreliable about notifications fired directly from a page
// — falls back to a plain page notification otherwise.
//
// Honest limits: this only fires while the app (tab, or installed PWA) is
// open somewhere and the device hasn't put the browser to sleep. There is no
// push server behind this static site, so it can't wake a closed app.

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
}

export async function showStepNotification({ title, body, tag }) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await withTimeout(navigator.serviceWorker.ready, 2000);
      if (registration?.showNotification) {
        await registration.showNotification(title, { body, tag, renotify: true });
        return true;
      }
    }
    // eslint-disable-next-line no-new
    new Notification(title, { body, tag, renotify: true });
    return true;
  } catch {
    return false;
  }
}
