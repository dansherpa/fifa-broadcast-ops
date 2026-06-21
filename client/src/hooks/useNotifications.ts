import { useCallback, useRef, useState } from 'react';

const VAPID_PUBLIC_KEY = 'BP5KdrV0zcy__MRlpzIcUxMUm6-CIUPYUgH83weNDGr9Hr0yagz1Kiy8ChnzpqnZMEioZ_oDeAXyQFUX7yemIu0';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const permissionRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    permissionRef.current = result;
    setPermission(result);

    if (result === 'granted') {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
      } catch {
        // Push subscription not supported or failed — fall back to in-app only
      }
    }
  }, []);

  const notify = useCallback((title: string, body: string) => {
    // Vibrate
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Play sound
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }

    // Browser notification (when tab is backgrounded)
    if (document.hidden && permissionRef.current === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  }, []);

  return { notify, requestPermission, permission };
}
