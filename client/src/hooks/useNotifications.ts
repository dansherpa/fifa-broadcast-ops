import { useCallback, useRef } from 'react';

export function useNotifications() {
  const permissionRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (permissionRef.current === 'default') {
      const result = await Notification.requestPermission();
      permissionRef.current = result;
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
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  return { notify, requestPermission };
}
