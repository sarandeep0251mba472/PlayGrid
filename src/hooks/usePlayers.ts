import { useEffect, useState } from 'react';
import { PublicPlayerProfile } from '../types';
import { subscribeToPlayerProfiles } from '../services/gameService';

export function usePlayers(enabled: boolean) {
  const [players, setPlayers] = useState<PublicPlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToPlayerProfiles(
      (list) => {
        setPlayers(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, [enabled]);

  return { players, loading };
}
