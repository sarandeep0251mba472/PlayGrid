import { useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { subscribeToNotifications } from '../services/gameService';

export function useNotifications(userId: string | undefined, enabled: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !enabled) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToNotifications(
      userId,
      (list) => {
        setNotifications(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId, enabled]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return { notifications, unreadCount, loading };
}
